import test from "node:test";
import assert from "node:assert/strict";

import {
  buildOperationFallbackDescription,
  getOperationLabel,
} from "./tool-operations.ts";

test("getOperationLabel returns Downloader for download tools", () => {
  assert.equal(getOperationLabel("download"), "Downloader");
});

test("getOperationLabel falls back to Convert when missing", () => {
  assert.equal(getOperationLabel(undefined), "Convert");
});

test("buildOperationFallbackDescription uses download-specific copy", () => {
  assert.equal(
    buildOperationFallbackDescription({
      operation: "download",
      from: "video",
    }),
    "Download video files online.",
  );
});
