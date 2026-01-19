# AdSense behavior notes

- Ad rendering is centralized in `apps/tools/components/ToolAds.tsx` and used by `apps/tools/components/ToolHeroLayout.tsx`.
- Ads are intentionally hidden until first user interaction; `adsVisible` flips in each hero component when a file is selected or dropped.
- On viewports below `xl`, the left/right rail ads are hidden; only the inline ad appears below the hero.
- The AdSense script is injected by `packages/app-core/src/components/app-layout.tsx` in production, and in dev only when `NEXT_PUBLIC_ADSENSE_TEST_MODE=true`.
- When testing with Playwright, wait for hydration (`waitUntil: 'networkidle'` + short delay) before setting input files, otherwise `onChange` handlers may not fire.
