# Download Loom videos notes

- The current downloader stack already supports public Loom links through `apps/tools/app/api/media-fetch/route.ts`.
- The route first tries a direct fetch and then falls back to `yt-dlp` via `youtube-dl-exec` for provider-specific downloads.
- Public Loom embed links such as `/embed/...` work with the existing backend; a dedicated Loom page is mainly a content and landing-page addition.
- Client-side blob assembly should not assume `globalThis.SharedArrayBuffer` exists. Normalize any non-`ArrayBuffer` chunk into a plain `ArrayBuffer` before building the final `Blob`.
- `cobalt` is a useful product/reference source for supported-service behavior, but its repo is AGPL-3.0, so direct code reuse needs a deliberate licensing decision.
- For future downloader work, use the downloader reference links in `docs/knowledge/downloader-page-requirements.md` as the canonical cobalt repo/docs entry point.
