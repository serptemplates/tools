import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { ImageMagick, MagickFormat, initializeImageMagick } =
  require("@imagemagick/magick-wasm") as typeof import("@imagemagick/magick-wasm");

const MAGICK_FORMATS: Record<string, string> = {
  ai: MagickFormat.Ai,
  apng: MagickFormat.APng,
  bmp: MagickFormat.Bmp,
  cur: MagickFormat.Cur,
  dds: MagickFormat.Dds,
  gif: MagickFormat.Gif,
  ico: MagickFormat.Ico,
  jpg: MagickFormat.Jpg,
  jpeg: MagickFormat.Jpeg,
  png: MagickFormat.Png,
  psd: MagickFormat.Psd,
  svg: MagickFormat.Svg,
  tga: MagickFormat.Tga,
  tif: MagickFormat.Tiff,
  tiff: MagickFormat.Tiff,
  webp: MagickFormat.WebP,
  xcf: MagickFormat.Xcf,
};

let magickInit: Promise<void> | null = null;
let cachedWasmPath: string | null = null;

function resolveWasmPath() {
  if (cachedWasmPath) return cachedWasmPath;
  const candidates = [
    path.join(process.cwd(), "public", "vendor", "imagemagick", "magick.wasm"),
    path.join(process.cwd(), "apps", "tools", "public", "vendor", "imagemagick", "magick.wasm"),
    path.join(process.cwd(), ".next", "server", "app", "api", "image-convert", "magick.wasm"),
    path.join(
      process.cwd(),
      "apps",
      "tools",
      "node_modules",
      "@imagemagick",
      "magick-wasm",
      "dist",
      "magick.wasm"
    ),
    path.join(process.cwd(), "node_modules", "@imagemagick", "magick-wasm", "dist", "magick.wasm"),
  ];

  cachedWasmPath = candidates.find((candidate) => existsSync(candidate)) ?? null;
  return cachedWasmPath;
}

async function ensureMagickWasm() {
  if (!magickInit) {
    magickInit = (async () => {
      const wasmPath = resolveWasmPath();
      if (!wasmPath) {
        throw new Error("Magick WASM binary not found.");
      }
      const wasmBytes = await readFile(wasmPath);
      await initializeImageMagick(wasmBytes);
    })();
  }
  await magickInit;
}

function resolveMagickFormat(format: string) {
  return MAGICK_FORMATS[format];
}

export function canUseMagickWasm(from: string, to: string) {
  return Boolean(resolveMagickFormat(from) && resolveMagickFormat(to));
}

export async function convertWithMagickWasm(input: Buffer, from: string, to: string) {
  await ensureMagickWasm();
  const fromFormat = resolveMagickFormat(from);
  const toFormat = resolveMagickFormat(to);

  if (!fromFormat || !toFormat) {
    throw new Error(`Magick WASM does not support ${from} -> ${to}.`);
  }

  const bytes = new Uint8Array(input);
  const output = await ImageMagick.read(bytes, fromFormat, (image) =>
    image.write(toFormat, (data) => data)
  );

  return Buffer.from(output);
}
