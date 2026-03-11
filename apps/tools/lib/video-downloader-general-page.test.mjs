import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tools = JSON.parse(
  readFileSync(
    new URL("../../../packages/app-core/src/data/tools.json", import.meta.url),
    "utf8",
  ),
);
const downloaderToolSource = readFileSync(
  new URL("../components/VideoDownloaderTool.tsx", import.meta.url),
  "utf8",
);

test("generic video downloader is configured as the broad download route", () => {
  const tool = tools.find((entry) => entry.id === "video-downloader");

  assert.ok(tool);
  assert.equal(tool.operation, "download");
  assert.equal(tool.route, "/video-downloader");
  assert.equal(tool.isActive, true);
  assert.match(tool.content.tool.subtitle, /many public platforms/i);
  assert.match(tool.content.faqs[0].answer, /many supported platforms/i);
});

test("generic video downloader hero copy advertises broad public host support", () => {
  assert.match(
    downloaderToolSource,
    /Supports many public platforms including[\s\S]*YouTube, TikTok, Vimeo, Loom, Wistia,[\s\S]*Dailymotion, Reddit, and more\./,
  );
});
