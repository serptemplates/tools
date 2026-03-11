import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tools = JSON.parse(
  readFileSync(
    new URL("../../../packages/app-core/src/data/tools.json", import.meta.url),
    "utf8",
  ),
);

test("loom video downloader is registered as an active download tool", () => {
  const tool = tools.find((entry) => entry.id === "download-loom-videos");

  assert.ok(tool, "expected download-loom-videos tool to exist");
  assert.equal(tool.operation, "download");
  assert.equal(tool.isActive, true);
  assert.equal(tool.route, "/download-loom-videos");
  assert.match(tool.content.tool.title, /Loom Video Downloader/);
});
