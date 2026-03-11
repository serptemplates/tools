# Shared Site Footer

- The site footer lives in `packages/app-core/src/components/site-footer.tsx`.
- It is mounted once in `packages/app-core/src/components/app-layout.tsx`, so homepage, downloader pages, and other tool pages all inherit it automatically.
- Keep `ToolsLinkHub` as the large tool-directory section inside page templates, but treat it as page content, not the actual footer.
- If a new tools page is added under the shared app layout, do not add a second custom footer unless there is an intentional product-specific reason.
- Global internal discovery links like `/categories/` should be added in the shared footer once so they appear across the homepage and tool pages automatically.
