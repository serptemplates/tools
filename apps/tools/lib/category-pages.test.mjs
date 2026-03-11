import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const categoryPageUrl = new URL("../app/category/[categoryName]/page.tsx", import.meta.url);
const categoryPagePath = fileURLToPath(categoryPageUrl);
const categoryPageSource = existsSync(categoryPagePath)
  ? readFileSync(categoryPageUrl, "utf8")
  : "";
const sitemapSource = readFileSync(new URL("./sitemap.ts", import.meta.url), "utf8");

test("category sitemap paths are not left empty", () => {
  assert.doesNotMatch(sitemapSource, /const CATEGORY_PATHS: string\[] = \[\];/);
  assert.match(sitemapSource, /getCategoryPaths/);
});

test("category route statically generates known category pages", () => {
  assert.match(categoryPageSource, /generateStaticParams/);
  assert.match(categoryPageSource, /dynamicParams = false/);
  assert.match(categoryPageSource, /buildCategoryMetadata/);
});
