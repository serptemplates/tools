import toolsData from "@serp-tools/app-core/data/tools.json";
import { getDb } from "@serp-tools/app-core/db";
import { toolRuns, toolStatus } from "@serp-tools/app-core/db/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type FailureSummary = {
  toolId: string;
  errorCode: string | null;
  count: number;
  lastSeen: Date | null;
  sampleMetadata: Record<string, unknown> | null;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_METADATA_LENGTH = 240;

const toolMap = new Map(
  (toolsData as Array<{ id: string; name: string; route: string }>).map((tool) => [
    tool.id,
    tool,
  ])
);

export default async function ToolsDashboard({ searchParams }: PageProps) {
  const token = process.env.INTERNAL_DASHBOARD_TOKEN;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const providedToken = Array.isArray(resolvedSearchParams?.token)
    ? resolvedSearchParams?.token[0]
    : resolvedSearchParams?.token;
  if (token && token !== providedToken) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto border rounded-lg p-6">
          <h1 className="text-2xl font-semibold mb-2">Tools Dashboard</h1>
          <p className="text-sm text-muted-foreground">Unauthorized.</p>
        </div>
      </main>
    );
  }

  let rows: Array<typeof toolStatus.$inferSelect> = [];
  let failureRows: FailureSummary[] = [];
  let errorMessage: string | null = null;

  try {
    const db = getDb();
    if (!db) {
      throw new Error("Telemetry database not configured (DATABASE_URL not set).");
    }
    rows = await db.select().from(toolStatus).orderBy(desc(toolStatus.updatedAt));

    const since = new Date(Date.now() - ONE_DAY_MS);
    const failureCountExpr = sql<number>`count(*)`.mapWith(Number);
    const lastSeenExpr = sql<Date>`max(${toolRuns.startedAt})`;

    const failureCounts = await db
      .select({
        toolId: toolRuns.toolId,
        errorCode: toolRuns.errorCode,
        count: failureCountExpr,
        lastSeen: lastSeenExpr,
      })
      .from(toolRuns)
      .where(and(eq(toolRuns.status, "failed"), gte(toolRuns.startedAt, since)))
      .groupBy(toolRuns.toolId, toolRuns.errorCode)
      .orderBy(desc(failureCountExpr));

    const recentFailures = await db
      .select({
        toolId: toolRuns.toolId,
        errorCode: toolRuns.errorCode,
        metadata: toolRuns.metadata,
        startedAt: toolRuns.startedAt,
      })
      .from(toolRuns)
      .where(and(eq(toolRuns.status, "failed"), gte(toolRuns.startedAt, since)))
      .orderBy(desc(toolRuns.startedAt))
      .limit(200);

    const sampleMetadataByKey = new Map<string, Record<string, unknown>>();
    for (const run of recentFailures) {
      if (!run.metadata) continue;
      const key = `${run.toolId}::${run.errorCode ?? "unknown"}`;
      if (!sampleMetadataByKey.has(key)) {
        sampleMetadataByKey.set(key, run.metadata as Record<string, unknown>);
      }
    }

    failureRows = failureCounts.map((row) => {
      const key = `${row.toolId}::${row.errorCode ?? "unknown"}`;
      return {
        toolId: row.toolId,
        errorCode: row.errorCode ?? null,
        count: row.count ?? 0,
        lastSeen: row.lastSeen ?? null,
        sampleMetadata: sampleMetadataByKey.get(key) ?? null,
      };
    });
  } catch (err: unknown) {
    errorMessage = err instanceof Error ? err.message : "Failed to load tool status.";
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Tools Dashboard</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Status and telemetry summary for tool runs (last 24h).
        </p>

        {errorMessage ? (
          <div className="border rounded-lg p-4 text-sm text-red-600">
            {errorMessage}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left p-3">Tool</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Last Run</th>
                    <th className="text-right p-3">Failure Rate</th>
                    <th className="text-right p-3">Median Duration</th>
                    <th className="text-right p-3">Median Reduction</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const tool = toolMap.get(row.toolId);
                    return (
                      <tr key={row.toolId} className="border-t">
                        <td className="p-3">
                          <div className="font-medium">{tool?.name ?? row.toolId}</div>
                          <div className="text-xs text-muted-foreground">{tool?.route ?? "-"}</div>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border">
                            {row.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {row.lastRunAt ? new Date(row.lastRunAt).toLocaleString() : "-"}
                        </td>
                        <td className="p-3 text-right">
                          {row.failureRate24h !== null && row.failureRate24h !== undefined
                            ? `${Math.round(row.failureRate24h * 100)}%`
                            : "-"}
                        </td>
                        <td className="p-3 text-right">
                          {row.medianDurationMs ? `${row.medianDurationMs} ms` : "-"}
                        </td>
                        <td className="p-3 text-right">
                          {row.medianReductionPct !== null && row.medianReductionPct !== undefined
                            ? `${row.medianReductionPct}%`
                            : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-10">
              <h2 className="text-xl font-semibold mb-2">Top Failures (last 24h)</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Aggregated by tool + error code. Sample metadata shows the latest failure payload.
              </p>
              {failureRows.length === 0 ? (
                <div className="border rounded-lg p-4 text-sm text-muted-foreground">
                  No failed runs recorded in the last 24h.
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="text-left p-3">Tool</th>
                        <th className="text-left p-3">Error</th>
                        <th className="text-right p-3">Count</th>
                        <th className="text-left p-3">Last Seen</th>
                        <th className="text-left p-3">Sample Metadata</th>
                      </tr>
                    </thead>
                    <tbody>
                      {failureRows.map((row) => {
                        const tool = toolMap.get(row.toolId);
                        const metadataText = row.sampleMetadata
                          ? JSON.stringify(row.sampleMetadata)
                          : "-";
                        const metadataPreview =
                          metadataText.length > MAX_METADATA_LENGTH
                            ? `${metadataText.slice(0, MAX_METADATA_LENGTH)}...`
                            : metadataText;

                        return (
                          <tr key={`${row.toolId}-${row.errorCode ?? "unknown"}`} className="border-t">
                            <td className="p-3">
                              <div className="font-medium">{tool?.name ?? row.toolId}</div>
                              <div className="text-xs text-muted-foreground">{tool?.route ?? "-"}</div>
                            </td>
                            <td className="p-3">
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border">
                                {row.errorCode ?? "unknown"}
                              </span>
                            </td>
                            <td className="p-3 text-right">{row.count}</td>
                            <td className="p-3">
                              {row.lastSeen ? new Date(row.lastSeen).toLocaleString() : "-"}
                            </td>
                            <td className="p-3 text-xs text-muted-foreground whitespace-pre-wrap break-words">
                              {metadataPreview}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
