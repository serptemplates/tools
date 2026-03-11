# Compression pipeline

## Browser image compression
- PNG: `@jsquash/oxipng` in `apps/tools/workers/compress.worker.js`.
- JPEG/WebP: jsquash codecs in the same worker (`@jsquash/jpeg`, `@jsquash/webp`).
- Worker returns the original bytes when the compressed output is larger to honor the no-grow rule.

## Server image compression
- Endpoint: `apps/tools/app/api/image-compress/route.ts` (invoked via `/api/image-compress?format=...`).
- GIF: `imagemin` + `imagemin-gifsicle`.
- SVG: `svgo` (multipass optimize).
- HEIC/HEIF/AVIF/TIFF/BMP: `sharp` with quality tuned to match the default compressor settings.
- Uses the shared server-action 60s cooldown and returns the original bytes on the client when compression grows the file.

## Media compression (audio/video)
- Client-side FFmpeg via `@ffmpeg/ffmpeg` in `apps/tools/lib/convert/video.ts` (`compressMedia`).
- Uses CRF for video and bitrate targeting for audio, then falls back to the original if output grows.

## PDF compression
- Server-side via `ghostscript-node` in `apps/tools/app/api/pdf-compress/route.ts`.
- Requires Ghostscript + qpdf binaries in the runtime.
