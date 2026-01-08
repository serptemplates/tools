import { randomUUID } from "node:crypto";
import { createReadStream, existsSync, promises as fs } from "node:fs";
import dns from "node:dns/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { Readable } from "node:stream";
import ipaddr from "ipaddr.js";
import { extension as extensionForType, lookup as lookupMime } from "mime-types";
import { create as createYtDlp } from "youtube-dl-exec";
import { AUDIO_FORMATS, VIDEO_FORMATS } from "../../../lib/capabilities";

export const runtime = "nodejs";

const SUPPORTED_EXTENSIONS = new Set([...AUDIO_FORMATS, ...VIDEO_FORMATS]);
const runtimeBinaryName = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
const runtimeBinaryPath = path.join(tmpdir(), "serp-yt-dlp", runtimeBinaryName);
const YTDLP_CANDIDATES = [
  runtimeBinaryPath,
  path.resolve(process.cwd(), "node_modules/youtube-dl-exec/bin", runtimeBinaryName),
  path.resolve(process.cwd(), "apps/tools/node_modules/youtube-dl-exec/bin", runtimeBinaryName),
];
let youtubedlInstance: ReturnType<typeof createYtDlp> | null = null;
let ytdlpDownloadPromise: Promise<string> | null = null;

async function downloadYtDlpBinary(targetPath: string) {
  const downloadHost =
    process.env.YTDLP_BINARY_URL ??
    process.env.YOUTUBE_DL_HOST ??
    "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest";
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  let response = await fetch(downloadHost, { headers });
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/octet-stream")) {
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(JSON.stringify(payload));
    }
    const assets = Array.isArray(payload?.assets) ? payload.assets : [];
    const match = assets.find((asset) => asset?.name === runtimeBinaryName);
    if (!match?.browser_download_url) {
      throw new Error("Unable to locate yt-dlp binary in release assets.");
    }
    response = await fetch(match.browser_download_url, { headers });
  }

  if (!response.ok) {
    throw new Error("Failed to download yt-dlp binary.");
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(targetPath, buffer);
  await fs.chmod(targetPath, 0o755);
  return targetPath;
}

async function resolveYtDlpBinaryPath() {
  const candidate = YTDLP_CANDIDATES.find((pathToCheck) => existsSync(pathToCheck));
  if (candidate) return candidate;

  if (!ytdlpDownloadPromise) {
    ytdlpDownloadPromise = downloadYtDlpBinary(runtimeBinaryPath);
  }

  try {
    return await ytdlpDownloadPromise;
  } finally {
    ytdlpDownloadPromise = null;
  }
}

async function getYtDlpInstance() {
  if (youtubedlInstance) return youtubedlInstance;
  const binaryPath = await resolveYtDlpBinaryPath();
  if (!binaryPath) {
    throw new Error("yt-dlp binary not found and could not be downloaded.");
  }
  youtubedlInstance = createYtDlp(binaryPath);
  return youtubedlInstance;
}

type UrlPayload = {
  url?: string;
  mode?: "audio" | "video";
};

function normalizeContentType(value: string | null) {
  if (!value) return "";
  return value.split(";")[0]?.trim().toLowerCase() ?? "";
}

function getExtensionFromPath(pathname: string) {
  const match = pathname.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
}

function getFileNameFromUrl(url: URL) {
  const raw = url.pathname.split("/").filter(Boolean).pop() || "remote-file";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function getExtensionFromName(name: string) {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
}

function parseContentDispositionFilename(header: string | null) {
  if (!header) return "";
  const utfMatch = header.match(/filename\\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch {
      return utfMatch[1];
    }
  }
  const asciiMatch = header.match(/filename="([^"]+)"/i);
  if (asciiMatch?.[1]) return asciiMatch[1];
  const fallbackMatch = header.match(/filename=([^;]+)/i);
  if (fallbackMatch?.[1]) return fallbackMatch[1].trim();
  return "";
}

function isBlockedAddress(address: ipaddr.IPv4 | ipaddr.IPv6) {
  let resolved: ipaddr.IPv4 | ipaddr.IPv6 = address;
  if (resolved.kind() === "ipv6") {
    const ipv6 = resolved as ipaddr.IPv6;
    if (ipv6.isIPv4MappedAddress()) {
      resolved = ipv6.toIPv4Address();
    }
  }
  return resolved.range() !== "unicast";
}

async function assertPublicUrl(url: URL) {
  const hostname = url.hostname.toLowerCase();
  if (!hostname) {
    throw new Error("Invalid URL host.");
  }
  if (hostname === "localhost" || hostname.endsWith(".local")) {
    throw new Error("Localhost URLs are not supported.");
  }

  if (ipaddr.isValid(hostname)) {
    const parsed = ipaddr.parse(hostname);
    if (isBlockedAddress(parsed)) {
      throw new Error("Private network URLs are not supported.");
    }
    return;
  }

  const addresses = await dns.lookup(hostname, { all: true });
  if (!addresses.length) {
    throw new Error("Unable to resolve the URL host.");
  }
  for (const entry of addresses) {
    if (!ipaddr.isValid(entry.address)) continue;
    const parsed = ipaddr.parse(entry.address);
    if (isBlockedAddress(parsed)) {
      throw new Error("Private network URLs are not supported.");
    }
  }
}

function buildResponseHeaders(args: {
  contentType: string;
  contentLength?: number | null;
  fileName: string;
  extension: string;
}) {
  const headers = new Headers();
  if (args.contentType) {
    headers.set("content-type", args.contentType);
  }
  if (typeof args.contentLength === "number" && Number.isFinite(args.contentLength)) {
    headers.set("content-length", String(args.contentLength));
  }
  headers.set("x-media-filename", args.fileName);
  headers.set("x-media-extension", args.extension);
  headers.set("cache-control", "no-store");
  return headers;
}

async function tryDirectFetch(targetUrl: URL) {
  const response = await fetch(targetUrl.toString(), {
    method: "GET",
    redirect: "follow",
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; SerpToolsBot/1.0)",
      accept: "*/*",
    },
  });

  const contentType = normalizeContentType(response.headers.get("content-type"));
  const extFromUrl = getExtensionFromPath(targetUrl.pathname);
  const extFromType =
    contentType && typeof extensionForType(contentType) === "string"
      ? String(extensionForType(contentType))
      : "";

  const isMediaType =
    contentType.startsWith("audio/") || contentType.startsWith("video/");
  const hasSupportedExt =
    (extFromUrl && SUPPORTED_EXTENSIONS.has(extFromUrl)) ||
    (extFromType && SUPPORTED_EXTENSIONS.has(extFromType));

  if (!response.ok || (!isMediaType && !hasSupportedExt)) {
    response.body?.cancel();
    return null;
  }

  const dispositionName = parseContentDispositionFilename(
    response.headers.get("content-disposition")
  );
  const fallbackName = dispositionName || getFileNameFromUrl(targetUrl);
  const extension =
    (extFromUrl && SUPPORTED_EXTENSIONS.has(extFromUrl) ? extFromUrl : "") ||
    (extFromType && SUPPORTED_EXTENSIONS.has(extFromType) ? extFromType : "");

  if (!extension) {
    response.body?.cancel();
    return null;
  }

  const fileName = getExtensionFromName(fallbackName)
    ? fallbackName
    : `${fallbackName}.${extension}`;

  const headers = buildResponseHeaders({
    contentType: contentType || "application/octet-stream",
    contentLength: response.headers.get("content-length")
      ? Number(response.headers.get("content-length"))
      : null,
    fileName,
    extension,
  });

  return new Response(response.body, { status: 200, headers });
}

async function streamDownloadedFile(
  filePath: string,
  fileName: string,
  onDone: () => void
) {
  const stat = await fs.stat(filePath);
  const extension = getExtensionFromName(fileName);
  if (!extension || !SUPPORTED_EXTENSIONS.has(extension)) {
    throw new Error("Downloaded media type is not supported.");
  }

  const contentType = lookupMime(fileName) || "application/octet-stream";
  const headers = buildResponseHeaders({
    contentType: String(contentType),
    contentLength: stat.size,
    fileName,
    extension,
  });

  const stream = createReadStream(filePath);
  stream.on("close", onDone);
  stream.on("error", onDone);
  const body = Readable.toWeb(stream) as unknown as BodyInit;
  return new Response(body, { status: 200, headers });
}

async function fetchViaYtDlp(targetUrl: URL, mode: "audio" | "video") {
  const runId = randomUUID();
  const workDir = await fs.mkdtemp(path.join(tmpdir(), `serp-media-${runId}-`));
  const outputTemplate = path.join(workDir, "download.%(ext)s");
  const youtubedl = await getYtDlpInstance();
  const isVideo = mode === "video";
  const format = isVideo ? "best" : "bestaudio/best";

  try {
    await youtubedl(targetUrl.toString(), {
      output: outputTemplate,
      format,
      noPlaylist: true,
      noWarnings: true,
    });

    const entries = await fs.readdir(workDir);
    const fileName = entries.find(
      (entry) => entry.startsWith("download.") && !entry.endsWith(".part")
    );
    if (!fileName) {
      throw new Error("Unable to download media from that link.");
    }

    const filePath = path.join(workDir, fileName);
    const cleanup = async () => {
      try {
        await fs.rm(workDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup failures
      }
    };
    return await streamDownloadedFile(filePath, fileName, cleanup);
  } catch (err) {
    await fs.rm(workDir, { recursive: true, force: true });
    throw err;
  }
}

export async function POST(request: Request) {
  let payload: UrlPayload | null = null;
  try {
    payload = (await request.json()) as UrlPayload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON." }), { status: 400 });
  }

  if (!payload?.url) {
    return new Response(JSON.stringify({ error: "Missing url." }), { status: 400 });
  }

  if (payload.mode && payload.mode !== "audio" && payload.mode !== "video") {
    return new Response(JSON.stringify({ error: "Invalid mode." }), { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(payload.url);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid url." }), { status: 400 });
  }

  if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
    return new Response(JSON.stringify({ error: "Only http(s) URLs are supported." }), {
      status: 400,
    });
  }

  try {
    await assertPublicUrl(targetUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "URL is not allowed.";
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }

  const mode = payload.mode ?? "audio";

  try {
    const directResponse = await tryDirectFetch(targetUrl);
    if (directResponse) {
      return directResponse;
    }
    return await fetchViaYtDlp(targetUrl, mode);
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : "";
    const stderr =
      typeof err === "object" && err && "stderr" in err
        ? String((err as { stderr?: unknown }).stderr ?? "")
        : "";
    const trimmedStderr = stderr.trim().split("\n")[0] || "";
    const message = errMessage || trimmedStderr || "Failed to fetch media.";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
