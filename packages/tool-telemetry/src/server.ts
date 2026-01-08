import { and, desc, eq, gte } from "drizzle-orm";
import { getDb } from "@serp-tools/app-core/db";
import { toolRuns, toolStatus } from "@serp-tools/app-core/db/schema";
import type { ToolRunEvent, ToolRunStatus, ToolRunRecord } from "./types";
import { median, summarizeToolRuns } from "./metrics";

type RecordToolRunResult = {
  status: number;
  body: {
    ok: boolean;
    skipped?: boolean;
    reason?: string;
    error?: string;
  };
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function isToolRunEvent(payload: unknown): payload is ToolRunEvent {
  if (!payload || typeof payload !== "object") return false;
  const data = payload as Record<string, unknown>;
  return (
    typeof data.runId === "string" &&
    typeof data.toolId === "string" &&
    typeof data.event === "string" &&
    typeof data.startedAt === "string"
  );
}

function toStatus(event: ToolRunEvent): ToolRunStatus {
  if (event.event === "tool_run_started") return "started";
  if (event.event === "tool_run_succeeded") return "succeeded";
  return "failed";
}

function toDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function toNumber(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toMetadata(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

async function updateToolStatus(db: NonNullable<ReturnType<typeof getDb>>, toolId: string) {
  const since = new Date(Date.now() - ONE_DAY_MS);

  const runs = await db
    .select()
    .from(toolRuns)
    .where(and(eq(toolRuns.toolId, toolId), gte(toolRuns.startedAt, since)))
    .orderBy(desc(toolRuns.startedAt));

  const normalizedRuns: ToolRunRecord[] = runs.map((run) => ({
    toolId: run.toolId,
    status: run.status as ToolRunStatus,
    startedAt: run.startedAt,
    durationMs: run.durationMs ?? null,
    inputBytes: run.inputBytes ?? null,
    outputBytes: run.outputBytes ?? null,
    errorCode: run.errorCode ?? null,
    metadata: toMetadata(run.metadata),
  }));

  const summary = summarizeToolRuns(normalizedRuns);
  const completed = normalizedRuns.filter(
    (run) => run.status === "succeeded" || run.status === "failed"
  );

  const reductionSamples = completed
    .filter((run) => run.status === "succeeded")
    .map((run) => {
      const input = toNumber(run.inputBytes);
      const output = toNumber(run.outputBytes);
      if (!input || !output) return null;
      return Math.round((1 - output / input) * 100);
    })
    .filter((value): value is number => value !== null);

  const medianReductionPct = median(reductionSamples);

  let status = "unknown";
  if (completed.length) {
    status = "live";
    if (summary.failureRate !== null && summary.failureRate >= 0.5) {
      status = "broken";
    } else if (summary.failureRate !== null && summary.failureRate >= 0.2) {
      status = "degraded";
    }
  }

  const lastRunAt = runs[0]?.startedAt ?? null;

  await db
    .insert(toolStatus)
    .values({
      toolId,
      status,
      lastRunAt,
      failureRate24h: summary.failureRate,
      medianDurationMs: summary.medianDurationMs,
      medianReductionPct,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: toolStatus.toolId,
      set: {
        status,
        lastRunAt,
        failureRate24h: summary.failureRate,
        medianDurationMs: summary.medianDurationMs,
        medianReductionPct,
        updatedAt: new Date(),
      },
    });
}

export async function recordToolRun(payload: unknown): Promise<RecordToolRunResult> {
  if (!isToolRunEvent(payload)) {
    return { status: 400, body: { ok: false, error: "Missing fields" } };
  }

  const startedAt = toDate(payload.startedAt);
  if (!startedAt) {
    return { status: 400, body: { ok: false, error: "Invalid startedAt" } };
  }

  let db;
  try {
    db = getDb();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Database unavailable";
    return { status: 500, body: { ok: false, error: message } };
  }

  if (!db) {
    return {
      status: 200,
      body: { ok: true, skipped: true, reason: "DATABASE_URL not set" },
    };
  }

  const status = toStatus(payload);

  await db
    .insert(toolRuns)
    .values({
      id: payload.runId,
      toolId: payload.toolId,
      status,
      startedAt,
      durationMs: payload.durationMs ?? null,
      inputBytes: payload.inputBytes ?? null,
      outputBytes: payload.outputBytes ?? null,
      errorCode: payload.errorCode ?? null,
      metadata: payload.metadata ?? null,
    })
    .onConflictDoUpdate({
      target: toolRuns.id,
      set: {
        status,
        durationMs: payload.durationMs ?? null,
        inputBytes: payload.inputBytes ?? null,
        outputBytes: payload.outputBytes ?? null,
        errorCode: payload.errorCode ?? null,
        metadata: payload.metadata ?? null,
      },
    });

  await updateToolStatus(db, payload.toolId);

  return { status: 200, body: { ok: true } };
}
