"use client";

import { useRef, useState } from "react";
import { Button } from "@serp-tools/ui/components/button";
import { Alert, AlertDescription } from "@serp-tools/ui/components/alert";
import { AlertTriangle, Download, FileImage, Loader2 } from "lucide-react";
import { saveBlob } from "@/components/saveAs";
import { ToolAdInline, ToolAdRail } from "@/components/ToolAds";
import { ToolVideoPanel } from "@/components/ToolVideoPanel";
import { beginToolRun } from "@/lib/telemetry";
import { compressPngWithWorker, getOutputMimeType } from "@/lib/convert/workerClient";

type Props = {
  toolId?: string;
  title: string;
  subtitle?: string;
  from: string;
  to: string;
  accept?: string;
  videoEmbedId?: string;
};

export default function BatchHeroConverter({
  toolId,
  title,
  subtitle = "Fast, private, in-browser batch compression.",
  from,
  to,
  accept,
  videoEmbedId,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("or drop multiple files here");
  const [dropEffect, setDropEffect] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [processedFiles, setProcessedFiles] = useState<Map<string, { blob: Blob; originalSize: number; compressedSize: number }>>(new Map());
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high' | 'extreme'>('high');
  const [adsVisible, setAdsVisible] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const colors = [
    "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899",
    "#14b8a6", "#f97316", "#6366f1", "#f43f5e", "#0ea5e9", "#84cc16",
  ];

  const hashCode = (from + to).split('').reduce((hash, char) => {
    return char.charCodeAt(0) + ((hash << 5) - hash);
  }, 0);
  const randomColor = colors[Math.abs(hashCode) % colors.length];

  function ensureWorker() {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("../workers/compress.worker.js", import.meta.url),
        { type: "module" }
      );
    }
    return workerRef.current;
  }

  function onPick() {
    inputRef.current?.click();
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || !fileList.length) return;

    const pngFiles = Array.from(fileList).filter(file =>
      file.type === "image/png" || file.name.toLowerCase().endsWith(".png")
    );

    if (pngFiles.length === 0) {
      setError("Please select PNG files only");
      return;
    }

    if (!adsVisible) setAdsVisible(true);
    if (!videoPlaying) setVideoPlaying(true);
    setFiles(pngFiles);
    setProcessedFiles(new Map());
    setCurrentFileIndex(0);
    setError(null);
    setBusy(true);

    const w = ensureWorker();
    const processed = new Map<string, { blob: Blob; originalSize: number; compressedSize: number }>();

    for (let i = 0; i < pngFiles.length; i++) {
      const file = pngFiles[i];
      setCurrentFileIndex(i);

      if (!file) {
        console.error(`File not found at index ${i}`);
        continue
      }

      const run = beginToolRun({
        toolId: toolId ?? `${from}-to-${to}`,
        from,
        to,
        inputBytes: file.size,
        metadata: { fileName: file.name, compressionLevel },
      });

      try {
        const buf = await file.arrayBuffer();
        const originalSize = file.size;
        const qualityMap = {
          low: 0.85, // Light compression
          medium: 0.7, // Moderate compression
          high: 0.5, // High compression
          extreme: 0.3, // Maximum compression
        };
        const compressedBuffer = await compressPngWithWorker({
          worker: w,
          buf,
          quality: qualityMap[compressionLevel],
        });
        const compressedBlob = new Blob([compressedBuffer], { type: getOutputMimeType(to) });

        const compressedName = file.name.replace(/\.png$/i, "_compressed.png");
        processed.set(compressedName, {
          blob: compressedBlob,
          originalSize: originalSize,
          compressedSize: compressedBlob.size
        });
        setProcessedFiles(new Map(processed));
        run.finishSuccess({
          outputBytes: compressedBlob.size,
          metadata: { compressionLevel },
        });
      } catch (err) {
        console.error(`Failed to compress ${file.name}:`, err);
        setError(`Failed to compress ${file.name}`);
        run.finishFailure({ errorCode: "compress_failed", metadata: { compressionLevel } });
      }
    }

    setBusy(false);
  }

  async function downloadZip() {
    if (processedFiles.size === 0) return;

    const { createZipBlob } = await import("@/lib/zipUtils");
    const blobMap = new Map<string, Blob>();
    processedFiles.forEach((value, key) => {
      blobMap.set(key, value.blob);
    });
    const zipBlob = await createZipBlob(blobMap);
    saveBlob(zipBlob, "compressed_pngs.zip");
  }

  function onDrag(e: React.DragEvent) {
    e.preventDefault();
    if (e.type === "dragenter" || e.type === "dragover") {
      setHint("Drop to compress");
      setDropEffect("animate-pulse");
    }
    if (e.type === "dragleave") {
      setHint("or drop multiple files here");
      setDropEffect("");
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setHint("or drop multiple files here");
    setDropEffect("animate-bounce");
    setTimeout(() => setDropEffect(""), 500);

    const dt = e.dataTransfer;
    handleFiles(dt.files);
  }

  const compressionRate = files.length > 0 && processedFiles.size > 0
    ? Math.round((processedFiles.size / files.length) * 100)
    : 0;
  const adSlotPrefix = toolId ?? `${from}-to-${to}`;

  return (
    <section className="relative flex items-center justify-center min-h-[60vh] px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800" />

      <div className="relative w-full max-w-7xl mx-auto py-16">
        <ToolAdRail visible={adsVisible} slotPrefix={adSlotPrefix} className="items-start">
          <div>
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
                {subtitle}
              </p>
            </div>

            <div
              ref={dropRef}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 transition-all duration-300 ${dropEffect}`}
              onDragEnter={onDrag}
              onDragLeave={onDrag}
              onDragOver={onDrag}
              onDrop={onDrop}
              data-testid="batch-compress-dropzone"
              style={{
                borderImage: `linear-gradient(135deg, ${randomColor}, transparent) 1`,
                borderWidth: "3px",
                borderStyle: "solid",
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept={accept || ".png,image/png"}
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
                data-testid="batch-compress-input"
              />

              <div className="text-center">
                <FileImage className="w-16 h-16 mx-auto mb-6 text-gray-400" />

                {!busy && files.length === 0 && (
                  <>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Compression Level
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button
                          onClick={() => setCompressionLevel('low')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${compressionLevel === 'low'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                          Low
                          <div className="text-xs opacity-75">~15% reduction</div>
                        </button>
                        <button
                          onClick={() => setCompressionLevel('medium')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${compressionLevel === 'medium'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                          Medium
                          <div className="text-xs opacity-75">~30% reduction</div>
                        </button>
                        <button
                          onClick={() => setCompressionLevel('high')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${compressionLevel === 'high'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                          High
                          <div className="text-xs opacity-75">~50% reduction</div>
                        </button>
                        <button
                          onClick={() => setCompressionLevel('extreme')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${compressionLevel === 'extreme'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                          Extreme
                          <div className="text-xs opacity-75">~70% reduction</div>
                        </button>
                      </div>
                      {compressionLevel === 'extreme' && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                          ⚠️ Extreme compression may significantly reduce image quality
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={onPick}
                      size="lg"
                      className="mb-4"
                      style={{ backgroundColor: randomColor }}
                    >
                      Select PNG Files
                    </Button>
                    <p className="text-gray-500 dark:text-gray-400">{hint}</p>
                  </>
                )}

                {busy && (
                  <div className="space-y-4">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
                    <p className="text-gray-600 dark:text-gray-300">
                      Compressing file {currentFileIndex + 1} of {files.length}...
                    </p>
                    <div
                      className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700"
                      data-testid="batch-progress"
                    >
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${compressionRate}%` }}
                      />
                    </div>
                  </div>
                )}

                {!busy && processedFiles.size > 0 && (() => {
                  let totalOriginal = 0;
                  let totalCompressed = 0;
                  processedFiles.forEach(value => {
                    totalOriginal += value.originalSize;
                    totalCompressed += value.compressedSize;
                  });
                  const reduction = Math.round((1 - totalCompressed / totalOriginal) * 100);

                  return (
                    <div className="space-y-4">
                      <div className="text-green-600 dark:text-green-400">
                        ✓ Compressed {processedFiles.size} files successfully!
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>Original size: {(totalOriginal / 1024 / 1024).toFixed(2)} MB</p>
                        <p>Compressed size: {(totalCompressed / 1024 / 1024).toFixed(2)} MB</p>
                        <p className="font-semibold text-green-600">Size reduction: {reduction}%</p>
                      </div>

                      <Button
                        onClick={downloadZip}
                        size="lg"
                        className="gap-2"
                        style={{ backgroundColor: randomColor }}
                        data-testid="batch-compress-download"
                      >
                        <Download className="w-4 h-4" />
                        Download ZIP ({(totalCompressed / 1024 / 1024).toFixed(2)} MB)
                      </Button>

                      <Button
                        onClick={onPick}
                        variant="outline"
                        size="sm"
                        className="ml-4"
                      >
                        Compress More Files
                      </Button>
                    </div>
                  );
                })()}

                {error && (
                  <Alert className="mt-4" variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>✓ All processing happens in your browser</p>
              <p>✓ No files are uploaded to any server</p>
              <p>✓ Batch compress multiple PNG files at once</p>
            </div>

            {videoEmbedId && (
              <div className="mt-10">
                <ToolVideoPanel embedId={videoEmbedId} autoplay={videoPlaying} />
              </div>
            )}
          </div>
        </ToolAdRail>
        <ToolAdInline visible={adsVisible} slotId={`${adSlotPrefix}-inline`} className="mt-8" />
      </div>
    </section>
  );
}
