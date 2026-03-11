import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appHeaderSource = readFileSync(
  new URL("../../../packages/app-core/src/components/app-header.tsx", import.meta.url),
  "utf8",
);

test("header nav includes core SERP links but excludes filetypes", () => {
  assert.match(appHeaderSource, /https:\/\/serp\.co/);
  assert.match(appHeaderSource, /https:\/\/extensions\.serp\.co/);
  assert.match(appHeaderSource, /https:\/\/tools\.serp\.co/);
  assert.match(appHeaderSource, /https:\/\/apps\.serp\.co/);
  assert.doesNotMatch(appHeaderSource, /https:\/\/filetypes\.serp\.co/);
});
