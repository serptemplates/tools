# Downloader page requirements

- All tools with `operation: "download"` should include a top CTA section in the page chrome, using a pattern like a shared `TopBarCTA` component.
- Downloader page slugs should default to `download-*` syntax. Example: `download-loom-videos`.
- CTA support text: `Get the browser extension for unlimited downloads.`
- CTA label: `Get It Now`.
- CTA destination: `https://serp.ly/serp-video-tools`.
- Shared implementation: `apps/tools/components/DownloaderExtensionCTA.tsx`, rendered through `apps/tools/components/DownloaderPageTemplate.tsx`.
- Keep the shared downloader CTA to one short support line plus the button. Do not reintroduce separate title/subtitle copy blocks in this section.
- The shared downloader CTA should use a responsive left-copy/right-button layout on desktop and stack cleanly on mobile.
- Use a CTA-specific color treatment for the button instead of the default monochrome button style.
- Downloader pages should also include a shared ad banner section in the page template so dedicated downloader routes keep the same monetization block.
- The shared downloader ad banner should respect the existing site ad gate and stay hidden until the user initiates the downloader action.
- Downloader pages should use the shared downloader template and request path so the 60-second shared downloader cooldown applies automatically.
- Registry-backed `download-*` landers can resolve through the shared root tool route as long as they render `DownloaderPageTemplate` via the shared downloader renderer. Do not create one-off page files unless a downloader needs custom copy or behavior.
- When adding batches of downloader landers, update both `packages/app-core/src/data/tools.json` and `docs/planner/tools_planner.csv` so the route and planner stay aligned.
- The current shared cooldown tracks downloader requests by IP, persistent browser ID, and an HTTP-only cooldown cookie.
- This CTA is a standard requirement for downloader pages, not a one-off for Loom.
- Dedicated downloader routes should inherit this CTA by using the shared downloader page template.

## Reference implementation

Use the official cobalt project as a product and implementation reference when planning downloader features, supported services, request flow, or downloader UX.

- Official repo: `https://github.com/imputnet/cobalt`
- API source tree: `https://github.com/imputnet/cobalt/tree/main/api`
- API documentation: `https://github.com/imputnet/cobalt/blob/main/docs/api.md`
- Self-hosting and runtime notes: `https://github.com/imputnet/cobalt/blob/main/docs/run-an-instance.md`

Treat cobalt as a reference for patterns, behavior, and supported-service research. Do not directly copy code without making an explicit licensing decision first, because the project is licensed under AGPL-3.0.
