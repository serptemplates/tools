// lib/convert/pdf.ts
// PDF → PNG using the legacy pdfjs bundle for worker compatibility.

const workerPublicUrl = "/vendor/pdfjs/pdf.worker.min.js";
type PdfCanvasContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

type PdfjsPage = {
  getViewport: (options: { scale: number }) => { width: number; height: number };
  render: (options: { canvasContext: PdfCanvasContext; viewport: { width: number; height: number } }) => {
    promise: Promise<void>;
  };
};

type PdfjsDocument = {
  numPages: number;
  getPage: (page: number) => Promise<PdfjsPage>;
  destroy: () => void | Promise<void>;
};

type PdfjsModule = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (options: { data: ArrayBuffer }) => { promise: Promise<PdfjsDocument> };
};

let pdfjsPromise: Promise<PdfjsModule> | null = null;

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import(/* webpackIgnore: true */ "/vendor/pdfjs/pdf.min.mjs")
      .then((mod) => mod as unknown as PdfjsModule)
      .catch(async () => {
        const mod = await import("pdfjs-dist/legacy/build/pdf");
        return mod as unknown as PdfjsModule;
      });
  }
  return pdfjsPromise;
}

export async function renderPdfPages(buf: ArrayBuffer, page?: number, format?: string) {
  const pdfjsLib = await getPdfjs();
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerPublicUrl;
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;
  const out: Array<ArrayBuffer> = [];
  const pages = page ? [page] : Array.from({ length: doc.numPages }, (_, i) => i + 1);
  
  // Determine output format
  const mimeType = format === "jpg" || format === "jpeg" ? "image/jpeg" : "image/png";
  const quality = mimeType === "image/jpeg" ? 0.9 : undefined;

  for (const p of pages) {
    const pg = await doc.getPage(p);
    const viewport = pg.getViewport({ scale: 2 });
    const useOffscreen = typeof OffscreenCanvas !== "undefined";
    const canvas: HTMLCanvasElement | OffscreenCanvas = useOffscreen
      ? new OffscreenCanvas(viewport.width, viewport.height)
      : Object.assign(document.createElement("canvas"), { width: viewport.width, height: viewport.height });

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to create 2D canvas context.");
    }
    const ctx2d = ctx as PdfCanvasContext;
    
    // Fill white background for JPEG (since it doesn't support transparency)
    if (mimeType === "image/jpeg") {
      ctx2d.fillStyle = "white";
      ctx2d.fillRect(0, 0, viewport.width, viewport.height);
    }

    await pg.render({ canvasContext: ctx2d, viewport }).promise;

    const blob: Blob = "convertToBlob" in canvas
      ? await (canvas as OffscreenCanvas).convertToBlob({ type: mimeType, quality })
      : await new Promise((resolve) => (canvas as HTMLCanvasElement).toBlob((b)=>resolve(b!), mimeType, quality));

    out.push(await blob.arrayBuffer());
  }

  await doc.destroy();
  return out;
}
