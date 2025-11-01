import { decodeHeifToRGBA, type RGBA } from "./heif";

/** Draws an ImageBitmap into a canvas and returns RGBA data */
async function bitmapToRGBA(bitmap: ImageBitmap): Promise<RGBA> {
  const useOffscreen = typeof OffscreenCanvas !== "undefined";
  const canvas: any = useOffscreen
    ? new OffscreenCanvas(bitmap.width, bitmap.height)
    : Object.assign(document.createElement("canvas"), { width: bitmap.width, height: bitmap.height });

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  const img = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  bitmap.close?.();
  return { data: img.data, width: img.width, height: img.height };
}

export async function decodeToRGBA(ext: string, buf: ArrayBuffer): Promise<RGBA> {
  const e = (ext || "").toLowerCase();

  if (e === "heic" || e === "heif") {
    return decodeHeifToRGBA(buf);
  }

  // Browser-native decoders handle: jpg/jpeg/png/webp/gif/bmp/avif/ico (varies by engine)
  const blob = new Blob([buf]);
  const bitmap = await createImageBitmap(blob).catch(() => {
    throw new Error("This format isn’t natively supported by your browser.");
  });
  return bitmapToRGBA(bitmap);
}