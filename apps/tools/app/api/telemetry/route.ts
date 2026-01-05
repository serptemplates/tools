import { NextResponse } from "next/server";
import { and, desc, eq, gte } from "drizzle-orm";
import { getDb } from "@serp-tools/app-core/db";
import { toolRuns, toolStatus } from "@serp-tools/app-core/db/schema";

type ToolRunEvent = {
  event: "tool_run_started" | "tool_run_succeeded" | "tool_run_failed";
  runId: string;
  toolId: string;
  from?: string;
  to?: string;
  startedAt: string;
  durationMs?: number;
  inputBytes?: number;
  outputBytes?: number;
  errorCode?: string;
  metadata?: Record<string, unknown>;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    const lower = sorted[mid - 1];
    const upper = sorted[mid];
    if (lower === undefined || upper === undefined) return null;
    return Math.round((lower + upper) / 2);
  }
  return sorted[mid] ?? null;
}

function toNumber(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

type DbClient = NonNullable<ReturnType<typeof getDb>>;

async function updateToolStatus(db: DbClient, toolId: string) {
  const since = new Date(Date.now() - ONE_DAY_MS);

  const runs = await db
    .select()
    .from(toolRuns)
    .where(and(eq(toolRuns.toolId, toolId), gte(toolRuns.startedAt, since)))
    .orderBy(desc(toolRuns.startedAt));

  const completed = runs.filter((run) => run.status === "succeeded" || run.status === "failed");
  const failures = completed.filter((run) => run.status === "failed");

  const failureRate24h = completed.length ? failures.length / completed.length : null;
  const medianDurationMs = median(
    completed
      .map((run) => toNumber(run.durationMs))
      .filter((value): value is number => value !== null)
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
    if (failureRate24h !== null && failureRate24h >= 0.5) {
      status = "broken";
    } else if (failureRate24h !== null && failureRate24h >= 0.2) {
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
      failureRate24h,
      medianDurationMs,
      medianReductionPct,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: toolStatus.toolId,
      set: {
        status,
        lastRunAt,
        failureRate24h,
        medianDurationMs,
        medianReductionPct,
        updatedAt: new Date(),
      },
    });
}

export async function POST(request: Request) {
  let payload: ToolRunEvent | null = null;
  try {
    payload = (await request.json()) as ToolRunEvent;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload?.runId || !payload?.toolId || !payload?.event || !payload?.startedAt) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  let startedAt: Date;
  try {
    startedAt = new Date(payload.startedAt);
    if (Number.isNaN(startedAt.getTime())) throw new Error("invalid date");
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid startedAt" }, { status: 400 });
  }

  let db;
  try {
    db = getDb();
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Database unavailable" },
      { status: 500 }
    );
  }
  if (!db) {
    return NextResponse.json({ ok: true, skipped: true, reason: "DATABASE_URL not set" });
  }
  const status =
    payload.event === "tool_run_started"
      ? "started"
      : payload.event === "tool_run_succeeded"
        ? "succeeded"
        : "failed";

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

  return NextResponse.json({ ok: true });
}
