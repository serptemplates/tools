import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appLayoutSource = readFileSync(
  new URL("../../../packages/app-core/src/components/app-layout.tsx", import.meta.url),
  "utf8",
);
const siteFooterSource = readFileSync(
  new URL("../../../packages/app-core/src/components/site-footer.tsx", import.meta.url),
  "utf8",
);
const rootLayoutSource = readFileSync(
  new URL("../app/layout.tsx", import.meta.url),
  "utf8",
);

test("tools app root layout uses the shared app shell", () => {
  assert.match(rootLayoutSource, /AppLayout/);
  assert.match(rootLayoutSource, /<AppLayout>\{children\}<\/AppLayout>/);
});

test("shared app shell renders the global site footer", () => {
  assert.match(appLayoutSource, /SiteFooter/);
  assert.match(appLayoutSource, /<SiteFooter\s*\/>/);
});

test("site footer includes core SERP Tools navigation", () => {
  assert.match(siteFooterSource, /SERP Tools/);
  assert.match(siteFooterSource, /video-downloader/);
  assert.match(siteFooterSource, /download-loom-videos/);
  assert.match(siteFooterSource, /\/categories\//);
  assert.match(siteFooterSource, /https:\/\/apps\.serp\.co/);
  assert.match(siteFooterSource, /https:\/\/extensions\.serp\.co/);
});
