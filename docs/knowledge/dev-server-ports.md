# Dev server ports

- Next.js CLI rejects port 0 (parseValidPositiveInteger), so `--port 0` is not a viable auto-port strategy.
- `apps/tools/scripts/dev.mjs` now scans ports (via `node:net`) to select the first available port starting at `PORT` or 3000.
