import type { RGBA } from "./heif";

export async function encodeFromRGBA(
  toExt: string,
  rgba: RGBA,
  quality = 0.85
): Promise<Blob> {
  const useOffscreen = typeof OffscreenCanvas !== "undefined";
  const canvas: any = useOffscreen
    ? new OffscreenCanvas(rgba.width, rgba.height)
    : Object.assign(document.createElement("canvas"), { width: rgba.width, height: rgba.height });

  const ctx = canvas.getContext("2d")!;
  ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba.data), rgba.width, rgba.height), 0, 0);

  const mime =
    toExt === "jpg" || toExt === "jpeg" ? "image/jpeg" :
    toExt === "webp" ? "image/webp" :
    toExt === "avif" ? "image/avif" :
    "image/png";

  if (canvas.convertToBlob) {
    return canvas.convertToBlob({
      type: mime,
      quality: mime === "image/png" ? undefined : quality,
    });
  }
  return new Promise<Blob>((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      mime,
      mime === "image/png" ? undefined : quality
    );
  });
}