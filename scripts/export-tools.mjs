import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDb } from "../packages/app-core/src/db/index.ts";
import { toolContent, tools } from "../packages/app-core/src/db/schema.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = process.argv[2] ?? path.join(__dirname, "..", "out", "tools.db.json");

const db = getDb();
const toolRows = await db.select().from(tools);
const contentRows = await db.select().from(toolContent);
const contentMap = new Map(contentRows.map((row) => [row.toolId, row.content]));

const output = toolRows.map((tool) => ({
  id: tool.id,
  name: tool.name,
  description: tool.description,
  operation: tool.operation,
  route: tool.route,
  from: tool.from,
  to: tool.to,
  isActive: tool.isActive,
  tags: tool.tags ?? undefined,
  priority: tool.priority ?? undefined,
  isBeta: tool.isBeta,
  isNew: tool.isNew,
  requiresFFmpeg: tool.requiresFFmpeg,
  handler: tool.handler,
  uiVariant: tool.uiVariant,
  content: contentMap.get(tool.id),
}));

await writeFile(outputPath, JSON.stringify(output, null, 2));
console.log(`Exported ${output.length} tools to ${outputPath}`);
