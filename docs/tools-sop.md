# Tools SOP

## Purpose
Standardize how we create, update, and ship tools so they scale, share code safely, and remain stable.

## Source of truth
- Primary source: database registry (Postgres + Drizzle).
- JSON (`packages/app-core/src/data/tools.json`) is the seed/export artifact.
- Until full migration, keep DB and JSON in sync.

## Data model (registry)
Required fields for each tool:
- `id`, `name`, `description`, `operation`, `route`
- `from`, `to` (if format-based)
- `handler` (convert, batch, combine, text, custom)
- `uiVariant` (single, two-column, custom)
- `requiresFFmpeg`, `isActive`, `priority`, `tags`

Content is stored in the `tool_content` table (JSONB).
Internal related tools must reference `toolId` (not `href`); resolve routes from the registry. External links must use full `http(s)` URLs.

## Tool types
- Standard convert tools use shared UI (`HeroConverter` or `LanderHeroTwoColumn`) and shared worker API.
- Custom UI tools remain custom: `character-counter`, `json-to-csv`, `batch-compress-png`, `ai-to-png`, `csv-combiner`.
- New custom tools require an explicit `handler=custom` and a listed custom page.

## Shared code rules (do not bypass)
- Use `apps/tools/lib/convert/workerClient.ts` for all worker conversions.
- Use `getOutputMimeType()` for output blobs.
- Do not post raw messages to workers from UI components.
- Use `beginToolRun()` for telemetry on every conversion or batch job.

## Telemetry (local)
- Events: `tool_run_started`, `tool_run_succeeded`, `tool_run_failed`.
- Required fields: `toolId`, `from`, `to`, `input_bytes`, `output_bytes`, `duration_ms`, `error_code`.
- Ingestion: POST to `/api/telemetry` (uses `DATABASE_URL`; when unset, events are accepted but not stored).
- Status: derived from last 24h runs (live/degraded/broken).

## Internal dashboard
- Route: `/internal/tools` (guard with `INTERNAL_DASHBOARD_TOKEN`).
- Shows status, failure rate, median duration, median reduction.

## Adding a new tool (checklist)
1. Registry:
   - Insert/update `tools` row (DB) or `tools.json` for seed.
   - Add `tool_content` JSON for landing page sections.
2. UI:
   - Use shared template (`ToolPageTemplate`) unless custom.
   - Custom tools must be listed in the custom tool list.
3. Conversion:
   - Use worker client (`convertWithWorker`) and `beginToolRun`.
4. Validation:
   - Run typecheck (`pnpm -C apps/tools typecheck`).
   - Manual sanity check on one representative file.
   - Run benchmark smoke tests (`node scripts/benchmark-tools.mjs`).

## Benchmarking
- Script: `node scripts/benchmark-tools.mjs` (requires dev server; override with `TOOLS_BASE_URL`).
- Uses fixtures in `apps/tools/benchmarks/` and runs:
  - Page-load smoke test for every active tool.
  - Functional tests for custom tools and PNG compression.
- Results saved to `scripts/benchmark-results.json`.

## Migration helpers
- Seed DB: `node scripts/seed-tools.mjs`
- Export DB: `node scripts/export-tools.mjs`
