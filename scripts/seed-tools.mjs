import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDb } from "../packages/app-core/src/db/index.ts";
import { toolContent, tools } from "../packages/app-core/src/db/schema.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolsPath = path.join(__dirname, "..", "packages", "app-core", "src", "data", "tools.json");

const raw = await readFile(toolsPath, "utf-8");
const data = JSON.parse(raw);

const db = getDb();

for (const tool of data) {
  await db
    .insert(tools)
    .values({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      operation: tool.operation,
      route: tool.route,
      from: tool.from ?? null,
      to: tool.to ?? null,
      isActive: tool.isActive ?? true,
      tags: tool.tags ?? null,
      priority: tool.priority ?? null,
      isBeta: tool.isBeta ?? false,
      isNew: tool.isNew ?? false,
      requiresFFmpeg: tool.requiresFFmpeg ?? false,
      handler: tool.handler ?? "convert",
      uiVariant: tool.uiVariant ?? "single",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: tools.id,
      set: {
        name: tool.name,
        description: tool.description,
        operation: tool.operation,
        route: tool.route,
        from: tool.from ?? null,
        to: tool.to ?? null,
        isActive: tool.isActive ?? true,
        tags: tool.tags ?? null,
        priority: tool.priority ?? null,
        isBeta: tool.isBeta ?? false,
        isNew: tool.isNew ?? false,
        requiresFFmpeg: tool.requiresFFmpeg ?? false,
        handler: tool.handler ?? "convert",
        uiVariant: tool.uiVariant ?? "single",
        updatedAt: new Date(),
      },
    });

  if (tool.content) {
    await db
      .insert(toolContent)
      .values({
        toolId: tool.id,
        content: tool.content,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: toolContent.toolId,
        set: {
          content: tool.content,
          updatedAt: new Date(),
        },
      });
  }
}

console.log(`Seeded ${data.length} tools.`);
