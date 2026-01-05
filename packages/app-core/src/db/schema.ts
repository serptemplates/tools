import { pgTable, text, boolean, integer, jsonb, timestamp, uuid, real } from "drizzle-orm/pg-core";

export const tools = pgTable("tools", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  operation: text("operation").notNull(),
  route: text("route").notNull(),
  from: text("from"),
  to: text("to"),
  isActive: boolean("is_active").notNull().default(true),
  tags: text("tags").array(),
  priority: integer("priority"),
  isBeta: boolean("is_beta").notNull().default(false),
  isNew: boolean("is_new").notNull().default(false),
  requiresFFmpeg: boolean("requires_ffmpeg").notNull().default(false),
  handler: text("handler").notNull().default("convert"),
  uiVariant: text("ui_variant").notNull().default("single"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const toolContent = pgTable("tool_content", {
  toolId: text("tool_id")
    .primaryKey()
    .notNull()
    .references(() => tools.id, { onDelete: "cascade" }),
  content: jsonb("content").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const toolRuns = pgTable("tool_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  toolId: text("tool_id").notNull(),
  status: text("status").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  durationMs: integer("duration_ms"),
  inputBytes: integer("input_bytes"),
  outputBytes: integer("output_bytes"),
  errorCode: text("error_code"),
  metadata: jsonb("metadata"),
});

export const toolStatus = pgTable("tool_status", {
  toolId: text("tool_id").primaryKey(),
  status: text("status").notNull(),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  failureRate24h: real("failure_rate_24h"),
  medianDurationMs: integer("median_duration_ms"),
  medianReductionPct: real("median_reduction_pct"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
