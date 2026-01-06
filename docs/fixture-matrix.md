# Format Fixture Matrix

## Purpose
Provide a single, explicit map of which formats have test fixtures so benchmark and QA runs are consistent and scalable.

## Location
- Matrix file: `apps/tools/benchmarks/fixture-matrix.json`
- Fixture files: `apps/tools/benchmarks/fixtures/*`
- Benchmark runner: `scripts/benchmark-tools.mjs`

## Structure
The matrix is keyed by input format. Each entry lists:
- `format`: input format name (matches `tools.json` `from` values)
- `status`: `ready` or `missing`
- `input`: `file` or `text`
- `fixture`: filename in `apps/tools/benchmarks/` (or `null` when missing)
- `alternates` (optional): additional fixtures for batch tools
- `notes` (optional): special handling or aliasing

Tool-specific fixtures (non-format tools) live under `toolFixtures` in the same file.

## JPG/JPEG policy
JPG and JPEG are the same format. We treat `jpg` as canonical and use a single fixture for both. Do not create separate fixtures or routes unless we intentionally add SEO alias routes.

## Updating the matrix
1. Add a new fixture file to `apps/tools/benchmarks/fixtures/`.
2. Update the matching format entry in `apps/tools/benchmarks/fixture-matrix.json` with:
   - `status: "ready"`
   - `fixture: "your-file.ext"`
3. If the tool is custom (text-based), update `toolFixtures` instead.

## Raw formats
Camera RAW formats (`arw`, `cr2`, `cr3`, `dng`) are covered with CC0 samples from raw.pixls.us and marked `ready` in the matrix.

## Benchmark usage
The benchmark runner reads the matrix and records fixture coverage in the results. Missing fixtures are reported in the benchmark summary so we can track coverage gaps.
