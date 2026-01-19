# FFmpeg tool benchmark (2026-01-20)

Ran `scripts/benchmark-tools.mjs` against 492 FFmpeg conversion tools on the local dev server.

Summary:
- pass: 390
- fail: 102
- warn: 0
- missing fixtures: 0

Failures by source format:
- rm (24)
- rmvb (24)
- av1 (17)
- hevc (17)
- mjpeg (17)
- amr (3)

All failures timed out waiting for conversion completion:
- `page.waitForFunction: Timeout 60000ms exceeded.`

Full results saved to `scripts/benchmark-results.json`.
