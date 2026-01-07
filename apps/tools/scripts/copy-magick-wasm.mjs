import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routeDirs = ["image-convert"].map((route) =>
  path.join(appRoot, ".next", "server", "app", "api", route)
);
const publicDir = path.join(appRoot, "public", "vendor", "imagemagick");

let wasmPath;
try {
  wasmPath = require.resolve("@imagemagick/magick-wasm/magick.wasm");
} catch {
  console.warn("magick-wasm not installed; skipping copy.");
  process.exit(0);
}

try {
  await fs.access(wasmPath);
} catch {
  console.warn("magick-wasm file not found; skipping copy.");
  process.exit(0);
}

await Promise.all(
  routeDirs.map(async (dir) => {
    try {
      await fs.access(dir);
    } catch {
      return;
    }

    const target = path.join(dir, "magick.wasm");
    try {
      await fs.copyFile(wasmPath, target);
    } catch {
      return;
    }

    const traceFile = path.join(dir, "route.js.nft.json");
    try {
      const trace = JSON.parse(await fs.readFile(traceFile, "utf8"));
      trace.files = Array.from(new Set([...(trace.files ?? []), "magick.wasm"]));
      await fs.writeFile(traceFile, JSON.stringify(trace));
    } catch {
      // If the trace isn't present, skip modifying it.
    }
  })
);

try {
  await fs.mkdir(publicDir, { recursive: true });
  await fs.copyFile(wasmPath, path.join(publicDir, "magick.wasm"));
} catch {
  // ignore
}
