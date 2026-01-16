"use client";

import { useState } from "react";
import { Button } from "@serp-tools/ui/components/button";
import { saveBlob } from "@/components/saveAs";
import { ToolHeroLayout } from "@/components/ToolHeroLayout";
import type { ToolProgressFile } from "@/components/ToolProgressIndicator";
import { beginToolRun } from "@/lib/telemetry";
import { AUDIO_FORMATS, VIDEO_FORMATS } from "@/lib/capabilities";

type ProgressUpdate = {
  receivedBytes: number;
  totalBytes?: number;
  ratio?: number;
  etaSeconds?: number;
};

type Props = {
  toolId: string;
  title: string;
  subtitle?: string;
  mode?: "audio" | "video";
};

const SUPPORTED_EXTENSIONS = new Set([...AUDIO_FORMATS, ...VIDEO_FORMATS]);

const MIME_EXTENSION_MAP: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/aiff": "aiff",
  "audio/x-aiff": "aiff",
  "audio/flac": "flac",
  "audio/x-flac": "flac",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/ogg": "ogg",
  "audio/opus": "opus",
  "audio/webm": "webm",
  "audio/3gpp": "3gp",
  "audio/3gpp2": "3g2",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/ogg": "ogv",
  "video/x-matroska": "mkv",
  "video/x-msvideo": "avi",
  "video/x-flv": "flv",
  "video/x-ms-asf": "asf",
  "video/x-ms-wmv": "wmv",
  "video/3gpp": "3gp",
  "video/3gpp2": "3g2",
};

function getExtensionFromName(name: string) {
  return name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
}

function getFileNameFromUrl(url: URL) {
  const raw = url.pathname.split("/").filter(Boolean).pop() || "download";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function parseUrlInput(value: string) {
  if (!value?.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const precision = value < 10 && unitIndex > 0 ? 1 : 0;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

function formatDuration(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "";
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${remaining}s`;
  return `${remaining}s`;
}

async function downloadUrlToBlob(
  url: URL,
  mode: "audio" | "video",
  onProgress?: (update: ProgressUpdate) => void
) {
  const response = await fetch("/api/media-fetch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: url.toString(), mode }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const data = await response.json();
      if (data?.error) {
        detail = data.error;
      }
    } catch {
      detail = "";
    }
    const suffix = detail ? `: ${detail}` : "";
    throw new Error(`Download failed (${response.status})${suffix}`);
  }

  const contentTypeRaw = response.headers.get("content-type") || "";
  const contentType = contentTypeRaw.split(";")[0]?.trim().toLowerCase() || "";
  const fileNameFromHeader = response.headers.get("x-media-filename")?.trim() || "";
  const fileNameFromUrl = getFileNameFromUrl(url);
  const fileNameCandidate = fileNameFromHeader || fileNameFromUrl;
  const extensionFromHeader =
    response.headers.get("x-media-extension")?.trim().toLowerCase() || "";
  const extensionFromName = getExtensionFromName(fileNameCandidate);
  const extensionFromType = MIME_EXTENSION_MAP[contentType] || "";
  const extension = SUPPORTED_EXTENSIONS.has(extensionFromName)
    ? extensionFromName
    : extensionFromHeader && SUPPORTED_EXTENSIONS.has(extensionFromHeader)
      ? extensionFromHeader
      : extensionFromType;
  const looksLikeMedia =
    contentType.startsWith("audio/") || contentType.startsWith("video/");

  if (!extension || !SUPPORTED_EXTENSIONS.has(extension)) {
    if (looksLikeMedia) {
      throw new Error(
        "This link returns a media type we do not support yet. Try another link."
      );
    }
    throw new Error(
      "That link does not look like a supported media file. Try another link."
    );
  }

  let fileName = fileNameCandidate || "download";
  if (!getExtensionFromName(fileName)) {
    fileName = `${fileName}.${extension}`;
  }

  const totalBytesHeader = response.headers.get("content-length");
  const totalBytes = totalBytesHeader ? Number(totalBytesHeader) : 0;
  const hasTotalBytes = Number.isFinite(totalBytes) && totalBytes > 0;

  if (!response.body) {
    const buffer = await response.arrayBuffer();
    return {
      blob: new Blob([buffer], { type: contentType || "application/octet-stream" }),
      fileName,
    };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;
  const startedAt = performance.now();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    receivedBytes += value.byteLength;

    const elapsed = (performance.now() - startedAt) / 1000;
    const speed = elapsed > 0 ? receivedBytes / elapsed : 0;
    const ratio = hasTotalBytes ? Math.min(1, receivedBytes / totalBytes) : undefined;
    const etaSeconds =
      hasTotalBytes && speed > 0 ? Math.max(0, (totalBytes - receivedBytes) / speed) : undefined;

    onProgress?.({
      receivedBytes,
      totalBytes: hasTotalBytes ? totalBytes : undefined,
      ratio,
      etaSeconds,
    });
  }

  const blobParts = chunks.map((chunk) => {
    const slice = chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength);
    if (slice instanceof SharedArrayBuffer) {
      const copy = new ArrayBuffer(slice.byteLength);
      new Uint8Array(copy).set(new Uint8Array(slice));
      return copy;
    }
    return slice;
  });
  const blob = new Blob(blobParts, { type: contentType || "application/octet-stream" });
  return { blob, fileName };
}

export default function VideoDownloaderTool({
  toolId,
  title,
  subtitle,
  mode = "video",
}: Props) {
  const [busy, setBusy] = useState(false);
  const [currentFile, setCurrentFile] = useState<ToolProgressFile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [adsVisible, setAdsVisible] = useState(false);

  async function handleUrlSubmit() {
    if (busy) return;
    const parsedUrl = parseUrlInput(urlInput);
    if (!parsedUrl) {
      setErrorMessage("Paste a valid public URL first.");
      return;
    }

    if (!adsVisible) setAdsVisible(true);
    setErrorMessage(null);
    setBusy(true);

    const nameHint = getFileNameFromUrl(parsedUrl);
    setCurrentFile({
      name: nameHint,
      progress: 0,
      status: "loading",
      message: "Starting download...",
    });

    const run = beginToolRun({
      toolId,
      from: "url",
      to: mode === "video" ? "mp4" : "audio",
      metadata: { source: "url", mode, urlHost: parsedUrl.host },
    });

    try {
      const result = await downloadUrlToBlob(parsedUrl, mode, (update) => {
        const hasRatio = typeof update.ratio === "number";
        const ratio = update.ratio ?? 0;
        const progress = hasRatio ? Math.round(ratio * 100) : 0;
        const percent = hasRatio ? Math.round(ratio * 100) : null;
        const eta = update.etaSeconds ? formatDuration(update.etaSeconds) : "";
        const received = formatBytes(update.receivedBytes);
        const total = update.totalBytes ? formatBytes(update.totalBytes) : "";

        let message = "Downloading...";
        if (percent !== null) {
          message = `Downloading... ${percent}%`;
        }
        if (total) {
          message += ` (${received} / ${total}`;
          if (eta) {
            message += `, ~${eta} left`;
          }
          message += ")";
        } else {
          message += ` (${received})`;
        }

        setCurrentFile({
          name: nameHint,
          progress,
          status: "loading",
          message,
        });
      });

      saveBlob(result.blob, result.fileName);
      run.finishSuccess({
        outputBytes: result.blob.size,
        metadata: { fileName: result.fileName, source: "url", mode },
      });
      setCurrentFile({
        name: result.fileName,
        progress: 100,
        status: "completed",
        message: "Download ready!",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Download failed";
      setCurrentFile({
        name: nameHint,
        progress: 0,
        status: "error",
        message,
      });
      run.finishFailure({ errorCode: message || "download_failed" });
    } finally {
      setBusy(false);
    }
  }

  const adSlotPrefix = toolId;

  return (
    <ToolHeroLayout
      adsVisible={adsVisible}
      adSlotPrefix={adSlotPrefix}
      currentFile={currentFile}
      progressCompletedLabel="Download complete!"
      contentClassName="text-center"
      containerClassName="max-w-6xl px-6 py-10"
      hero={
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 shadow-sm">
          <div className="mx-auto max-w-2xl space-y-4">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="url"
                inputMode="url"
                placeholder="Paste a public link (YouTube, Vimeo, Loom, or direct file)"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleUrlSubmit();
                  }
                }}
                className="h-12 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={busy}
                data-testid="tool-url-input"
              />
              <Button
                size="lg"
                className="h-12 px-6"
                onClick={handleUrlSubmit}
                disabled={busy || !urlInput.trim()}
                data-testid="tool-url-submit"
              >
                {busy ? "Working..." : "DOWNLOAD"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Public links only. Private or logged-in content is not supported yet.
            </p>
          </div>
        </div>
      }
      below={
        errorMessage ? (
          <div className="mt-4 text-sm text-red-600">{errorMessage}</div>
        ) : null
      }
    />
  );
}
