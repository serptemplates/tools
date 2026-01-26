# AMR audio conversions

- Issue: client-side FFmpeg.wasm conversions from AMR to MP2/OGG/OGA timed out in the tools benchmark (no completion signal).
- Fix: route AMR -> MP2/OGG/OGA through server conversion by adding a server-prefer rule in `apps/tools/lib/convert/video.ts`.
- Fix detail: resample AMR input to 44.1kHz stereo for MP2/OGG/OGA in both client (`apps/tools/lib/convert/video.ts`) and server (`apps/tools/app/api/video-convert/route.ts`) FFmpeg args to avoid encoder setup failures.
- Verification: rerun the affected tools with `scripts/benchmark-tools.mjs` against the dev server.
