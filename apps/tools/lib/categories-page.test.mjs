import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const categoriesPageUrl = new URL("../app/categories/page.tsx", import.meta.url);
const categoriesPagePath = fileURLToPath(categoriesPageUrl);
const categoriesPageSource = existsSync(categoriesPagePath)
  ? readFileSync(categoriesPageUrl, "utf8")
  : "";
const sitemapSource = readFileSync(new URL("./sitemap.ts", import.meta.url), "utf8");

test("categories hub route exists and is backed by shared category data", () => {
  assert.notEqual(categoriesPageSource, "");
  assert.match(categoriesPageSource, /buildToolDirectoryEntries/);
  assert.match(categoriesPageSource, /getToolDirectoryCategories/);
  assert.match(categoriesPageSource, /buildCategoriesIndexMetadata/);
  assert.match(categoriesPageSource, /href=\{category\.href\}/);
});

test("static sitemap paths include the categories hub page", () => {
  assert.match(sitemapSource, /"\/categories\/"/);
});
