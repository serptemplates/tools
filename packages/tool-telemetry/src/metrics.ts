import type { ToolRunRecord } from "./types";

export type ToolUsageSummary = {
  totalRuns: number;
  succeededRuns: number;
  failedRuns: number;
  totalInputBytes: number;
  totalOutputBytes: number;
  totalDurationMs: number;
  totalAudioSeconds: number;
  totalAudioHours: number;
  medianDurationMs: number | null;
  failureRate: number | null;
};

function toNumber(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function median(values: number[]): number | null {
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

function getAudioSeconds(metadata?: Record<string, unknown> | null) {
  const value = metadata?.audioSeconds;
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

export function summarizeToolRuns(runs: ToolRunRecord[]): ToolUsageSummary {
  const totalRuns = runs.length;
  const completed = runs.filter(
    (run) => run.status === "succeeded" || run.status === "failed"
  );
  const succeededRuns = completed.filter((run) => run.status === "succeeded").length;
  const failedRuns = completed.filter((run) => run.status === "failed").length;

  const totalInputBytes = runs.reduce((sum, run) => sum + (toNumber(run.inputBytes) ?? 0), 0);
  const totalOutputBytes = runs.reduce((sum, run) => sum + (toNumber(run.outputBytes) ?? 0), 0);
  const totalDurationMs = runs.reduce((sum, run) => sum + (toNumber(run.durationMs) ?? 0), 0);
  const totalAudioSeconds = runs.reduce(
    (sum, run) => sum + getAudioSeconds(run.metadata),
    0
  );

  const durations = completed
    .map((run) => toNumber(run.durationMs))
    .filter((value): value is number => value !== null);
  const medianDurationMs = median(durations);

  const failureRate = completed.length ? failedRuns / completed.length : null;

  return {
    totalRuns,
    succeededRuns,
    failedRuns,
    totalInputBytes,
    totalOutputBytes,
    totalDurationMs,
    totalAudioSeconds,
    totalAudioHours: totalAudioSeconds / 3600,
    medianDurationMs,
    failureRate,
  };
}

export function summarizeToolRunsByTool(runs: ToolRunRecord[]) {
  const grouped = new Map<string, ToolRunRecord[]>();
  for (const run of runs) {
    const list = grouped.get(run.toolId) ?? [];
    list.push(run);
    grouped.set(run.toolId, list);
  }

  const summaryMap = new Map<string, ToolUsageSummary>();
  for (const [toolId, toolRuns] of grouped) {
    summaryMap.set(toolId, summarizeToolRuns(toolRuns));
  }
  return summaryMap;
}
