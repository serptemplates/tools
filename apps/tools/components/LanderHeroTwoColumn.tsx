"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@serp-tools/ui/components/button";
import { saveBlob } from "@/components/saveAs";
import { ToolProgressIndicator, type ToolProgressFile } from "@/components/ToolProgressIndicator";
import { ToolAdInline, ToolAdRail } from "@/components/ToolAds";
import { detectCapabilities, type Capabilities } from "@/lib/capabilities";
import { beginToolRun } from "@/lib/telemetry";
import { compressPngWithWorker, convertWithWorker, getOutputMimeType } from "@/lib/convert/workerClient";
import type { OperationType } from "@/types";

type Props = {
  toolId?: string;
  title: string;              // e.g., "PDF to JPG"
  subtitle?: string;          // e.g., "Convert each PDF page into a JPG…"
  from: string;               // "pdf"
  to: string;                 // "jpg"
  accept?: string;            // optional override accept attr
  videoEmbedId?: string;      // YouTube embed ID for video (optional, defaults to bbkhxMpIH4w)
  operation?: OperationType;
};

export default function LanderHeroTwoColumn({
  toolId,
  title,
  subtitle = "Fast, private, in-browser conversion.",
  from,
  to,
  accept,
  videoEmbedId = "bbkhxMpIH4w",
  operation,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("or drop files here");
  const [dropEffect, setDropEffect] = useState<string>("");
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [adsVisible, setAdsVisible] = useState(false);
  const [currentFile, setCurrentFile] = useState<ToolProgressFile | null>(null);
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
  const isPngCompression =
    operation === "compress" && from.toLowerCase() === "png" && to.toLowerCase() === "png";

  function ensureWorker() {
    if (!workerRef.current) {
      const workerUrl = isPngCompression
        ? new URL("../workers/compress.worker.js", import.meta.url)
        : new URL("../workers/convert.worker.js", import.meta.url);
      workerRef.current = new Worker(
        workerUrl,
        { type: "module" }
      );

      // Add error handler for worker
      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
      };
    }
    return workerRef.current;
  }

  // Detect capabilities on mount
  useEffect(() => {
    setCapabilities(detectCapabilities());
  }, []);

  function onPick() {
    inputRef.current?.click();
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    if (!adsVisible) setAdsVisible(true);

    // Start playing video when file is dropped
    setVideoPlaying(true);

    const w = ensureWorker();
    setBusy(true);
    for (const file of Array.from(files)) {
      const run = beginToolRun({
        toolId: toolId ?? `${from}-to-${to}`,
        from,
        to,
        inputBytes: file.size,
        metadata: { fileName: file.name },
      });
      setCurrentFile({
        name: file.name,
        progress: 0,
        status: "processing",
        message: undefined,
      });
      try {
        const buf = await file.arrayBuffer();
        if (isPngCompression) {
          const compressedBuffer = await compressPngWithWorker({
            worker: w,
            buf,
            quality: 0.85,
          });
          const blob = new Blob([compressedBuffer], { type: getOutputMimeType("png") });
          const name = file.name.replace(/\.png$/i, "_compressed.png");
          saveBlob(blob, name);
          run.finishSuccess({ outputBytes: blob.size });
          setCurrentFile({
            name: file.name,
            progress: 100,
            status: "completed",
            message: "Compression complete!",
          });
          continue;
        }
        const result = await convertWithWorker({
          worker: w,
          from,
          to,
          buf,
          onProgress: (update) => {
            setCurrentFile({
              name: file.name,
              progress: update.progress ?? 0,
              status: update.status === "loading" ? "loading" : "processing",
              message: update.status === "loading" ? "Loading converter…" : undefined,
            });
          },
        });

        if (result.kind === "multiple") {
          const mimeType = getOutputMimeType(to);
          result.buffers.forEach((buffer, i) => {
            const blob = new Blob([buffer], { type: mimeType });
            const name = file.name.replace(/\.[^.]+$/, "") + `_page${i + 1}.${to}`;
            saveBlob(blob, name);
          });
          run.finishSuccess({
            outputBytes: result.buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0),
          });
          setCurrentFile({
            name: file.name,
            progress: 100,
            status: "completed",
            message: "Conversion complete!",
          });
        } else {
          const mimeType = getOutputMimeType(to);
          const blob = new Blob([result.buffer], { type: mimeType });
          const name = file.name.replace(/\.[^.]+$/, "") + "." + to;
          saveBlob(blob, name);
          run.finishSuccess({ outputBytes: result.buffer.byteLength });
          setCurrentFile({
            name: file.name,
            progress: 100,
            status: "completed",
            message: "Conversion complete!",
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Convert failed";
        run.finishFailure({ errorCode: message || "convert_failed" });
        console.error(`Conversion failed for ${file.name}:`, err);
        setCurrentFile({
          name: file.name,
          progress: 0,
          status: "error",
          message,
        });
      }
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

    setHint(isPngCompression ? "Compressing…" : "Converting…");
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
          : `.${from}`);
  const adSlotPrefix = toolId ?? `${from}-to-${to}`;

  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1400px] px-6 py-12">
        <ToolAdRail visible={adsVisible} slotPrefix={adSlotPrefix} className="items-start">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center">{title}</h1>
            <p className="text-sm text-muted-foreground text-center mb-10">{subtitle}</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
              {/* Video Column */}
              <div className="order-2 lg:order-1">
                <div className="relative w-full rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900" style={{ aspectRatio: '16/9' }}>
                  {videoEmbedId ? (
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${videoEmbedId}?${videoPlaying ? 'autoplay=1&' : ''}mute=1&loop=1&playlist=${videoEmbedId}&controls=1&showinfo=0&rel=0&modestbranding=1`}
                      title="Tool Demo Video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ border: 'none' }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="relative">
                          <svg className="w-20 h-20 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {busy && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-600 border-t-blue-500"></div>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm font-medium">
                          {busy ? 'Converting your file...' : 'Drop a file to see the conversion in action'}
                        </p>
                        <p className="text-gray-500 text-xs mt-2">
                          No uploads • 100% private • Processed locally
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dropzone Column */}
              <div className="order-1 lg:order-2">
                <div
                  ref={dropRef}
                  onDragEnter={onDrag}
                  onDragOver={onDrag}
                  onDragLeave={onDrag}
                  onDrop={onDrop}
                  data-testid="tool-dropzone"
                  className={`border-2 border-dashed rounded-xl p-12 hover:border-opacity-80 transition-colors cursor-pointer w-full flex items-center justify-center ${dropEffect ? `animate-${dropEffect}` : ""
                    }`}
                  style={{
                    backgroundColor: randomColor + "15", // 15 is ~8% opacity
                    borderColor: randomColor,
                    aspectRatio: '16/9',
                  }}
                  onClick={onPick}
                >
                  <div className="flex flex-col items-center space-y-6">
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

                    {/* Video conversion warning */}
                    {capabilities && !capabilities.supportsVideoConversion && (
                      (from && ['mp4', 'mkv', 'avi', 'webm', 'mov'].includes(from) ||
                        to && ['mp3', 'wav', 'aac', 'm4a', 'ogg'].includes(to)) && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-amber-800">Video conversion temporarily disabled</p>
                              <p className="text-xs text-amber-700 mt-1">
                                {capabilities.reason}. Deploy to a server environment to enable video processing.
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={acceptAttr}
                    className="hidden"
                    data-testid="tool-file-input"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </div>
              </div>
            </div>
            <ToolProgressIndicator
              currentFile={currentFile}
              className="mt-8 max-w-3xl mx-auto"
            />
          </div>
        </ToolAdRail>
        <ToolAdInline visible={adsVisible} slotId={`${adSlotPrefix}-inline`} className="mt-6" />
      </div>
    </section>
  );
}
