import { AUDIO_FORMATS, VIDEO_FORMATS } from "./capabilities.ts";

export type CompressionTarget =
  | "audio"
  | "image-server"
  | "image-worker"
  | "pdf"
  | "unsupported"
  | "video";

const IMAGE_WORKER_FORMATS = new Set(["png", "jpg", "jpeg", "webp"]);
const IMAGE_SERVER_FORMATS = new Set([
  "gif",
  "svg",
  "heic",
  "heif",
  "avif",
  "tiff",
  "tif",
  "bmp",
]);
const AUDIO_FORMAT_SET = new Set(AUDIO_FORMATS);
const VIDEO_FORMAT_SET = new Set(VIDEO_FORMATS);

function normalizeQuality(quality: number | undefined, fallback: number): number {
  if (typeof quality !== "number" || Number.isNaN(quality)) {
    return fallback;
  }
  return Math.min(0.95, Math.max(0.1, quality));
}

export function resolveCompressionTarget(format: string): CompressionTarget {
  const normalized = format.toLowerCase();
  if (normalized === "pdf") return "pdf";
  if (IMAGE_WORKER_FORMATS.has(normalized)) return "image-worker";
  if (IMAGE_SERVER_FORMATS.has(normalized)) return "image-server";
  if (AUDIO_FORMAT_SET.has(normalized)) return "audio";
  if (VIDEO_FORMAT_SET.has(normalized)) return "video";
  return "unsupported";
}

export function mapQualityToPngLevel(quality?: number): number {
  const normalized = normalizeQuality(quality, 0.8);
  const level = Math.round((1 - normalized) * 6);
  return Math.min(6, Math.max(0, level));
}

export function mapQualityToImageQuality(quality?: number): number {
  const normalized = normalizeQuality(quality, 0.82);
  return Math.round(normalized * 100);
}

export function mapQualityToAudioBitrate(quality?: number): string {
  const normalized = normalizeQuality(quality, 0.7);
  if (normalized >= 0.85) return "192k";
  if (normalized >= 0.7) return "160k";
  if (normalized >= 0.55) return "128k";
  if (normalized >= 0.4) return "96k";
  return "64k";
}

export function mapQualityToVideoCrf(quality?: number): number {
  const normalized = normalizeQuality(quality, 0.7);
  const crf = Math.round(32 - normalized * 10);
  return Math.min(34, Math.max(18, crf));
}

export function isImageCompressionFormat(format: string): boolean {
  const normalized = format.toLowerCase();
  return IMAGE_WORKER_FORMATS.has(normalized) || IMAGE_SERVER_FORMATS.has(normalized);
}
