# Downloader ads notes

- Downloader pages use the shared rail ad layout from `apps/tools/components/ToolAds.tsx`.
- Downloader pages should keep every ad placement hidden until the user initiates the download action. That includes both the hero rail ads and the shared downloader banner section.
- In development, ad slots should fall back to visible placeholders unless AdSense test mode is explicitly enabled. Otherwise the page renders blank `adsbygoogle` containers and looks broken during local testing after ads are revealed.
- Side rails still follow the shared `xl` breakpoint behavior from `ToolAds.tsx`.
- The downloader hero path should avoid rendering a duplicate inline ad below the hero when the page already has a dedicated ad banner section in the shared downloader template.
