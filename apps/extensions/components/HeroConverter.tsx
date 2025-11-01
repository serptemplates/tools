"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@serp-extensions/ui/components/button";
import { saveBlob } from "@/components/saveAs";
import { VideoProgress } from "@/components/VideoProgress";

type Props = {
  title: string;              // e.g., "PDF to JPG"
  subtitle?: string;          // e.g., "Convert each PDF page into a JPG…"
  from: string;               // "pdf"
  to: string;                 // "jpg"
  accept?: string;            // optional override accept attr
  videoEmbedId?: string;      // YouTube embed ID for video
};

export default function HeroConverter({
  title,
  subtitle = "Fast, private, in-browser conversion.",
  from,
  to,
  accept,
  videoEmbedId,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("or drop files here");
  const [dropEffect, setDropEffect] = useState<string>("");
  const [currentFile, setCurrentFile] = useState<{
    name: string;
    progress: number;
    status: 'loading' | 'processing' | 'completed' | 'error';
    message?: string;
  } | null>(null);
  // Generate stable color based on tool properties
  const colors = [
    "#ef4444", // red-500
    "#f59e0b", // amber-500  
    "#22c55e", // green-500
    "#3b82f6", // blue-500
    "#a855f7", // purple-500
    "#ec4899", // pink-500
    "#14b8a6", // teal-500
    "#f97316", // orange-500
    "#6366f1", // indigo-500
    "#f43f5e", // rose-500
    "#0ea5e9", // sky-500
    "#84cc16", // lime-500
  ];

  // Use a stable hash based on from/to combination
  const hashCode = (from + to).split('').reduce((hash, char) => {
    return char.charCodeAt(0) + ((hash << 5) - hash);
  }, 0);
  const randomColor = colors[Math.abs(hashCode) % colors.length];

  function ensureWorker() {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("../workers/convert.worker.ts", import.meta.url),
        { type: "module" }
      );
    }
    return workerRef.current;
  }

  function onPick() {
    inputRef.current?.click();
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const w = ensureWorker();
    setBusy(true);

    for (const file of Array.from(files)) {
      // Check file size for video files
      const isVideo = ["mkv", "mp4", "webm", "avi", "mov"].includes(from);
      const sizeMB = file.size / (1024 * 1024);

      if (isVideo && sizeMB > 100) {
        console.warn(`Large file warning: ${file.name} is ${sizeMB.toFixed(1)}MB`);
      }

      setCurrentFile({
        name: file.name,
        progress: 0,
        status: 'processing',
        message: undefined
      });

      const buf = await file.arrayBuffer();
      await new Promise<void>((resolve, reject) => {
        w.onmessage = (ev: MessageEvent<any>) => {
          // Handle progress messages
          if (ev.data?.type === 'progress') {
            setCurrentFile({
              name: file.name,
              progress: ev.data.progress || 0,
              status: 'processing',
              message: undefined
            });
            return;
          }

          if (!ev.data?.ok) {
            setCurrentFile({
              name: file.name,
              progress: 0,
              status: 'error',
              message: ev.data?.error || "Convert failed"
            });
            return reject(new Error(ev.data?.error || "Convert failed"));
          }

          // Handle PDF pages (returns multiple blobs)
          if (ev.data.blobs) {
            const mimeType = to === "png" ? "image/png" : to === "jpg" || to === "jpeg" ? "image/jpeg" : "image/webp";
            ev.data.blobs.forEach((buf: ArrayBuffer, i: number) => {
              const blob = new Blob([buf], { type: mimeType });
              const name = file.name.replace(/\.[^.]+$/, "") + `_page${i + 1}.${to}`;
              saveBlob(blob, name);
            });
          } else {
            // Handle single file conversion (image/video/audio)
            let mimeType = "application/octet-stream";
            if (to === "png") mimeType = "image/png";
            else if (to === "jpg" || to === "jpeg") mimeType = "image/jpeg";
            else if (to === "webp") mimeType = "image/webp";
            else if (to === "gif") mimeType = "image/gif";
            else if (to === "mp4") mimeType = "video/mp4";
            else if (to === "webm") mimeType = "video/webm";
            else if (to === "avi") mimeType = "video/x-msvideo";
            else if (to === "mov") mimeType = "video/quicktime";
            else if (to === "mp3") mimeType = "audio/mpeg";
            else if (to === "wav") mimeType = "audio/wav";
            else if (to === "ogg") mimeType = "audio/ogg";

            // Ensure we have valid data
            if (!ev.data.blob || ev.data.blob.byteLength === 0) {
              console.error('Received empty blob data');
              setCurrentFile({
                name: file.name,
                progress: 0,
                status: 'error',
                message: 'Conversion produced empty file'
              });
              return reject(new Error('Empty output'));
            }

            const blob = new Blob([ev.data.blob], { type: mimeType });
            const name = file.name.replace(/\.[^.]+$/, "") + "." + to;
            console.log(`Saving ${name}, size: ${blob.size} bytes, type: ${mimeType}`);
            saveBlob(blob, name);

            setCurrentFile({
              name: file.name,
              progress: 100,
              status: 'completed',
              message: 'Conversion complete!'
            });
          }
          resolve();
        };
        const isVideo = ["mkv", "mp4", "webm", "avi", "mov"].includes(from) ||
          ["mp4", "webm", "avi", "mov", "gif", "mp3", "wav", "ogg"].includes(to);
        const op = from === "pdf" ? "pdf-pages" : isVideo ? "video" : "raster";
        w.postMessage(
          op === "pdf-pages" ? { op, to, buf } :
            op === "video" ? { op, from, to, buf } :
              { op, from, to, buf },
          [buf]);
      });
    }
    setBusy(false);
  }

  // simple drag/drop
  function onDrag(e: React.DragEvent) {
    e.preventDefault();
    if (e.type === "dragenter" || e.type === "dragover") setHint("Drop to convert");
    if (e.type === "dragleave") setHint("or drop files here");
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();

    // Trigger fun effect - cycle through based on time
    const effects = [
      "splash",
      "bounce",
      "spin",
      "pulse",
      "shake",
      "flip",
      "zoom",
      "confetti",
      "rejected"
    ];
    // Use timestamp to cycle through effects deterministically
    const effectIndex = Math.floor(Date.now() / 1000) % effects.length;
    const effect = effects[effectIndex];
    if (effect) {
      setDropEffect(effect);
    }

    // Clear effect after animation
    setTimeout(() => setDropEffect(""), 1000);

    setHint("Converting…");
    handleFiles(e.dataTransfer.files).finally(() => setHint("or drop files here"));
  }

  // Clear drop effect when component unmounts or effect changes
  useEffect(() => {
    if (dropEffect) {
      const timer = setTimeout(() => setDropEffect(""), 1000);
      return () => clearTimeout(timer);
    }
  }, [dropEffect]);

  const acceptAttr =
    accept ??
    (from === "pdf" ? ".pdf"
      : from === "jpg" ? ".jpg,.jpeg"
        : from === "jpeg" ? ".jpeg,.jpg"
          : from === "mkv" ? ".mkv"
            : from === "mp4" ? ".mp4"
              : from === "webm" ? ".webm"
                : from === "avi" ? ".avi"
                  : from === "mov" ? ".mov"
                    : `.${from}`);

  const isVideoTool = ["mkv", "mp4", "webm", "avi", "mov"].includes(from) ||
    ["mp4", "webm", "avi", "mov", "gif", "mp3", "wav", "ogg"].includes(to);

  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-7xl px-6 py-8 text-center">

        {/* Show progress when converting */}
        {currentFile && busy && (
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
          className={`mt-8 mx-auto max-w-6xl border-2 border-dashed rounded-2xl p-12 hover:border-opacity-80 transition-colors cursor-pointer ${dropEffect ? `animate-${dropEffect}` : ""
            }`}
          style={{
            backgroundColor: randomColor + "15", // 15 is ~8% opacity
            borderColor: randomColor,
          }}
          onClick={onPick}
        >
          <div className="flex flex-col items-center space-y-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{title}</h1>

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
              {busy ? "Working…" : `CHOOSE FILES`}
            </Button>

            <div className="text-sm" style={{ color: randomColor }}>
              <p className="font-medium">{hint}</p>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept={acceptAttr}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>
    </section>
  );
}