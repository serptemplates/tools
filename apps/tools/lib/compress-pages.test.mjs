import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tools = JSON.parse(
  readFileSync(
    new URL("../../../packages/app-core/src/data/tools.json", import.meta.url),
    "utf8",
  ),
);
const plannerSource = readFileSync(
  new URL("../../../docs/planner/tools_planner.csv", import.meta.url),
  "utf8",
);

const requestedCompressors = [
  { keyword: "png optimizer", id: "png-to-png", format: "png", route: "/compress-png" },
  { keyword: "pdf compressor", id: "compress-pdf", format: "pdf", route: "/compress-pdf" },
  { keyword: "mp3 compressor", id: "compress-mp3", format: "mp3", route: "/compress-mp3" },
  { keyword: "jpg compressor", id: "compress-jpg", format: "jpg", route: "/compress-jpg" },
  { keyword: "wav compressor", id: "compress-wav", format: "wav", route: "/compress-wav" },
  { keyword: "gif compressor", id: "compress-gif", format: "gif", route: "/compress-gif" },
  { keyword: "svg compressor", id: "compress-svg", format: "svg", route: "/compress-svg" },
  { keyword: "heic compressor", id: "compress-heic", format: "heic", route: "/compress-heic" },
  { keyword: "heif compressor", id: "compress-heif", format: "heif", route: "/compress-heif" },
  { keyword: "avif compressor", id: "compress-avif", format: "avif", route: "/compress-avif" },
  { keyword: "tiff compressor", id: "compress-tiff", format: "tiff", route: "/compress-tiff" },
  { keyword: "bmp compressor", id: "compress-bmp", format: "bmp", route: "/compress-bmp" },
  { keyword: "jpeg compressor", id: "compress-jpeg", format: "jpeg", route: "/compress-jpeg" },
  { keyword: "webp compressor", id: "compress-webp", format: "webp", route: "/compress-webp" },
  { keyword: "mp4 compressor", id: "compress-mp4", format: "mp4", route: "/compress-mp4" },
  { keyword: "mov compressor", id: "compress-mov", format: "mov", route: "/compress-mov" },
  { keyword: "mkv compressor", id: "compress-mkv", format: "mkv", route: "/compress-mkv" },
  { keyword: "avi compressor", id: "compress-avi", format: "avi", route: "/compress-avi" },
  { keyword: "webm compressor", id: "compress-webm", format: "webm", route: "/compress-webm" },
  { keyword: "flv compressor", id: "compress-flv", format: "flv", route: "/compress-flv" },
  { keyword: "aac compressor", id: "compress-aac", format: "aac", route: "/compress-aac" },
  { keyword: "m4a compressor", id: "compress-m4a", format: "m4a", route: "/compress-m4a" },
  { keyword: "ogg compressor", id: "compress-ogg", format: "ogg", route: "/compress-ogg" },
  { keyword: "flac compressor", id: "compress-flac", format: "flac", route: "/compress-flac" },
];

test("requested compressor keyword landers exist in the registry and planner", () => {
  for (const entry of requestedCompressors) {
    const tool = tools.find((candidate) => candidate.id === entry.id);

    assert.ok(tool, `expected ${entry.id} to exist in tools.json`);
    assert.equal(tool.operation, "compress", `expected ${entry.id} to be a compress tool`);
    assert.equal(tool.isActive, true, `expected ${entry.id} to be active`);
    assert.equal(tool.route, entry.route, `expected ${entry.id} route to match slug`);
    assert.equal(tool.from, entry.format, `expected ${entry.id} from format`);
    assert.equal(tool.to, entry.format, `expected ${entry.id} to format`);
    assert.match(
      plannerSource,
      new RegExp(`^${entry.keyword},compress,`, "mi"),
      `expected planner row for ${entry.id}`,
    );
  }
});
