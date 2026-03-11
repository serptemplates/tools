# Tool Operation Taxonomy

- Current canonical operation set is `bulk`, `combine`, `compress`, `convert`, `download`, `edit`, and `view`.
- Canonical registry operation for downloader-style tools is `download`, not `downloader`.
- Shared runtime labels should present `download` tools as `Downloaders` where we show action categories to users.
- Operation category landers should use `/category/{operation}/` with the canonical operation key, for example `/category/download/`.
- Downloader-specific routes/slugs should default to `download-*` naming.
- Shared fallback metadata copy should branch on `operation` so new downloader tools do not inherit conversion-only wording.
- Downloader pages should include a top CTA for `Get It Now` pointing to `https://serp.ly/serp-video-tools`, via the shared downloader page template CTA component.
- App type source of truth: `apps/tools/types/index.d.ts`.
- Current helper: `apps/tools/lib/tool-operations.ts`.
