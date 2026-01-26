# Benchmarking transcribe tools

- Issue: `audio-to-text` and `audio-to-transcript` timed out in `scripts/benchmark-tools.mjs` because they do not render the shared video progress element.
- Fix: update the benchmark to drop an MP3 fixture and wait for a transcript textarea with non-empty content (allow long timeout for model download, set to 10 minutes).
