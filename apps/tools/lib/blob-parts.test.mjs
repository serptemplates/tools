import test from "node:test";
import assert from "node:assert/strict";

import { normalizeBlobPart } from "./blob-parts.ts";

test("normalizeBlobPart returns array buffers unchanged when SharedArrayBuffer is unavailable", () => {
  const slice = new ArrayBuffer(8);

  assert.equal(normalizeBlobPart(slice), slice);
});

test("normalizeBlobPart copies shared array buffers into array buffers", () => {
  const shared = new SharedArrayBuffer(4);
  const view = new Uint8Array(shared);
  view.set([1, 2, 3, 4]);

  const normalized = normalizeBlobPart(shared);

  assert.ok(normalized instanceof ArrayBuffer);
  assert.deepEqual(Array.from(new Uint8Array(normalized)), [1, 2, 3, 4]);
});
