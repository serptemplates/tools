# APNG server conversion

- APNG -> GIF failed via Magick WASM because APNG decoding uses an ffmpeg delegate (not available in the WASM build), returning a 500 from `/api/image-convert`.
- Fix: route APNG inputs through the ffmpeg path by removing `apng` from `MAGICK_ONLY_INPUTS` in `apps/tools/app/api/image-convert/route.ts`.
- Fixture: `apps/tools/benchmarks/fixtures/sample.apng` generated with `ffmpeg -f lavfi -i "testsrc=duration=1:size=96x96:rate=2" -plays 0`.
