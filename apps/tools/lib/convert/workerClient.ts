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

const MIME_MAP: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  avi: "video/x-msvideo",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  mpeg: "video/mpeg",
  mpg: "video/mpeg",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  aac: "audio/aac",
  m4a: "audio/mp4",
  opus: "audio/opus",
  flac: "audio/flac",
  wma: "audio/x-ms-wma",
  aiff: "audio/aiff",
  mp2: "audio/mpeg",
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
  asf: "video/x-ms-asf",
};

export function getOutputMimeType(format: string) {
  return MIME_MAP[format.toLowerCase()] ?? "application/octet-stream";
}

export function resolveConversionOp(from: string, to: string, capabilities = detectCapabilities()): ConversionOp {
  if (from === "pdf") return "pdf-pages";
  if (requiresVideoConversion(from, to)) {
    if (!capabilities.supportsVideoConversion) {
      throw new Error(`Video conversion not supported: ${capabilities.reason || "Unknown reason"}`);
    }
    return "video";
  }
  return "raster";
}

export async function convertWithWorker(args: {
  worker: Worker;
  from: string;
  to: string;
  buf: ArrayBuffer;
  onProgress?: (update: ProgressUpdate) => void;
  quality?: number;
}): Promise<ConversionResult> {
  const op = resolveConversionOp(args.from, args.to);
  const workerBuf = op === "raster" ? args.buf.slice(0) : args.buf;

  try {
    return await convertWithWorkerInner({ ...args, op, buf: workerBuf });
  } catch (error) {
    if (op === "raster" && isDecodeError(error)) {
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
    args.worker.onmessage = (ev: MessageEvent<any>) => {
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
      reject(new Error(`Worker error: ${error.message || error}`));
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
  } catch (error) {
    return await compressPngOnMainThread(args);
  }
}

async function compressPngWithWorkerInner(args: {
  worker: Worker;
  buf: ArrayBuffer;
  quality?: number;
}): Promise<ArrayBuffer> {
  return await new Promise<ArrayBuffer>((resolve, reject) => {
    args.worker.onmessage = (ev: MessageEvent<any>) => {
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
      reject(new Error(`Worker error: ${error.message || error}`));
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
