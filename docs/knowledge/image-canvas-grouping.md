# Image canvas tool grouping

This repo has multiple image conversion paths. For planning, the image/canvas tools can be split by the conversion engine and required vendor assets:

- canvas-only: browser decode + canvas encode (no vendor assets)
- jpeg-alias: treat jfif/jif/jpe as jpeg; use canvas encode
- server-image-convert: uses `/api/image-convert` with ImageMagick WASM and ffmpeg-static
- needs-new-engine: not supported by current canvas or image-convert paths

The planner working copy at `docs/planner/tools_planner.csv` stores `vendor_group` and `vendor_libs` for image/canvas tools.
