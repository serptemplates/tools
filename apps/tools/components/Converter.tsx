"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@serp-tools/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@serp-tools/ui/components/card";
import { Progress } from "@serp-tools/ui/components/progress";
import { Slider } from "@serp-tools/ui/components/slider";
import { Separator } from "@serp-tools/ui/components/separator";
import { Upload, Trash2, File as FileIcon, Loader2 } from "lucide-react";
import { saveBlob } from "./saveAs";

type ConvertProps = {
  title: string;              // "HEIC to JPG"
  from: string;               // "heic"
  to: string;                 // "jpg"
  description?: string;       // optional subtitle
  accepts?: string[];         // override accepted extensions
  qualityDefault?: number;    // 0..100 for lossy
};

type Item = {
  id: string;
  file: File;
  status: "queued" | "converting" | "done" | "error";
  message?: string;
};

function extAccept(from: string, extra?: string[]) {
  const map: Record<string, string[]> = {
    heic: [".heic", ".heif"],
    jpeg: [".jpeg", ".jpg"],
    jpg: [".jpg", ".jpeg"],
    png: [".png"],
    webp: [".webp"],
    gif: [".gif"],
    bmp: [".bmp"],
    pdf: [".pdf"],
    ico: [".ico"],
    avif: [".avif"],
    svg: [".svg"],
    tiff: [".tif", ".tiff"],
  };
  const base = map[from?.toLowerCase()] || ["." + from];
  return [...base, ...(extra || [])].join(",");
}

export default function Converter({
  title,
  from,
  to,
  description = "Fast, private, in-browser conversion. No upload.",
  accepts,
  qualityDefault = 85,
}: ConvertProps) {
  const workerRef = useRef<Worker | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [quality, setQuality] = useState<number>(qualityDefault);
  const [busy, setBusy] = useState(false);
  const [overall, setOverall] = useState(0);

  const acceptAttr = useMemo(
    () => (accepts ? accepts.map(a => (a.startsWith(".") ? a : "." + a)).join(",") : extAccept(from)),
    [from, accepts]
  );

  function ensureWorker() {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL("../workers/convert.worker.ts", import.meta.url), { type: "module" });
    }
    return workerRef.current;
  }

  const onDrop = useCallback((files: FileList | null | File[]) => {
    const arr = (files instanceof FileList) ? Array.from(files) : (files || []);
    if (!arr.length) return;
    setItems(prev => [
      ...prev,
      ...arr.map((f) => ({
        id: `${f.name}-${f.size}-${f.lastModified}-${crypto.randomUUID()}`,
        file: f,
        status: "queued" as const,
      })),
    ]);
  }, []);

  function removeItem(id: string) {
    setItems(prev => prev.filter(x => x.id !== id));
  }

  function clearAll() {
    setItems([]);
    setOverall(0);
  }

  async function convertAll() {
    if (!items.length) return;
    setBusy(true);

    const worker = ensureWorker();
    const total = items.filter(item => item.status === "queued").length;
    let done = 0;

    for (const item of items) {
      if (item.status !== "queued") continue;

      setItems(prev => prev.map(x =>
        x.id === item.id ? { ...x, status: "converting" as const } : x
      ));

      try {
        await new Promise<void>((resolve, reject) => {
          const handleMessage = (e: MessageEvent) => {
            if (e.data.id === item.id) {
              if (e.data.error) {
                setItems(prev => prev.map(x =>
                  x.id === item.id
                    ? { ...x, status: "error" as const, message: e.data.error }
                    : x
                ));
                reject(e.data.error);
              } else if (e.data.blob) {
                const outputName = item.file.name.replace(/\.[^.]+$/, `.${to}`);
                saveBlob(e.data.blob, outputName);
                setItems(prev => prev.map(x =>
                  x.id === item.id ? { ...x, status: "done" as const } : x
                ));
                resolve();
              }
              worker.removeEventListener("message", handleMessage);
            }
          };

          worker.addEventListener("message", handleMessage);
          worker.postMessage({
            id: item.id,
            file: item.file,
            from,
            to,
            quality: to === "jpg" || to === "jpeg" ? quality / 100 : undefined,
          });
        });
      } catch (err) {
        console.error(`Error converting ${item.file.name}:`, err);
      }

      done++;
      setOverall((done / total) * 100);
    }

    setBusy(false);
    setOverall(0);
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-600 transition-colors cursor-pointer"
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDrop(e.dataTransfer.files);
          }}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.multiple = true;
            input.accept = acceptAttr;
            input.onchange = () => onDrop(input.files);
            input.click();
          }}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium mb-2">Drop {from.toUpperCase()} files here</p>
          <p className="text-sm text-muted-foreground">or click to browse</p>
        </div>

        {(to === "jpg" || to === "jpeg") && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Quality</span>
                <span className="text-sm text-muted-foreground">{quality}%</span>
              </div>
              <Slider
                value={[quality]}
                onValueChange={([v]: number[]) => setQuality(v ?? qualityDefault)}
                max={100}
                min={1}
                step={1}
                className="w-full"
                disabled={busy}
              />
            </div>
          </>
        )}

        {items.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{items.length} file{items.length !== 1 ? "s" : ""}</span>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAll}
                    disabled={busy}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={convertAll}
                    disabled={busy || !items.some(i => i.status === "queued")}
                  >
                    {busy ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      `Convert to ${to.toUpperCase()}`
                    )}
                  </Button>
                </div>
              </div>

              {busy && overall > 0 && (
                <Progress value={overall} className="w-full" />
              )}

              <div className="space-y-1 max-h-60 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded hover:bg-accent">
                    <div className="flex items-center space-x-2">
                      <FileIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate max-w-xs">{item.file.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.status === "converting" && <Loader2 className="h-4 w-4 animate-spin" />}
                      {item.status === "done" && <span className="text-xs text-green-600">✓</span>}
                      {item.status === "error" && <span className="text-xs text-red-600">✗</span>}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        disabled={busy}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
