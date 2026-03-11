import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import {
  DOWNLOADER_CLIENT_ID_HEADER,
  DOWNLOADER_RATE_LIMIT_COOKIE,
  DOWNLOADER_RATE_LIMIT_WINDOW_MS,
} from "./downloader-contract.js";

export {
  DOWNLOADER_CLIENT_ID_HEADER,
  DOWNLOADER_RATE_LIMIT_COOKIE,
  DOWNLOADER_RATE_LIMIT_WINDOW_MS,
} from "./downloader-contract.js";

export type DownloaderRateLimitIdentity = {
  ip: string | null;
  clientId: string | null;
  userAgent: string;
  acceptLanguage: string;
};

export type DownloaderRateLimitBlockedBy = "client" | "ip" | "browser" | "cookie";

type DownloaderRateLimitBlocked = {
  allowed: false;
  blockedBy: DownloaderRateLimitBlockedBy;
  retryAfterMs: number;
};

type DownloaderRateLimitAllowed = {
  allowed: true;
  availableAt: number;
};

type DownloaderRateLimitResult =
  | DownloaderRateLimitAllowed
  | DownloaderRateLimitBlocked;

type DownloaderRateLimitCheckOptions = {
  now?: number;
  record?: boolean;
};

type DownloaderRateLimiterOptions = {
  maxEntries?: number;
  windowMs?: number;
};

type CooldownCookieCodecOptions = {
  cookieName?: string;
  secret?: string;
  windowMs?: number;
};

type CooldownCookieReadOptions = {
  now?: number;
};

type CooldownCookieWriteOptions = {
  now?: number;
  secure?: boolean;
};

type CooldownCookiePayload = {
  availableAt: number;
  subjectHash: string;
};

type IdentityStorageKey = {
  blockedBy: Exclude<DownloaderRateLimitBlockedBy, "cookie">;
  key: string;
};

const FALLBACK_DOWNLOADER_RATE_LIMIT_SECRET = randomBytes(32).toString("hex");

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

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function getBrowserFingerprint(identity: DownloaderRateLimitIdentity): string | null {
  const fingerprint = [identity.userAgent, identity.acceptLanguage]
    .map((value) => value.trim())
    .filter(Boolean)
    .join("|");
  if (!fingerprint) return null;
  return sha256(fingerprint);
}

function getCookieSubjectHash(identity: DownloaderRateLimitIdentity): string {
  return sha256(identity.clientId || getBrowserFingerprint(identity) || "anonymous");
}

function getIdentityStorageKeys(
  identity: DownloaderRateLimitIdentity,
): IdentityStorageKey[] {
  const keys: IdentityStorageKey[] = [];

  if (identity.clientId) {
    keys.push({ key: `client:${identity.clientId}`, blockedBy: "client" });
  }

  if (identity.ip) {
    keys.push({ key: `ip:${identity.ip}`, blockedBy: "ip" });
  }

  if (!identity.clientId && !identity.ip) {
    const fingerprint = getBrowserFingerprint(identity);
    if (fingerprint) {
      keys.push({ key: `browser:${fingerprint}`, blockedBy: "browser" });
    }
  }

  return keys;
}

function parseCookieHeader(header: string | null): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!header) return cookies;

  for (const part of header.split(";")) {
    const [rawName, ...valueParts] = part.split("=");
    const name = rawName?.trim();
    if (!name) continue;
    const rawValue = valueParts.join("=").trim();
    try {
      cookies.set(name, decodeURIComponent(rawValue));
    } catch {
      cookies.set(name, rawValue);
    }
  }

  return cookies;
}

function parseCooldownCookieToken(
  token: string,
  secret: string,
): CooldownCookiePayload | null {
  const [version, availableAtRaw, subjectHash, signature] = token.split(".");
  if (!version || !availableAtRaw || !subjectHash || !signature) return null;
  if (version !== "v1") return null;

  const availableAt = Number(availableAtRaw);
  if (!Number.isFinite(availableAt) || availableAt <= 0) return null;

  const payload = `${version}.${availableAtRaw}.${subjectHash}`;
  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (actualBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null;

  return { availableAt, subjectHash };
}

function serializeCooldownCookie(args: {
  cookieName: string;
  secure: boolean;
  token: string;
  windowMs: number;
}): string {
  const parts = [
    `${args.cookieName}=${encodeURIComponent(args.token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(1, Math.ceil(args.windowMs / 1000))}`,
  ];

  if (args.secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function getDownloaderRateLimitIdentity(
  headers: Headers,
): DownloaderRateLimitIdentity {
  return {
    ip:
      getForwardedIp(headers) ??
      normalizeIp(headers.get("x-real-ip")) ??
      normalizeIp(headers.get("cf-connecting-ip")),
    clientId: normalizeHeaderValue(headers.get(DOWNLOADER_CLIENT_ID_HEADER)) || null,
    userAgent: normalizeHeaderValue(headers.get("user-agent")),
    acceptLanguage: normalizeHeaderValue(headers.get("accept-language")),
  };
}

export function createDownloaderRateLimiter(
  options: DownloaderRateLimiterOptions = {},
) {
  const windowMs = options.windowMs ?? DOWNLOADER_RATE_LIMIT_WINDOW_MS;
  const maxEntries = options.maxEntries ?? 5_000;
  const entries = new Map<string, number>();
  let operations = 0;

  function pruneExpired(now: number) {
    operations += 1;
    if (entries.size === 0) return;
    if (entries.size < maxEntries && operations % 64 !== 0) return;

    for (const [key, availableAt] of entries) {
      if (availableAt <= now) {
        entries.delete(key);
      }
    }
  }

  return {
    check(
      identity: DownloaderRateLimitIdentity,
      checkOptions: DownloaderRateLimitCheckOptions = {},
    ): DownloaderRateLimitResult {
      const now = checkOptions.now ?? Date.now();
      const shouldRecord = checkOptions.record ?? true;
      const identityKeys = getIdentityStorageKeys(identity);

      pruneExpired(now);

      for (const identityKey of identityKeys) {
        const availableAt = entries.get(identityKey.key);
        if (!availableAt) continue;
        if (availableAt <= now) {
          entries.delete(identityKey.key);
          continue;
        }

        return {
          allowed: false,
          blockedBy: identityKey.blockedBy,
          retryAfterMs: availableAt - now,
        };
      }

      const availableAt = now + windowMs;
      if (shouldRecord) {
        for (const identityKey of identityKeys) {
          entries.set(identityKey.key, availableAt);
        }
      }

      return { allowed: true, availableAt };
    },
  };
}

export function createDownloaderCooldownCookieCodec(
  options: CooldownCookieCodecOptions = {},
) {
  const cookieName = options.cookieName ?? DOWNLOADER_RATE_LIMIT_COOKIE;
  const secret =
    options.secret ??
    process.env.DOWNLOADER_RATE_LIMIT_SECRET ??
    FALLBACK_DOWNLOADER_RATE_LIMIT_SECRET;
  const windowMs = options.windowMs ?? DOWNLOADER_RATE_LIMIT_WINDOW_MS;

  return {
    readBlock(
      headers: Headers,
      identity: DownloaderRateLimitIdentity,
      readOptions: CooldownCookieReadOptions = {},
    ): DownloaderRateLimitBlocked | null {
      const now = readOptions.now ?? Date.now();
      const token = parseCookieHeader(headers.get("cookie")).get(cookieName);
      if (!token) return null;

      const parsed = parseCooldownCookieToken(token, secret);
      if (!parsed) return null;
      if (parsed.subjectHash !== getCookieSubjectHash(identity)) return null;
      if (parsed.availableAt <= now) return null;

      return {
        allowed: false,
        blockedBy: "cookie",
        retryAfterMs: parsed.availableAt - now,
      };
    },

    createSetCookie(
      identity: DownloaderRateLimitIdentity,
      writeOptions: CooldownCookieWriteOptions = {},
    ) {
      const now = writeOptions.now ?? Date.now();
      const availableAt = now + windowMs;
      const payload = `v1.${availableAt}.${getCookieSubjectHash(identity)}`;
      const signature = createHmac("sha256", secret).update(payload).digest("hex");
      const token = `${payload}.${signature}`;

      return {
        availableAt,
        headerValue: serializeCooldownCookie({
          cookieName,
          secure: writeOptions.secure ?? true,
          token,
          windowMs,
        }),
      };
    },
  };
}
