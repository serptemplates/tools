// lib/convert/pdf.ts
// PDF → PNG using the legacy pdfjs bundle for worker compatibility.

const workerPublicUrl = "/vendor/pdfjs/pdf.worker.min.js";
let pdfjsPromise: Promise<any> | null = null;

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist/legacy/build/pdf");
  }
  return pdfjsPromise;
}

export async function renderPdfPages(buf: ArrayBuffer, page?: number, format?: string) {
  const pdfjsLib = await getPdfjs();
  // @ts-ignore
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerPublicUrl;
  const doc = await (pdfjsLib as any).getDocument({ data: buf }).promise;
  const out: Array<ArrayBuffer> = [];
  const pages = page ? [page] : Array.from({ length: doc.numPages }, (_, i) => i + 1);
  
  // Determine output format
  const mimeType = format === "jpg" || format === "jpeg" ? "image/jpeg" : "image/png";
  const quality = mimeType === "image/jpeg" ? 0.9 : undefined;

  for (const p of pages) {
    const pg = await doc.getPage(p);
    const viewport = pg.getViewport({ scale: 2 });
    const useOffscreen = typeof OffscreenCanvas !== "undefined";
    const canvas: any = useOffscreen
      ? new OffscreenCanvas(viewport.width, viewport.height)
      : Object.assign(document.createElement("canvas"), { width: viewport.width, height: viewport.height });

    const ctx = canvas.getContext("2d")!;
    
    // Fill white background for JPEG (since it doesn't support transparency)
    if (mimeType === "image/jpeg") {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, viewport.width, viewport.height);
    }
    
    await pg.render({ canvasContext: ctx as any, viewport }).promise;

    const blob: Blob = canvas.convertToBlob
      ? await canvas.convertToBlob({ type: mimeType, quality })
      : await new Promise((resolve) => (canvas as HTMLCanvasElement).toBlob((b)=>resolve(b!), mimeType, quality));

    out.push(await blob.arrayBuffer());
  }

  await doc.destroy();
  return out;
}
