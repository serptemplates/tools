import toolsData from "@serp-tools/app-core/data/tools.json";
import { getDb } from "@serp-tools/app-core/db";
import { toolStatus } from "@serp-tools/app-core/db/schema";
import { desc } from "drizzle-orm";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

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
  let errorMessage: string | null = null;

  try {
    const db = getDb();
    if (!db) {
      throw new Error("Telemetry database not configured (DATABASE_URL not set).");
    }
    rows = await db.select().from(toolStatus).orderBy(desc(toolStatus.updatedAt));
  } catch (err: any) {
    errorMessage = err?.message || "Failed to load tool status.";
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
        )}
      </div>
    </main>
  );
}
