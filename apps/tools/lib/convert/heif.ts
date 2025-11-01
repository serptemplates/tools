// lib/convert/heif.ts
// HEIC/HEIF → RGBA using a self-hosted bundle that works in both window + worker.

export type RGBA = { data: Uint8ClampedArray; width: number; height: number };

// Where you put the bundle file (see step below)
const BUNDLE_URL = "/vendor/libheif/libheif-bundle.js";

let inited = false;
let g: any = null; // global

function hasDocument(): boolean {
  return typeof document !== "undefined" && !!(document as any).createElement;
}
function getGlobal(): any {
  return (globalThis as any);
}

function loadScriptInWindow(src: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (!hasDocument()) return reject(new Error("No document"));
    if ([...document.scripts].some(s => s.src.endsWith(src))) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

async function loadScriptInWorker(src: string): Promise<void> {
  // Module workers don't have importScripts; eval the UMD safely.
  const code = await fetch(src, { cache: "force-cache" }).then(r => {
    if (!r.ok) throw new Error(`Fetch failed ${r.status} ${src}`);
    return r.text();
  });
  // Executes in worker scope; attaches factory to globalThis.libheif
  (0, eval)(code); // eslint-disable-line no-eval
}

async function ensureHeif() {
  if (inited) return;
  g = getGlobal();

  if (hasDocument()) {
    await loadScriptInWindow(BUNDLE_URL);
  } else {
    await loadScriptInWorker(BUNDLE_URL);
  }

  // Some builds expose a factory on g.libheif(), others attach classes directly.
  if (typeof g.libheif === "function") {
    const mod = await g.libheif(); // returns Module (with classes on it AND/OR on global)
    // Prefer classes from module; fall back to globals.
    g.HeifContext   = g.HeifContext   || mod.HeifContext;
    g.HeifDecoder   = g.HeifDecoder   || mod.HeifDecoder;
    g.HeifImage     = g.HeifImage     || mod.HeifImage;
  }

  if (!g.HeifContext && !g.HeifDecoder) {
    throw new Error("libheif classes not found after loading bundle");
  }

  inited = true;
}

/** Unified decode: prefers HeifContext if present; otherwise uses HeifDecoder */
export async function decodeHeifToRGBA(buf: ArrayBuffer): Promise<RGBA> {
  await ensureHeif();

  const bytes = new Uint8Array(buf);

  // Path A: HeifContext API
  if (typeof g.HeifContext === "function") {
    const ctx = new g.HeifContext();
    ctx.read(bytes);
    const handle = ctx.getPrimaryImageHandle();
    const img = handle.decode();
    const width = img.get_width();
    const height = img.get_height();
    const rgba = new Uint8ClampedArray(width * height * 4);
    // Some builds accept (rgba, w, h, opts), others accept (ImageData, cb)
    if (img.display.length >= 4) {
      // (rgba, width, height, options)
      img.display(rgba, width, height, { colorSpace: "rgb", bitDepth: 8 });
    } else {
      // (ImageData, cb)
      await new Promise<void>((resolve, reject) => {
        try {
          const id = new ImageData(rgba, width, height);
          img.display(id, () => resolve());
        } catch (e) { reject(e); }
      });
    }
    img.free?.(); handle.free?.(); ctx.free?.();
    return { data: rgba, width, height };
  }

  // Path B: HeifDecoder API (images array)
  if (typeof g.HeifDecoder === "function") {
    const dec = new g.HeifDecoder();
    const images = dec.decode(bytes);
    if (!images || !images.length) throw new Error("No images in HEIF");
    const img = images[0];
    const width = img.get_width();
    const height = img.get_height();
    const rgba = new Uint8ClampedArray(width * height * 4);
    if (img.display.length >= 4) {
      img.display(rgba, width, height, { colorSpace: "rgb", bitDepth: 8 });
    } else {
      await new Promise<void>((resolve, reject) => {
        try {
          const id = new ImageData(rgba, width, height);
          img.display(id, () => resolve());
        } catch (e) { reject(e); }
      });
    }
    img.free?.();
    return { data: rgba, width, height };
  }

  throw new Error("No compatible libheif API found");
}