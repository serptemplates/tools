# Upgrade Tools SOP Plan

## Context and current state
- Tool metadata and landing content live in `packages/app-core/src/data/tools.json`.
- Most tool pages are one-off files under `apps/tools/app/**/page.tsx` that repeat the same pattern.
- Conversion UI logic is duplicated across `apps/tools/components/HeroConverter.tsx`, `apps/tools/components/LanderHeroTwoColumn.tsx`, and `apps/tools/components/Converter.tsx`.
- Worker message shapes are inconsistent: `apps/tools/components/Converter.tsx` posts a message that `apps/tools/workers/convert.worker.ts` does not handle, so that flow is likely broken.
- Tool discovery UI uses a manual `iconMap` in `apps/tools/app/page.tsx`, which requires extra edits for each new tool.

## Goals
- Standardize how new tools are created and edited.
- Reduce breakage from shared code or overlapping behavior.
- Add internal telemetry for tool status and performance metrics.
- Make it safe to ship many tools quickly with predictable quality.

## Decisions (locked for this plan)
- Telemetry stays local for now, stored in Postgres via Drizzle.
- Next.js API routes are allowed and expected (project already runs in server mode).
- Tool registry moves from JSON-only to a typed TS + DB model using Drizzle.
- Custom UI tools remain custom (current non-template tools): `character-counter`, `json-to-csv`, `batch-compress-png`, `ai-to-png`.
- Internal dashboard should live inside the tools app under a protected route (recommended).

## Proposed SOP (standardized tool lifecycle)
1. Single source of truth tool registry
   - Migrate from `tools.json` to a typed DB-backed registry (Drizzle schema in TS).
   - Keep `tools.json` as a seed or export artifact for migration and audits.
   - Registry fields include:
     - `id`, `route`, `operation`, `from`, `to`, `requiresFFmpeg`
     - `handler` (conversion, batch, text, combine, etc)
     - `uiVariant` (single column, two column, custom)
     - `contentRef` or inline content
   - All pages, navigation, and content should read from the registry.

2. Dynamic routing and template renderer
   - Replace most `apps/tools/app/**/page.tsx` files with one dynamic route and a renderer.
   - Use `generateStaticParams` from the registry for routing.
   - Support special tools (character counter, json to csv, etc) via `handler` instead of custom pages.

3. Unified conversion pipeline
   - Centralize worker messaging and conversion logic in one shared helper, such as `runConversion()`.
   - Both `HeroConverter` and `LanderHeroTwoColumn` should call the same conversion API.
   - Define and enforce a single worker message contract in `apps/tools/workers/convert.worker.ts`.

4. Format registry and capabilities
   - Centralize accept strings, MIME types, static compatibility, and ffmpeg requirements.
   - Replace repeated logic in UI components with shared lookups.

5. Tool scaffolding workflow
   - Add a generator script that:
     - inserts a registry entry
     - creates content stubs
     - wires icon selection
   - The script should fail fast when formats or handlers are unsupported.

6. Validation gate
   - Add `tools:validate` to enforce:
     - unique `id` and `route`
     - required fields for each handler
     - supported formats and capabilities
     - content present when required
   - Run in CI to prevent tool breakage on new additions.

## Registry schema (Drizzle, draft)
- `tools` table
  - Core fields: `id`, `name`, `description`, `operation`, `route`, `from`, `to`
  - Metadata: `isActive`, `tags`, `priority`, `isBeta`, `isNew`, `requiresFFmpeg`
  - UI: `handler`, `uiVariant`
- `tool_content` table (JSONB or structured tables)
  - `tool_id`, `content` (tool, faqs, about, changelog, related, blog)
- Seed/migration
  - Import `packages/app-core/src/data/tools.json` into the DB.
  - Keep a one-way export option for backup and inspection.

## Telemetry and tool status
1. Event model (client-side)
   - `tool_run_started`, `tool_run_succeeded`, `tool_run_failed`
   - Fields: `tool_id`, `from`, `to`, `input_bytes`, `output_bytes`, `duration_ms`, `error_code`, `build_mode`
   - For compression tools, include original size and compressed size.

2. Ingestion
   - Use `navigator.sendBeacon` to an API route, for example `apps/tools/app/api/telemetry/route.ts`.
   - Store locally in Postgres using Drizzle with basic aggregation and retention.

3. Storage schema (Drizzle, draft)
   - `tool_runs`: `id`, `tool_id`, `status`, `started_at`, `duration_ms`, `input_bytes`, `output_bytes`, `error_code`, `metadata`
   - `tool_status`: `tool_id`, `status`, `last_run_at`, `failure_rate_24h`, `median_duration_ms`, `median_reduction_pct`

4. Status classification
   - Live: recent synthetic test passed and failure rate below threshold.
   - Degraded: synthetic pass but elevated runtime failures.
   - Broken: synthetic failure or sustained runtime failures.

5. Internal dashboard (recommended)
   - Show last run, error rate, median duration, and size reduction.
   - Filter by tool, operation, and format.
   - Host under a protected route in the tools app (example: `/internal/tools`).

## Immediate risk to address
- Fix or remove the mismatch between `apps/tools/components/Converter.tsx` and `apps/tools/workers/convert.worker.ts` to avoid silent tool failures.

## Implementation phases
1. Phase 0: Fix worker contract mismatch and centralize conversion API.
2. Phase 1: Build registry schema and dynamic route rendering.
3. Phase 2: Add format registry and validation gate.
4. Phase 3: Add telemetry endpoint and internal dashboard.
5. Phase 4: Add tool scaffolding script and CI enforcement.

## Open questions
- Retention policy and rollup frequency for telemetry.
- Privacy and data handling for client-side conversions.


## TableConvert landing TODOs (unsupported formats)

Pending pages from `tableconvert.com-top-pages-subdomains-us--actu_2026-01-15_12-44-43 - Sheet1.csv` because input/output is not wired in the table converter yet:
- csv-to-ascii
- csv-to-avro
- csv-to-excel
- csv-to-jpeg
- csv-to-jsonlines
- csv-to-magic
- csv-to-mediawiki
- csv-to-pandasdataframe
- csv-to-pdf
- csv-to-php
- csv-to-png
- excel-to-ascii
- excel-to-bbcode
- excel-to-csv
- excel-to-excel
- excel-to-html
- excel-to-jira
- excel-to-json
- excel-to-jsonlines
- excel-to-latex
- excel-to-markdown
- excel-to-pandasdataframe
- excel-to-php
- excel-to-png
- excel-to-sql
- excel-to-xml
- excel-to-yaml
- html-to-bbcode
- html-to-excel
- html-to-jpeg
- html-to-png
- json-to-avro
- json-to-excel
- json-to-jpeg
- json-to-magic
- json-to-pandasdataframe
- json-to-pdf
- json-to-php
- json-to-png
- json-to-protobuf
- latex-to-csv
- latex-to-excel
- latex-to-html
- latex-to-jpeg
- latex-to-latex
- latex-to-markdown
- latex-to-pdf
- latex-to-png
- markdown-to-excel
- markdown-to-jira
- markdown-to-jpeg
- markdown-to-magic
- markdown-to-pandasdataframe
- markdown-to-pdf
- markdown-to-png
- markdown-to-restructuredtext
- mediawiki-to-csv
- mysql-to-csv
- mysql-to-excel
- mysql-to-json
- mysql-to-sql
- sql-to-csv
- sql-to-excel
- sql-to-html
- sql-to-json
- sql-to-pdf
- sql-to-sql
- sql-to-xml
- xml-to-excel
- xml-to-jpeg
- xml-to-pdf
- xml-to-png
- xml-to-restructuredtext
