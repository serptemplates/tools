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

  const canvasToBlob = async (type: string, q?: number) => {
    if (canvas.convertToBlob) {
      return canvas.convertToBlob({
        type,
        quality: type === "image/png" ? undefined : q,
      });
    }
    return new Promise<Blob>((resolve, reject) => {
      (canvas as HTMLCanvasElement).toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        type,
        type === "image/png" ? undefined : q
      );
    });
  };

  if (toExt === "svg") {
    const pngBlob = await canvasToBlob("image/png");
    const buffer = await pngBlob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    if (typeof btoa !== "function") {
      throw new Error("Base64 encoding not supported in this environment.");
    }
    const base64 = btoa(binary);
    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${rgba.width}" height="${rgba.height}" viewBox="0 0 ${rgba.width} ${rgba.height}">`,
      `<image href="data:image/png;base64,${base64}" width="${rgba.width}" height="${rgba.height}" />`,
      `</svg>`
    ].join("");
    return new Blob([svg], { type: "image/svg+xml" });
  }

  if (toExt === "pdf") {
    const pngBlob = await canvasToBlob("image/png");
    const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
    const { PDFDocument } = await import("pdf-lib");
    const pdfDoc = await PDFDocument.create();
    const pngImage = await pdfDoc.embedPng(pngBytes);
    const page = pdfDoc.addPage([rgba.width, rgba.height]);
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: rgba.width,
      height: rgba.height,
    });
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: "application/pdf" });
  }

  const mime =
    toExt === "jpg" || toExt === "jpeg" ? "image/jpeg" :
    toExt === "webp" ? "image/webp" :
    toExt === "avif" ? "image/avif" :
    "image/png";

  return canvasToBlob(mime, quality);
}
