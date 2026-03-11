import type { DownloaderRateLimitBlockedBy, DownloaderRateLimitIdentity } from "./downloader-rate-limit.ts";
import {
  createDownloaderCooldownCookieCodec,
  createDownloaderRateLimiter,
} from "./downloader-rate-limit.ts";
import {
  SERVER_ACTION_CLIENT_ID_HEADER,
  SERVER_ACTION_RATE_LIMIT_COOKIE,
  SERVER_ACTION_RATE_LIMIT_WINDOW_MS,
} from "./server-action-contract.js";

export {
  SERVER_ACTION_CLIENT_ID_HEADER,
  SERVER_ACTION_RATE_LIMIT_COOKIE,
  SERVER_ACTION_RATE_LIMIT_WINDOW_MS,
} from "./server-action-contract.js";

export type ServerActionRateLimitIdentity = DownloaderRateLimitIdentity;

type ServerActionRateLimiterOptions = {
  maxEntries?: number;
  windowMs?: number;
};

type CooldownCookieCodecOptions = {
  cookieName?: string;
  secret?: string;
  windowMs?: number;
};

type RateLimitBlock = {
  blockedBy: DownloaderRateLimitBlockedBy;
  retryAfterMs: number;
};

function normalizeHeaderValue(value: string | null): string {
  return value?.trim() ?? "";
}

function normalizeIp(value: string | null): string | null {
  const normalized = normalizeHeaderValue(value);
  return normalized || null;
}

function getForwardedIp(headers: Headers): string | null {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return normalizeIp(forwardedFor.split(",")[0] ?? null);
  }
  return null;
}

function getRateLimitMessage(retryAfterMs: number): string {
  const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  return `You can only run one server action every 60 seconds. Try again in ${retryAfterSeconds}s.`;
}

export function getServerActionRateLimitIdentity(
  headers: Headers,
): ServerActionRateLimitIdentity {
  return {
    ip:
      getForwardedIp(headers) ??
      normalizeIp(headers.get("x-real-ip")) ??
      normalizeIp(headers.get("cf-connecting-ip")),
    clientId: normalizeHeaderValue(headers.get(SERVER_ACTION_CLIENT_ID_HEADER)) || null,
    userAgent: normalizeHeaderValue(headers.get("user-agent")),
    acceptLanguage: normalizeHeaderValue(headers.get("accept-language")),
  };
}

export function createServerActionRateLimiter(
  options: ServerActionRateLimiterOptions = {},
) {
  return createDownloaderRateLimiter({
    maxEntries: options.maxEntries,
    windowMs: options.windowMs ?? SERVER_ACTION_RATE_LIMIT_WINDOW_MS,
  });
}

export function createServerActionCooldownCookieCodec(
  options: CooldownCookieCodecOptions = {},
) {
  const secret =
    options.secret ??
    process.env.SERVER_ACTION_RATE_LIMIT_SECRET ??
    process.env.DOWNLOADER_RATE_LIMIT_SECRET;

  return createDownloaderCooldownCookieCodec({
    cookieName: options.cookieName ?? SERVER_ACTION_RATE_LIMIT_COOKIE,
    secret,
    windowMs: options.windowMs ?? SERVER_ACTION_RATE_LIMIT_WINDOW_MS,
  });
}

export function buildServerActionRateLimitResponse(
  block: RateLimitBlock,
): Response {
  const retryAfterSeconds = Math.max(1, Math.ceil(block.retryAfterMs / 1000));
  return Response.json(
    {
      blockedBy: block.blockedBy,
      error: getRateLimitMessage(block.retryAfterMs),
      retryAfterMs: block.retryAfterMs,
    },
    {
      status: 429,
      headers: {
        "cache-control": "no-store",
        "retry-after": String(retryAfterSeconds),
      },
    },
  );
}

export function isSecureRequest(request: Request): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() === "https";
  }

  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}
