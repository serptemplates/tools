import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const toolsLinkHubSource = readFileSync(
  new URL("../components/sections/ToolsLinkHub.tsx", import.meta.url),
  "utf8",
);

test("tools link hub uses tabbed progressive disclosure for large tool sets", () => {
  assert.match(toolsLinkHubSource, /buildToolDirectoryEntries/);
  assert.match(toolsLinkHubSource, /getToolDirectoryCategories/);
  assert.match(toolsLinkHubSource, /getToolsForDirectoryCategory/);
  assert.match(toolsLinkHubSource, /TabsList/);
  assert.match(toolsLinkHubSource, /TabsTrigger/);
  assert.match(toolsLinkHubSource, /CATEGORY_PREVIEW_LIMIT\s*=\s*48/);
  assert.match(toolsLinkHubSource, /showAllTools/);
  assert.match(toolsLinkHubSource, /Show fewer tools/);
  assert.match(toolsLinkHubSource, /hiddenToolCount/);
  assert.match(toolsLinkHubSource, /setShowAllTools\(false\)/);
  assert.match(toolsLinkHubSource, /View \{activeCategory\.name\} category/);
});
