# Tool Groupings

This doc summarizes how tools are organized in the repo, how they render, and where work happens.

## Source of truth
- Tool registry: `packages/app-core/src/data/tools.json`
- Tool content (title, subtitle, FAQs, etc.) lives inside each tool entry under `content`.
- Active tools drive sitemaps via `apps/tools/lib/sitemap.ts` and metadata via `apps/tools/lib/metadata.ts`.

## Grouping by operation
Tool operations are defined in `apps/tools/types/index.d.ts`.
- convert: format to format conversions (most tools under `apps/tools/app/(convert)`).
- compress: size reduction (ex: `apps/tools/app/(compress)`).
- bulk: batch processing (ex: `apps/tools/app/(compress)/(batch)`).
- combine: merge multiple files (ex: `csv-combiner`).
- download: fetch media from public links (ex: `video-downloader`).

## Grouping by page template
Tools render with one of these patterns:
- Standard renderer (shared template)
  - Uses `ToolPageRenderer` with `ToolPageTemplate` + `HeroConverter`.
  - Most `convert` and `compress` tools use this path.
- Custom tools
  - Transcription: `audio-to-text` and transcript variants use `TranscribeTool`.
  - Downloader: `video-downloader` uses `VideoDownloaderTool`.
  - Data tools: `json-to-csv`, `csv-combiner`, `character-counter`.
  - Batch compress: `batch-compress-png` uses `BatchHeroConverter`.

## Grouping by processing location
- In-browser workers (default):
  - Conversion/compression via `apps/tools/lib/convert/workerClient.ts`.
  - Workers in `apps/tools/workers/*.js`.
- Server APIs (for limits or remote fetch):
  - `/api/video-convert` and `/api/image-convert` for server-side processing.
  - `/api/media-fetch` for public URL fetching (used by transcription and downloader).

## Grouping by input source
- Local uploads: default for most tools.
- Public URL ingestion:
  - Transcription pages accept URLs and fetch via `/api/media-fetch`.
  - Video downloader fetches URLs and streams back a file.

## Grouping by navigation and discovery
- Home page list: `apps/tools/app/page.tsx` renders tool cards from the registry.
- Global link hub: `apps/tools/components/sections/ToolsLinkHub.tsx` groups tools by format tags.
- Sitemaps: active tools are listed in `tools-index.xml` via `apps/tools/lib/sitemap.ts`.
