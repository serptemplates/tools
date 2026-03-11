# Server action rate limit

Server-required tools (image conversion, image compression, video conversion, PDF compression) share a 60-second cooldown enforced by the server-side API routes.

- The shared limiter lives in `apps/tools/lib/server-action-rate-limit.ts` and is applied in `/api/image-convert`, `/api/image-compress`, `/api/video-convert`, and `/api/pdf-compress`.
- Requests are tracked by IP, a persistent browser ID (`x-serp-server-action-client-id`), plus user-agent + accept-language fingerprinting.
- Successful responses set an HTTP-only cooldown cookie (`serp_server_action_cooldown`) so the same browser stays blocked even after an IP/VPN change.
- Client-side requests should use `createServerActionRequestHeaders` to include the client ID header.
- Set `SERVER_ACTION_RATE_LIMIT_SECRET` in production for cross-instance cookie verification (fallbacks to `DOWNLOADER_RATE_LIMIT_SECRET` or instance-local secrets).

Tests:
- `apps/tools/lib/server-action-rate-limit.test.mjs`
- `apps/tools/lib/server-action-client.test.mjs`
