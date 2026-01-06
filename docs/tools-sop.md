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
- JPG/JPEG are the same format. Use `jpg` as the canonical route/format and accept `.jpg,.jpeg` in the tool config. Do not create separate `*-to-jpeg` routes unless we explicitly add SEO alias routes.

## Shared code rules (do not bypass)
- Use `apps/tools/lib/convert/workerClient.ts` for all worker conversions.
- Use `getOutputMimeType()` for output blobs.
- Do not post raw messages to workers from UI components.
- Use `beginToolRun()` for telemetry on every conversion or batch job.
- If a worker fails, fall back to main-thread conversion (handled in `workerClient.ts`).
- Keep workers as plain `.js` files (no TS types), and reference them with `.js` URLs.
- Run the tools dev server with webpack (no Turbopack) so module workers load correctly.
- Drag/drop must update tool state directly; do not rely on `inputRef.files` for drop events.

## Telemetry (local)
- Events: `tool_run_started`, `tool_run_succeeded`, `tool_run_failed`.
- Required fields: `toolId`, `from`, `to`, `input_bytes`, `output_bytes`, `duration_ms`, `error_code`.
- Ingestion: POST to `/api/telemetry` (uses `DATABASE_URL`; when unset, events are accepted but not stored).
- Status: derived from last 24h runs (live/degraded/broken).

## Runtime compatibility (video + WASM)
- Always serve COOP/COEP headers for SharedArrayBuffer: `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`.
- Set `BUILD_MODE=server` and `SUPPORTS_VIDEO_CONVERSION=true` in Next config for FFmpeg support.
- Use the multi-threaded FFmpeg core from the CDN only when COOP/COEP is enabled.
- For image formats that are not reliably decodable in browsers (ex: TIFF), route conversion through the server API (`/api/image-convert`) instead of client raster decode.
- Server conversion routes must use `runtime = "nodejs"` and use `ffmpeg-static` (packaged binary) for deploy portability.

## Vendor assets (public)
- PDF worker must be available at `/vendor/pdfjs/pdf.worker.min.js`.
- HEIF bundle + wasm must be available at `/vendor/libheif/libheif-bundle.js` and `/vendor/libheif/libheif.wasm`.
- FFmpeg cores must be available at `/vendor/ffmpeg/ffmpeg-core.js`, `/vendor/ffmpeg/ffmpeg-core.wasm`, and `/vendor/ffmpeg/ffmpeg-core.worker.js`.
- Single-thread FFmpeg cores must be available at `/vendor/ffmpeg-st/ffmpeg-core.js` and `/vendor/ffmpeg-st/ffmpeg-core.wasm`.
- Keep these file paths stable across releases.

## Sitemaps & indexing
- `/sitemap-index.xml` must include `pages-index.xml` and `tools-index.xml` (and `categories-index.xml` only if category routes exist).
- `pages-index.xml` includes only static pages (`/`, legal, contact, etc.). Do not mix tool routes here.
- `tools-index.xml` is generated from the tool registry (active tools only).
- If category pages exist, add a `categories-index.xml` + paginated sitemap and keep rewrites up to date.
- Keep `/sitemap-:page.xml` as a compatibility alias for the combined list.

## Output semantics
- `*-to-pdf` uses rasterized PDF output via `pdf-lib`.
- `jpg-to-svg` is raster-in-SVG (not true vectorization); document this on tool pages.
- Compression tools should never increase file size. If a compression output is larger, keep the original bytes and report the run as no-gain.

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
   - Dropzone must be clickable, support drag/drop, and show progress + completion states.
3. Conversion:
   - Use worker client (`convertWithWorker`) and `beginToolRun`.
   - If the tool depends on PDF/HEIF, ensure vendor assets exist in `/public/vendor`.
   - Add server conversion fallback for formats that browsers cannot decode reliably.
4. Validation:
   - Run typecheck (`pnpm -C apps/tools typecheck`).
   - Manual sanity check on one representative file.
   - Verify: dropzone upload, progress update, successful operation, download works, output matches intent.
   - Run benchmark smoke tests (`node scripts/benchmark-tools.mjs`).
   - If you add dependencies for a tool, run `pnpm install` and commit `pnpm-lock.yaml` (CI uses frozen lockfile).

## QA checklist (per tool)
- Dropzone accepts drag/drop and click-to-upload.
- Progress indicator appears and updates until completion.
- Conversion/compression succeeds with a representative fixture.
- Download triggers and returns a file (blob event).
- Output matches intent: correct format and size reduction for compressors.

## Benchmarking
- Script: `node scripts/benchmark-tools.mjs` (requires dev server; override with `TOOLS_BASE_URL`).
- Uses fixtures in `apps/tools/benchmarks/fixtures/` and runs:
  - Page-load smoke test for every active tool.
  - Functional tests via drag/drop to validate dropzones, progress completion, and downloads.
  - Output size/type checks (warns if compression grows output or output type is unexpected).
- Results saved to `scripts/benchmark-results.json`.
- Fixture coverage is tracked in `apps/tools/benchmarks/fixture-matrix.json` (see `docs/fixture-matrix.md`).
- Wait a beat after initial load before automation interacts with file inputs (worker init timing).

## Lint gate
- `pnpm lint:tools` runs `scripts/validate-tools.mjs` in CI.
- Gate enforces required `data-testid` hooks for dropzones, progress, and download buttons so QA automation can validate flows.
- Gate enforces sitemap structure (pages vs tools, rewrites) and FFmpeg asset availability.

## Migration helpers
- Seed DB: `node scripts/seed-tools.mjs`
- Export DB: `node scripts/export-tools.mjs`
