import test from "node:test";
import assert from "node:assert/strict";

import { compressFile } from "./workerClient.ts";

function makeBuffer(size) {
  return new Uint8Array(size).buffer;
}

test("compressFile uses server image compression for gif", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    const output = makeBuffer(3);
    return new Response(output, { status: 200 });
  };

  try {
    const result = await compressFile({
      format: "gif",
      buf: makeBuffer(10),
      quality: 0.8,
    });
    assert.equal(result.byteLength, 3);
    assert.equal(calls.length, 1);
    const url =
      typeof calls[0].input === "string" ? calls[0].input : calls[0].input.url;
    assert.ok(url.includes("/api/image-compress"));
    assert.ok(url.includes("format=gif"));
    assert.equal(calls[0].init?.method, "POST");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("compressFile returns original buffer when server result is larger", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    const output = makeBuffer(20);
    return new Response(output, { status: 200 });
  };

  const original = makeBuffer(10);
  try {
    const result = await compressFile({
      format: "gif",
      buf: original,
      quality: 0.8,
    });
    assert.equal(result, original);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
