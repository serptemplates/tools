# Tools Link Hub UI Notes

- `apps/tools/components/sections/ToolsLinkHub.tsx` now uses the canonical tool-operation categories from `apps/tools/lib/tool-directory.ts` (Convert, Downloaders, Compress, Combine, Bulk, Edit, PDF) instead of format-guess buckets.
- The shared preview cap is `CATEGORY_PREVIEW_LIMIT = 48` links per active tab by default.
- Large categories expose a `Show more tools` / `Show fewer tools` toggle so users can expand only when needed.
- Tab switches reset expansion state to keep page height predictable across homepage, category pages, downloader pages, and tool templates that reuse this component.
