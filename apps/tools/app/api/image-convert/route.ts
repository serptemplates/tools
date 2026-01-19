import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import ffmpegPath from "ffmpeg-static";
import { canUseMagickWasm, convertWithMagickWasm } from "@/lib/convert/magickWasm";

export const runtime = "nodejs";

const IMAGE_OUTPUTS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "bmp",
  "tiff",
  "tif",
  "svg",
  "ico",
  "cur",
  "tga",
  "dds",
  "psd",
  "apng",
  "xcf",
  "ai",
]);
const RAW_INPUTS = new Set(["cr2", "cr3", "dng", "arw"]);
const MAGICK_ONLY_INPUTS = new Set(["psd", "tga", "dds", "xcf", "ai"]);
const MAGICK_ONLY_OUTPUTS = new Set(["tga", "dds", "cur"]);
const FFMPEG_BINARY = ffmpegPath && existsSync(ffmpegPath) ? ffmpegPath : "ffmpeg";
const OUTPUT_MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  tiff: "image/tiff",
  tif: "image/tiff",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  cur: "image/x-icon",
  tga: "image/x-tga",
  dds: "image/vnd-ms.dds",
  psd: "image/vnd.adobe.photoshop",
  apng: "image/apng",
  xcf: "image/x-xcf",
  ai: "application/postscript",
};

function resolveOutputExtension(to: string) {
  if (to === "jpeg") return "jpg";
  if (to === "tif") return "tiff";
  return to;
}

function resolveOutputMime(to: string) {
  return OUTPUT_MIME_MAP[to] ?? "application/octet-stream";
}

function buildFfmpegArgs(to: string, inputPath: string, outputPath: string) {
  const args = ["-y", "-i", inputPath, "-frames:v", "1"];

  switch (to) {
    case "jpg":
    case "jpeg":
      args.push("-q:v", "3");
      break;
    case "webp":
      args.push("-q:v", "80");
      break;
    case "png":
      args.push("-compression_level", "6");
      break;
    case "gif":
      args.push("-loop", "0");
      break;
    case "tif":
    case "tiff":
      args.push("-compression_level", "6");
      break;
    default:
      break;
  }

  args.push(outputPath);
  return args;
}

function buildMagickArgs(to: string, inputPath: string, outputPath: string) {
  const output = resolveOutputExtension(to);
  const args = [inputPath];

  switch (output) {
    case "jpg":
      args.push("-quality", "85");
      break;
    case "webp":
      args.push("-quality", "80");
      break;
    case "png":
      args.push("-define", "png:compression-level=6");
      break;
    case "tiff":
      args.push("-define", "tiff:compression=zip");
      break;
    default:
      break;
  }

  args.push(outputPath);
  return args;
}

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn(FFMPEG_BINARY, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr || `ffmpeg exited with code ${code}`));
    });
  });
}

function runMagick(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn("magick", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr || `magick exited with code ${code}`));
    });
  });
}

async function runExiftoolBinary(args: string[]) {
  return new Promise<Buffer>((resolve, reject) => {
    const proc = spawn("exiftool", args, { stdio: ["ignore", "pipe", "pipe"] });
    const chunks: Buffer[] = [];
    let stderr = "";
    proc.stdout.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
        return;
      }
      reject(new Error(stderr || `exiftool exited with code ${code}`));
    });
  });
}

async function extractRawPreview(inputPath: string) {
  try {
    const preview = await runExiftoolBinary(["-b", "-PreviewImage", inputPath]);
    if (preview.length) return preview;
  } catch {
    // ignore and try alternate tag
  }
  const fallback = await runExiftoolBinary(["-b", "-JpgFromRaw", inputPath]);
  if (!fallback.length) {
    throw new Error("No preview image available in raw file.");
  }
  return fallback;
}

async function convertRawImage(args: {
  from: string;
  to: string;
  inputPath: string;
  outputPath: string;
  workDir: string;
  inputBuffer: Buffer;
}) {
  try {
    await runMagick(buildMagickArgs(args.to, args.inputPath, args.outputPath));
    return;
  } catch {
    if (canUseMagickWasm(args.from, args.to)) {
      const output = await convertWithMagickWasm(args.inputBuffer, args.from, args.to);
      await fs.writeFile(args.outputPath, output);
      return;
    }
  }

  const preview = await extractRawPreview(args.inputPath);
  const previewPath = path.join(args.workDir, "preview.jpg");
  await fs.writeFile(previewPath, preview);

  const outputFormat = resolveOutputExtension(args.to);
  if (outputFormat === "jpg") {
    await fs.copyFile(previewPath, args.outputPath);
    return;
  }

  try {
    await runMagick(buildMagickArgs(args.to, previewPath, args.outputPath));
  } catch {
    if (!canUseMagickWasm("jpg", args.to)) {
      throw new Error("Magick WASM does not support raw preview conversion.");
    }
    const output = await convertWithMagickWasm(preview, "jpg", args.to);
    await fs.writeFile(args.outputPath, output);
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from")?.toLowerCase();
  const to = url.searchParams.get("to")?.toLowerCase();

  if (!from || !to) {
    return new Response(JSON.stringify({ error: "Missing from/to parameters" }), { status: 400 });
  }

  if (!IMAGE_OUTPUTS.has(to)) {
    return new Response(JSON.stringify({ error: `Unsupported output format: ${to}` }), { status: 400 });
  }

  const inputBuffer = Buffer.from(await request.arrayBuffer());
  if (!inputBuffer.length) {
    return new Response(JSON.stringify({ error: "Empty input buffer" }), { status: 400 });
  }

  const runId = randomUUID();
  const workDir = await fs.mkdtemp(path.join(tmpdir(), `serp-image-${runId}-`));

  try {
    const inputPath = path.join(workDir, `input.${from}`);
    const outputExt = resolveOutputExtension(to);
    const outputPath = path.join(workDir, `output.${outputExt}`);
    await fs.writeFile(inputPath, inputBuffer);

    if (RAW_INPUTS.has(from)) {
      await convertRawImage({ from, to, inputPath, outputPath, workDir, inputBuffer });
    } else {
      const shouldUseMagick = MAGICK_ONLY_INPUTS.has(from) || MAGICK_ONLY_OUTPUTS.has(to);
      if (shouldUseMagick && canUseMagickWasm(from, to)) {
        const output = await convertWithMagickWasm(inputBuffer, from, to);
        return new Response(output, {
          headers: {
            "Content-Type": resolveOutputMime(to),
            "Content-Length": output.length.toString(),
          },
        });
      }

      try {
        const args = buildFfmpegArgs(to, inputPath, outputPath);
        await runFfmpeg(args);
      } catch (error) {
        if (canUseMagickWasm(from, to)) {
          const output = await convertWithMagickWasm(inputBuffer, from, to);
          return new Response(output, {
            headers: {
              "Content-Type": resolveOutputMime(to),
              "Content-Length": output.length.toString(),
            },
          });
        }
        throw error;
      }
    }

    const outputBuffer = await fs.readFile(outputPath);
    return new Response(outputBuffer, {
      headers: {
        "Content-Type": resolveOutputMime(to),
        "Content-Length": outputBuffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "FFmpeg failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
    });
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}
