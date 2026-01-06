import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routeDirs = ["video-convert", "image-convert"].map((route) =>
  path.join(appRoot, ".next", "server", "app", "api", route)
);

if (!ffmpegPath) {
  console.warn("ffmpeg-static did not resolve a binary path; skipping copy.");
  process.exit(0);
}

try {
  await fs.access(ffmpegPath);
} catch {
  console.warn("ffmpeg-static binary not found; skipping copy.");
  process.exit(0);
}

await Promise.all(
  routeDirs.map(async (dir) => {
    try {
      await fs.access(dir);
    } catch {
      return;
    }

    const target = path.join(dir, "ffmpeg");
    try {
      await fs.copyFile(ffmpegPath, target);
      await fs.chmod(target, 0o755);
    } catch {
      return;
    }

    const traceFile = path.join(dir, "route.js.nft.json");
    try {
      const trace = JSON.parse(await fs.readFile(traceFile, "utf8"));
      trace.files = Array.from(new Set([...(trace.files ?? []), "ffmpeg"]));
      await fs.writeFile(traceFile, JSON.stringify(trace));
    } catch {
      // If the trace isn't present, skip modifying it.
    }
  })
);
