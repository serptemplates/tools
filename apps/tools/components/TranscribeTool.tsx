"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@serp-tools/ui/components/button";
import { Card } from "@serp-tools/ui/components/card";
import { saveBlob } from "@/components/saveAs";
import { VideoProgress } from "@/components/VideoProgress";
import { ToolAdInline, ToolAdRail } from "@/components/ToolAds";
import { beginToolRun } from "@/lib/telemetry";
import { extractAudioForTranscription } from "@/lib/convert/video";
import { AUDIO_FORMATS, VIDEO_FORMATS } from "@/lib/capabilities";

type ProgressUpdate = {
  progress?: number;
  message?: string;
};

type Props = {
  toolId: string;
  title: string;
  subtitle?: string;
};

const SUPPORTED_EXTENSIONS = Array.from(new Set([...AUDIO_FORMATS, ...VIDEO_FORMATS]));
const ACCEPT_ATTR = SUPPORTED_EXTENSIONS.map((ext) => `.${ext}`).join(",");

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

const DOWNLOAD_PROGRESS_MAX = 20;
const EXTRACTION_PROGRESS_END = 55;
const AUDIO_SAMPLE_RATE = 16000;
const AUDIO_BYTES_PER_SAMPLE = 4;

function getExtensionFromName(name: string): string {
  return name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
}

function getExtension(file: File) {
  const fromName = getExtensionFromName(file.name);
  if (fromName) return fromName;
  const mapped = MIME_EXTENSION_MAP[file.type?.toLowerCase() ?? ""];
  return mapped ?? "";
}

function buildOutputName(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, "");
  return `${base || fileName}.txt`;
}

function getFileNameFromUrl(url: URL) {
  const raw = url.pathname.split("/").filter(Boolean).pop() || "remote-file";
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

export default function TranscribeTool({ toolId, title, subtitle }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("or drop files here");
  const [dropEffect, setDropEffect] = useState<string>("");
  const [currentFile, setCurrentFile] = useState<{
    name: string;
    progress: number;
    status: "loading" | "processing" | "completed" | "error";
    message?: string;
  } | null>(null);
  const [transcript, setTranscript] = useState("");
  const [transcriptName, setTranscriptName] = useState("transcript.txt");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [adsVisible, setAdsVisible] = useState(false);

  const colors = [
    "#ef4444",
    "#f59e0b",
    "#22c55e",
    "#3b82f6",
    "#a855f7",
    "#ec4899",
    "#14b8a6",
    "#f97316",
    "#6366f1",
    "#f43f5e",
    "#0ea5e9",
    "#84cc16",
  ];

  const hashCode = toolId.split("").reduce((hash, char) => {
    return char.charCodeAt(0) + ((hash << 5) - hash);
  }, 0);
  const randomColor = colors[Math.abs(hashCode) % colors.length];

  function ensureWorker() {
    if (!workerRef.current) {
      const workerUrl = new URL("../workers/transcribe.worker.js", import.meta.url);
      workerRef.current = new Worker(workerUrl, { type: "module" });
    }
    return workerRef.current;
  }

  function onPick() {
    inputRef.current?.click();
  }

  async function transcribeWithWorker(args: {
    worker: Worker;
    audioBuffer: ArrayBuffer;
    onProgress?: (update: ProgressUpdate) => void;
  }): Promise<string> {
    return await new Promise((resolve, reject) => {
      args.worker.onmessage = (ev) => {
        if (!ev.data) {
          reject(new Error("Malformed worker response"));
          return;
        }

        if (ev.data.type === "progress") {
          args.onProgress?.({
            progress: ev.data.progress,
            message: ev.data.message,
          });
          return;
        }

        if (ev.data.type === "result") {
          resolve(ev.data.text ?? "");
          return;
        }

        if (ev.data.type === "error") {
          reject(new Error(ev.data.error || "Transcription failed"));
          return;
        }

        reject(new Error("Unknown worker response"));
      };

      args.worker.onerror = (error) => {
        const detailParts = [
          error?.message,
          error?.filename,
          error?.lineno,
          error?.colno,
        ].filter(Boolean);
        const detail = detailParts.length ? detailParts.join(" | ") : String(error);
        reject(new Error(`Worker error: ${detail}`));
      };

      args.worker.postMessage({ audioBuffer: args.audioBuffer }, [args.audioBuffer]);
    });
  }

  async function downloadUrlToFile(
    url: URL,
    onProgress?: (update: {
      receivedBytes: number;
      totalBytes?: number;
      ratio?: number;
      etaSeconds?: number;
    }) => void
  ) {
    const response = await fetch("/api/media-fetch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.toString(), mode: "audio" }),
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
    const fileNameFromHeader =
      response.headers.get("x-media-filename")?.trim() || "";
    const fileNameFromUrl = getFileNameFromUrl(url);
    const fileNameCandidate = fileNameFromHeader || fileNameFromUrl;
    const extensionFromHeader =
      response.headers.get("x-media-extension")?.trim().toLowerCase() || "";
    const extensionFromName = getExtensionFromName(fileNameCandidate);
    const extensionFromType = MIME_EXTENSION_MAP[contentType] || "";
    const extension = SUPPORTED_EXTENSIONS.includes(extensionFromName)
      ? extensionFromName
      : extensionFromHeader && SUPPORTED_EXTENSIONS.includes(extensionFromHeader)
        ? extensionFromHeader
        : extensionFromType;
    const looksLikeMedia =
      contentType.startsWith("audio/") || contentType.startsWith("video/");

    if (!extension || !SUPPORTED_EXTENSIONS.includes(extension)) {
      if (looksLikeMedia) {
        throw new Error(
          "This link returns a media type we do not support yet. Try downloading the file and uploading it."
        );
      }
      throw new Error(
        "That link does not look like a supported audio/video file. Try another link or upload the file."
      );
    }

    let fileName = fileNameCandidate || "remote-file";
    if (!getExtensionFromName(fileName)) {
      fileName = `${fileName}.${extension}`;
    }

    const totalBytesHeader = response.headers.get("content-length");
    const totalBytes = totalBytesHeader ? Number(totalBytesHeader) : 0;
    const hasTotalBytes = Number.isFinite(totalBytes) && totalBytes > 0;

    if (!response.body) {
      const buffer = await response.arrayBuffer();
      return new File([buffer], fileName, {
        type: contentType || "application/octet-stream",
      });
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
    return new File([blob], fileName, {
      type: contentType || "application/octet-stream",
    });
  }

  async function processFile(args: {
    file: File;
    worker: Worker;
    progressOffset?: number;
    source?: "upload" | "url";
  }) {
    const { file, worker, source = "upload" } = args;
    const ext = getExtension(file);
    if (!ext || !SUPPORTED_EXTENSIONS.includes(ext)) {
      setErrorMessage("Unsupported file type. Please upload an audio or video file.");
      return;
    }

    setErrorMessage(null);
    setTranscript("");

    const run = beginToolRun({
      toolId,
      from: ext,
      to: "txt",
      inputBytes: file.size,
      metadata: { fileName: file.name, source },
    });

    const extractionStart = args.progressOffset ?? 0;
    const extractionRange = Math.max(0, EXTRACTION_PROGRESS_END - extractionStart);

    setCurrentFile({
      name: file.name,
      progress: extractionStart,
      status: "processing",
      message: "Preparing transcript...",
    });

    try {
      const buf = await file.arrayBuffer();
      const audioBuffer = await extractAudioForTranscription(buf, ext, {
        onProgress: (progress) => {
          const ratio = Math.max(0, Math.min(1, progress.ratio || 0));
          const extractionProgress = Math.round(extractionStart + ratio * extractionRange);
          setCurrentFile({
            name: file.name,
            progress: extractionProgress,
            status: "processing",
            message: "Extracting audio...",
          });
        },
      });

      const audioSeconds =
        audioBuffer.byteLength / (AUDIO_SAMPLE_RATE * AUDIO_BYTES_PER_SAMPLE);
      const audioDurationLabel = formatDuration(audioSeconds);
      const audioLengthNote = audioDurationLabel ? `audio length ${audioDurationLabel}` : "";

      const text = await transcribeWithWorker({
        worker,
        audioBuffer,
        onProgress: (update) => {
          const baseMessage = update.message || "Transcribing...";
          const includeLength =
            audioLengthNote && baseMessage.toLowerCase().includes("transcrib");
          const message = includeLength ? `${baseMessage} (${audioLengthNote})` : baseMessage;
          setCurrentFile({
            name: file.name,
            progress: update.progress || EXTRACTION_PROGRESS_END,
            status: "processing",
            message,
          });
        },
      });

      if (!text) {
        throw new Error("Transcription produced empty output.");
      }

      setTranscript(text);
      const blob = new Blob([text], { type: "text/plain" });
      const outputName = buildOutputName(file.name);
      setTranscriptName(outputName);
      saveBlob(blob, outputName);

      run.finishSuccess({
        outputBytes: blob.size,
        metadata: {
          audioSeconds: Math.round(audioSeconds),
          source,
        },
      });
      setCurrentFile({
        name: file.name,
        progress: 100,
        status: "completed",
        message: "Transcription complete!",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transcription failed";
      setCurrentFile({
        name: file.name,
        progress: 0,
        status: "error",
        message,
      });
      run.finishFailure({ errorCode: message || "transcribe_failed" });
    }
  }

  async function handleUrlSubmit() {
    if (busy) return;
    const parsedUrl = parseUrlInput(urlInput);
    if (!parsedUrl) {
      setErrorMessage("Paste a valid public URL first.");
      return;
    }

    if (!adsVisible) setAdsVisible(true);
    setErrorMessage(null);
    setTranscript("");

    const worker = ensureWorker();
    const nameHint = getFileNameFromUrl(parsedUrl);

    setBusy(true);
    setCurrentFile({
      name: nameHint,
      progress: 0,
      status: "loading",
      message: "Downloading...",
    });

    try {
      const file = await downloadUrlToFile(parsedUrl, (update) => {
        const hasRatio = typeof update.ratio === "number";
        const ratio = update.ratio ?? 0;
        const progress = hasRatio ? Math.round(ratio * DOWNLOAD_PROGRESS_MAX) : 0;
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

      await processFile({
        file,
        worker,
        progressOffset: DOWNLOAD_PROGRESS_MAX,
        source: "url",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Download failed";
      setCurrentFile({
        name: nameHint,
        progress: 0,
        status: "error",
        message,
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    if (!adsVisible) setAdsVisible(true);
    const worker = ensureWorker();
    setBusy(true);

    for (const file of Array.from(files)) {
      await processFile({ file, worker, source: "upload" });
    }

    setBusy(false);
  }

  function onDrag(e: React.DragEvent) {
    e.preventDefault();
    if (e.type === "dragenter" || e.type === "dragover") setHint("Drop to transcribe");
    if (e.type === "dragleave") setHint("or drop files here");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();

    const effects = [
      "splash",
      "bounce",
      "spin",
      "pulse",
      "shake",
      "flip",
      "zoom",
      "confetti",
      "rejected",
    ];
    const effectIndex = Math.floor(Date.now() / 1000) % effects.length;
    const effect = effects[effectIndex];
    if (effect) {
      setDropEffect(effect);
    }

    setTimeout(() => setDropEffect(""), 1000);

    setHint("Transcribing...");
    handleFiles(e.dataTransfer.files).finally(() => setHint("or drop files here"));
  }

  useEffect(() => {
    if (dropEffect) {
      const timer = setTimeout(() => setDropEffect(""), 1000);
      return () => clearTimeout(timer);
    }
  }, [dropEffect]);

  const adSlotPrefix = toolId;

  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <ToolAdRail visible={adsVisible} slotPrefix={adSlotPrefix} className="items-start">
          <div className="text-center">
            {currentFile && (
              <div className="mb-6 max-w-2xl mx-auto">
                <VideoProgress
                  fileName={currentFile.name}
                  progress={currentFile.progress}
                  status={currentFile.status}
                  message={currentFile.message}
                />
              </div>
            )}

            <div
              ref={dropRef}
              onDragEnter={onDrag}
              onDragOver={onDrag}
              onDragLeave={onDrag}
              onDrop={onDrop}
              data-testid="tool-dropzone"
              className={`mt-8 mx-auto max-w-6xl border-2 border-dashed rounded-2xl p-12 hover:border-opacity-80 transition-colors cursor-pointer ${
                dropEffect ? `animate-${dropEffect}` : ""
              }`}
              style={{
                backgroundColor: randomColor + "15",
                borderColor: randomColor,
              }}
              onClick={onPick}
            >
              <div className="flex flex-col items-center space-y-6">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{title}</h1>
                <p className="text-sm text-muted-foreground">{subtitle}</p>

                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  style={{ color: randomColor }}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>

                <Button
                  size="lg"
                  className="h-12 px-8 rounded-xl text-white shadow-lg"
                  style={{
                    backgroundColor: randomColor,
                    borderColor: randomColor,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPick();
                  }}
                  disabled={busy}
                >
                  {busy ? "Working..." : "CHOOSE FILES"}
                </Button>

                <div className="text-sm" style={{ color: randomColor }}>
                  <p className="font-medium">{hint}</p>
                </div>

                <div
                  className="mt-4 w-full max-w-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      inputMode="url"
                      placeholder="Paste a public link (YouTube, SoundCloud, or direct file)"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleUrlSubmit();
                        }
                      }}
                      className="w-full h-12 px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={busy}
                      data-testid="tool-url-input"
                    />
                    <Button
                      size="lg"
                      className="h-12 px-6 rounded-xl text-white shadow-lg"
                      style={{
                        backgroundColor: randomColor,
                        borderColor: randomColor,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUrlSubmit();
                      }}
                      disabled={busy || !urlInput.trim()}
                      data-testid="tool-url-submit"
                    >
                      {busy ? "Working..." : "TRANSCRIBE URL"}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Supports public links. Private or logged-in content is not supported yet.
                  </p>
                </div>
              </div>

              <input
                ref={inputRef}
                type="file"
                multiple
                accept={ACCEPT_ATTR}
                className="hidden"
                data-testid="tool-file-input"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {errorMessage && (
              <div className="mt-4 text-sm text-red-600">{errorMessage}</div>
            )}

            {transcript && (
              <div className="mt-8 max-w-4xl mx-auto text-left">
                <Card className="p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Transcript</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => navigator.clipboard?.writeText(transcript).catch(() => {})}
                      >
                        Copy
                      </Button>
                      <Button
                        onClick={() =>
                          saveBlob(new Blob([transcript], { type: "text/plain" }), transcriptName)
                        }
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                  <textarea
                    value={transcript}
                    readOnly
                    className="mt-4 w-full h-64 p-4 border rounded-lg resize-none bg-gray-50 font-mono text-sm"
                    placeholder="Transcript will appear here..."
                  />
                </Card>
              </div>
            )}
          </div>
        </ToolAdRail>
        <ToolAdInline visible={adsVisible} slotId={`${adSlotPrefix}-inline`} className="mt-6" />
      </div>
    </section>
  );
}
