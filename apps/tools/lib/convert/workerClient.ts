import { detectCapabilities, requiresVideoConversion } from "@/lib/capabilities";
import { decodeToRGBA } from "@/lib/convert/decode";
import { encodeFromRGBA } from "@/lib/convert/encode";

export type ConversionOp = "raster" | "pdf-pages" | "video";

export type ConversionResult =
  | { kind: "single"; buffer: ArrayBuffer }
  | { kind: "multiple"; buffers: ArrayBuffer[] };

export type ProgressUpdate = {
  status?: string;
  progress?: number;
  time?: number;
};

const SERVER_IMAGE_INPUTS = new Set([
  "tiff",
  "tif",
  "cr2",
  "cr3",
  "dng",
  "arw",
  "psd",
  "tga",
  "dds",
  "xcf",
  "ai",
  "apng",
]);
const SERVER_IMAGE_OUTPUTS = new Set([
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
]);

const MIME_MAP: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  avif: "image/avif",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  tiff: "image/tiff",
  tif: "image/tiff",
  ico: "image/x-icon",
  cur: "image/x-icon",
  svg: "image/svg+xml",
  tga: "image/x-tga",
  dds: "image/vnd-ms.dds",
  mp4: "video/mp4",
  webm: "video/webm",
  avi: "video/x-msvideo",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
  m4v: "video/x-m4v",
  mpeg: "video/mpeg",
  mpg: "video/mpeg",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  aac: "audio/aac",
  m4a: "audio/mp4",
  m4r: "audio/mp4",
  opus: "audio/opus",
  flac: "audio/flac",
  wma: "audio/x-ms-wma",
  aiff: "audio/aiff",
  mp2: "audio/mpeg",
  alac: "audio/mp4",
  amr: "audio/amr",
  au: "audio/basic",
  caf: "audio/x-caf",
  cdda: "audio/x-cdda",
  ts: "video/mp2t",
  mts: "video/mp2t",
  m2ts: "video/mp2t",
  flv: "video/x-flv",
  f4v: "video/x-f4v",
  vob: "video/dvd",
  "3gp": "video/3gpp",
  hevc: "video/mp4",
  divx: "video/avi",
  mjpeg: "video/x-motion-jpeg",
  mpeg2: "video/mpeg",
  asf: "video/x-ms-asf",
  wmv: "video/x-ms-wmv",
  ogv: "video/ogg",
  rm: "application/vnd.rn-realmedia",
  rmvb: "application/vnd.rn-realmedia-vbr",
  swf: "application/x-shockwave-flash",
  mxf: "application/mxf",
  av1: "video/mp4",
  avchd: "video/mp2t",
  pdf: "application/pdf",
};

export function getOutputMimeType(format: string) {
  return MIME_MAP[format.toLowerCase()] ?? "application/octet-stream";
}

export function resolveConversionOp(from: string, to: string): ConversionOp {
  if (from === "pdf") return "pdf-pages";
  if (requiresVideoConversion(from, to)) {
    return "video";
  }
  return "raster";
}

type WorkerMessage = {
  type?: "progress";
  status?: string;
  progress?: number;
  time?: number;
  ok?: boolean;
  error?: string;
  blob?: ArrayBuffer;
  blobs?: ArrayBuffer[];
};

export async function convertWithWorker(args: {
  worker: Worker;
  from: string;
  to: string;
  buf: ArrayBuffer;
  onProgress?: (update: ProgressUpdate) => void;
  quality?: number;
}): Promise<ConversionResult> {
  const fromExt = args.from.toLowerCase();
  const toExt = args.to.toLowerCase();
  if (fromExt === "ai") {
    const { renderPdfPages } = await import("./pdf");
    const rasterFormat = toExt === "jpg" || toExt === "jpeg" ? "jpg" : "png";
    const buffers = await renderPdfPages(args.buf, undefined, rasterFormat);
    if (toExt === "svg") {
      const svgBuffers = [];
      for (const buffer of buffers) {
        const rgba = await decodeToRGBA("png", buffer);
        const blob = await encodeFromRGBA("svg", rgba, args.quality ?? 0.85);
        svgBuffers.push(await blob.arrayBuffer());
      }
      return { kind: "multiple", buffers: svgBuffers };
    }
    return { kind: "multiple", buffers };
  }
  if (shouldUseServerImageConversion(fromExt)) {
    if (SERVER_IMAGE_OUTPUTS.has(toExt)) {
      return convertImageViaApi(args);
    }
    const serverResult = await convertImageViaApi({ ...args, to: "png" });
    if (serverResult.kind !== "single") {
      throw new Error("Server image conversion returned multiple buffers unexpectedly.");
    }
    args.onProgress?.({ status: "processing", progress: 90 });
    return convertRasterOnMainThread({
      from: "png",
      to: args.to,
      buf: serverResult.buffer,
      quality: args.quality,
    });
  }
  if (fromExt === "heic" || fromExt === "heif") {
    return convertRasterOnMainThread(args);
  }
  if (fromExt === "pdf") {
    const { renderPdfPages } = await import("./pdf");
    const buffers = await renderPdfPages(args.buf, undefined, args.to);
    return { kind: "multiple", buffers };
  }
  const op = resolveConversionOp(args.from, args.to);
  if (op === "video") {
    return convertVideoOnMainThread(args);
  }
  const workerBuf = op === "raster" ? args.buf.slice(0) : args.buf;

  try {
    return await convertWithWorkerInner({ ...args, op, buf: workerBuf });
  } catch (error) {
    if (op === "raster" && (isDecodeError(error) || isWorkerError(error))) {
      return convertRasterOnMainThread(args);
    }
    throw error;
  }
}

async function convertWithWorkerInner(args: {
  worker: Worker;
  from: string;
  to: string;
  buf: ArrayBuffer;
  onProgress?: (update: ProgressUpdate) => void;
  quality?: number;
  op: ConversionOp;
}): Promise<ConversionResult> {
  return await new Promise<ConversionResult>((resolve, reject) => {
    args.worker.onmessage = (ev: MessageEvent<WorkerMessage>) => {
      if (!ev.data) {
        return reject(new Error("Malformed worker response"));
      }

      if (ev.data?.type === "progress") {
        args.onProgress?.({
          status: ev.data.status,
          progress: ev.data.progress,
          time: ev.data.time,
        });
        return;
      }

      if (!ev.data?.ok) {
        return reject(new Error(ev.data?.error || "Convert failed"));
      }

      if (ev.data.blobs) {
        return resolve({ kind: "multiple", buffers: ev.data.blobs });
      }

      if (ev.data.blob) {
        return resolve({ kind: "single", buffer: ev.data.blob });
      }

      return reject(new Error("Unknown worker response"));
    };

    args.worker.onerror = (error) => {
      const detailParts = [
        (error as ErrorEvent).message,
        (error as ErrorEvent).filename,
        (error as ErrorEvent).lineno,
        (error as ErrorEvent).colno,
        (error as ErrorEvent).error instanceof Error ? (error as ErrorEvent).error.message : null,
      ].filter(Boolean);
      const detail = detailParts.length ? detailParts.join(" | ") : String(error);
      reject(new Error(`Worker error: ${detail}`));
    };

    if (args.op === "pdf-pages") {
      args.worker.postMessage(
        { op: args.op, to: args.to, buf: args.buf, quality: args.quality },
        [args.buf]
      );
      return;
    }

    args.worker.postMessage(
      { op: args.op, from: args.from, to: args.to, buf: args.buf, quality: args.quality },
      [args.buf]
    );
  });
}

export async function compressPngWithWorker(args: {
  worker: Worker;
  buf: ArrayBuffer;
  quality?: number;
}): Promise<ArrayBuffer> {
  const workerBuf = args.buf.slice(0);
  try {
    return await compressPngWithWorkerInner({ ...args, buf: workerBuf });
  } catch {
    return await compressPngOnMainThread(args);
  }
}

async function compressPngWithWorkerInner(args: {
  worker: Worker;
  buf: ArrayBuffer;
  quality?: number;
}): Promise<ArrayBuffer> {
  return await new Promise<ArrayBuffer>((resolve, reject) => {
    args.worker.onmessage = (ev: MessageEvent<WorkerMessage>) => {
      if (!ev.data) {
        return reject(new Error("Malformed worker response"));
      }

      if (!ev.data?.ok) {
        return reject(new Error(ev.data?.error || "Compression failed"));
      }

      if (ev.data.blob) {
        return resolve(ev.data.blob as ArrayBuffer);
      }

      return reject(new Error("Unknown worker response"));
    };

    args.worker.onerror = (error) => {
      const detailParts = [
        (error as ErrorEvent).message,
        (error as ErrorEvent).filename,
        (error as ErrorEvent).lineno,
        (error as ErrorEvent).colno,
        (error as ErrorEvent).error instanceof Error ? (error as ErrorEvent).error.message : null,
      ].filter(Boolean);
      const detail = detailParts.length ? detailParts.join(" | ") : String(error);
      reject(new Error(`Worker error: ${detail}`));
    };

    args.worker.postMessage({ op: "compress-png", buf: args.buf, quality: args.quality }, [args.buf]);
  });
}

function isDecodeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  return [
    "natively supported",
    "decode",
    "decoded",
    "createimagebitmap",
    "imagedecoder",
  ].some((marker) => normalized.includes(marker));
}

function isWorkerError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes("worker error");
}

function shouldUseServerImageConversion(fromExt: string) {
  return SERVER_IMAGE_INPUTS.has(fromExt.toLowerCase());
}

async function convertImageViaApi(args: {
  from: string;
  to: string;
  buf: ArrayBuffer;
  onProgress?: (update: ProgressUpdate) => void;
}): Promise<ConversionResult> {
  args.onProgress?.({ status: "processing", progress: 5 });
  const response = await fetch(`/api/image-convert?from=${args.from}&to=${args.to}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: args.buf,
  });

  if (!response.ok) {
    let detail = "";
    try {
      const data = await response.json();
      detail = data?.error ? `: ${data.error}` : "";
    } catch {
      detail = "";
    }
    throw new Error(`Server conversion failed (${response.status})${detail}`);
  }

  const buffer = await response.arrayBuffer();
  args.onProgress?.({ status: "processing", progress: 100 });
  return { kind: "single", buffer };
}

async function convertRasterOnMainThread(args: {
  from: string;
  to: string;
  buf: ArrayBuffer;
  quality?: number;
}): Promise<ConversionResult> {
  const rgba = await decodeToRGBA(args.from, args.buf);
  const blob = await encodeFromRGBA(args.to, rgba, args.quality ?? 0.85);
  const buffer = await blob.arrayBuffer();
  return { kind: "single", buffer };
}

async function convertVideoOnMainThread(args: {
  from: string;
  to: string;
  buf: ArrayBuffer;
  onProgress?: (update: ProgressUpdate) => void;
  quality?: number;
}): Promise<ConversionResult> {
  const { convertVideo, convertVideoViaApi, shouldUseServerConversion } = await import("./video");
  let buffer: ArrayBuffer;

  const preferServer = shouldUseServerConversion(args.from, args.to);
  const canUseClient = detectCapabilities().supportsVideoConversion;

  if (preferServer) {
    args.onProgress?.({ status: "processing", progress: 5 });
    try {
      buffer = await convertVideoViaApi(args.buf, args.from, args.to);
      args.onProgress?.({ status: "processing", progress: 100 });
    } catch (error) {
      if (!canUseClient) {
        throw error;
      }
      console.warn("Server conversion failed, falling back to client conversion.", error);
      buffer = await convertVideo(args.buf, args.from, args.to, {
        quality: args.quality,
        onProgress: (progress) => {
          args.onProgress?.({
            status: "processing",
            progress: progress.ratio * 100,
            time: progress.time,
          });
        },
      });
    }
  } else {
    try {
      buffer = await convertVideo(args.buf, args.from, args.to, {
        quality: args.quality,
        onProgress: (progress) => {
          args.onProgress?.({
            status: "processing",
            progress: progress.ratio * 100,
            time: progress.time,
          });
        },
      });
    } catch (error) {
      console.warn("Client conversion failed, falling back to server conversion.", error);
      args.onProgress?.({ status: "processing", progress: 5 });
      buffer = await convertVideoViaApi(args.buf, args.from, args.to);
      args.onProgress?.({ status: "processing", progress: 100 });
    }
  }

  return { kind: "single", buffer };
}

async function compressPngOnMainThread(args: {
  buf: ArrayBuffer;
  quality?: number;
}): Promise<ArrayBuffer> {
  const original = args.buf;
  const colorCount = qualityToColorCount(args.quality ?? 0.85);

  try {
    const { default: UPNG } = await import("upng-js");
    const img = UPNG.decode(original);
    const frames = UPNG.toRGBA8(img);
    const frame = frames[0];
    if (!frame) {
      return original;
    }
    const output = UPNG.encode([frame], img.width, img.height, colorCount);
    if (output.byteLength >= original.byteLength) {
      return original;
    }
    return output;
  } catch {
    return original;
  }
}

function qualityToColorCount(quality: number) {
  const clamped = Math.max(0, Math.min(1, quality));
  if (clamped >= 0.99) {
    return 0;
  }
  return Math.max(16, Math.round(clamped * 256));
}
