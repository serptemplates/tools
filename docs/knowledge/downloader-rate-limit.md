# Downloader rate limit

Downloader pages share a single 60-second cooldown. The current implementation lives in the shared downloader path, not in each page separately.

## What is enforced

- All downloader UI requests send `consumer: "downloader"` to `/api/media-fetch`.
- The downloader client also sends a persistent browser ID in `x-serp-downloader-client-id`.
- The API rate-limits downloader requests for 60 seconds using the request IP plus that persistent browser ID.
- Successful downloader responses also set an HTTP-only cooldown cookie so the same browser still gets blocked after a simple IP or VPN change.

## Why it is wired this way

- The shared API gate means new downloader pages inherit the cooldown automatically when they use the shared downloader template and component path.
- IP-only limiting is too easy to bypass with a VPN.
- Browser-ID plus cooldown cookie is a practical extra layer without adding a new external rate-limit service yet.

## Current limits

- This is not a perfect anti-abuse system yet.
- For strong cross-instance enforcement, production should set `DOWNLOADER_RATE_LIMIT_SECRET` so the cooldown cookie stays valid across deployments and instances.
- If that secret is missing, the app falls back to an instance-local signing secret. The limiter still works, but cross-instance cooldown enforcement is weaker.
- Users who change browser context entirely can still reduce how much identity carries over. A shared backing store such as Redis or KV would be the next upgrade if abuse becomes a real problem.

## Test coverage

- `apps/tools/lib/downloader-rate-limit.test.mjs` covers the shared limiter logic and cooldown cookie behavior.
- `apps/tools/lib/downloader-rate-limit-coverage.test.mjs` verifies every active `download` tool page uses the shared downloader template and shared downloader request path.
