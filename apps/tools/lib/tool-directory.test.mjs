import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildToolDirectoryEntries,
  getAvailableToolOperations,
  getCategoryPagePaths,
  getToolDirectoryCategories,
  getToolsForDirectoryCategory,
} from "./tool-directory.ts";

const toolsRegistry = JSON.parse(
  readFileSync(new URL("../../../packages/app-core/src/data/tools.json", import.meta.url), "utf8"),
);

test("tool directory exposes one category path per active operation", () => {
  assert.deepEqual(getAvailableToolOperations(toolsRegistry), [
    "convert",
    "download",
    "compress",
    "combine",
    "bulk",
    "edit",
    "video-editor",
    "image-editor",
    "audio-editor",
    "view",
  ]);

  assert.deepEqual(getCategoryPagePaths(toolsRegistry), [
    "/category/convert/",
    "/category/download/",
    "/category/compress/",
    "/category/combine/",
    "/category/bulk/",
    "/category/edit/",
    "/category/video-editor/",
    "/category/image-editor/",
    "/category/audio-editor/",
    "/category/view/",
  ]);
});

test("tool directory categories and download category tools are derived from the registry", () => {
  const tools = buildToolDirectoryEntries(toolsRegistry);
  const categories = getToolDirectoryCategories(tools);
  const downloadCategory = categories.find((category) => category.id === "download");
  const activeDownloadTools = toolsRegistry
    .filter((tool) => tool.isActive && tool.operation === "download")
    .map((tool) => tool.id)
    .sort();

  assert.ok(downloadCategory);
  assert.equal(downloadCategory?.count, activeDownloadTools.length);

  const downloadToolIds = getToolsForDirectoryCategory(tools, "download")
    .map((tool) => tool.id)
    .sort();

  assert.deepEqual(downloadToolIds, activeDownloadTools);
});

test("tool directory entries stay plain-data safe for server to client rendering", () => {
  const [firstTool] = buildToolDirectoryEntries(toolsRegistry);

  assert.ok(firstTool);
  assert.equal("icon" in firstTool, false);
  assert.doesNotThrow(() => JSON.stringify(firstTool));
});
