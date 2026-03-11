import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

const moduleUrl = new URL("./server-action-client.ts", import.meta.url);
const clientModule = existsSync(moduleUrl)
  ? await import(moduleUrl)
  : null;

function createStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.get(key) ?? null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
}

test("server action client id persists in provided storage", () => {
  assert.ok(clientModule, "expected server action client module to exist");

  const storage = createStorage();
  const first = clientModule.getOrCreateServerActionClientId(storage);
  const second = clientModule.getOrCreateServerActionClientId(storage);

  assert.equal(first, second);
  assert.equal(
    storage.getItem(clientModule.SERVER_ACTION_CLIENT_ID_STORAGE_KEY),
    first,
  );
});

test("server action request headers include the client id without overriding content type", () => {
  assert.ok(clientModule, "expected server action client module to exist");

  const headers = clientModule.createServerActionRequestHeaders({
    "Content-Type": "application/octet-stream",
  });

  assert.equal(headers.get("Content-Type"), "application/octet-stream");
  const clientId = headers.get(clientModule.SERVER_ACTION_CLIENT_ID_HEADER);
  assert.ok(clientId);
});
