import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

const moduleUrl = new URL("./server-action-rate-limit.ts", import.meta.url);
const rateLimitModule = existsSync(moduleUrl)
  ? await import(moduleUrl)
  : null;

test("server action rate limiter blocks repeated requests for 60 seconds, even after an IP change", () => {
  assert.ok(rateLimitModule, "expected shared server action rate limit module to exist");

  const limiter = rateLimitModule.createServerActionRateLimiter({
    windowMs: 60_000,
  });

  const first = limiter.check(
    {
      ip: "198.51.100.10",
      clientId: "client-abc",
      userAgent: "Mozilla/5.0",
      acceptLanguage: "en-US,en;q=0.9",
    },
    { now: 1_000 },
  );
  assert.equal(first.allowed, true);

  const second = limiter.check(
    {
      ip: "203.0.113.22",
      clientId: "client-abc",
      userAgent: "Mozilla/5.0",
      acceptLanguage: "en-US,en;q=0.9",
    },
    { now: 5_000 },
  );
  assert.equal(second.allowed, false);
  assert.equal(second.blockedBy, "client");
  assert.equal(second.retryAfterMs, 56_000);

  const third = limiter.check(
    {
      ip: "203.0.113.22",
      clientId: "client-abc",
      userAgent: "Mozilla/5.0",
      acceptLanguage: "en-US,en;q=0.9",
    },
    { now: 61_001 },
  );
  assert.equal(third.allowed, true);
});

test("server action rate limit identity reads forwarded IP and shared client header", () => {
  assert.ok(rateLimitModule, "expected shared server action rate limit module to exist");

  const identity = rateLimitModule.getServerActionRateLimitIdentity(
    new Headers({
      "x-forwarded-for": "198.51.100.44, 10.0.0.1",
      "x-serp-server-action-client-id": "client-xyz",
      "user-agent": "Mozilla/5.0",
      "accept-language": "en-US,en;q=0.8",
    }),
  );

  assert.equal(identity.ip, "198.51.100.44");
  assert.equal(identity.clientId, "client-xyz");
  assert.equal(identity.userAgent, "Mozilla/5.0");
  assert.equal(identity.acceptLanguage, "en-US,en;q=0.8");
});

test("server action cooldown cookie blocks a repeat request from the same browser identity", () => {
  assert.ok(rateLimitModule, "expected shared server action rate limit module to exist");

  const cookieCodec = rateLimitModule.createServerActionCooldownCookieCodec({
    secret: "test-server-action-secret",
    windowMs: 60_000,
  });
  const identity = {
    ip: "198.51.100.10",
    clientId: "client-abc",
    userAgent: "Mozilla/5.0",
    acceptLanguage: "en-US,en;q=0.9",
  };

  const setCookie = cookieCodec.createSetCookie(identity, {
    now: 1_000,
    secure: false,
  });
  const cookieHeader = setCookie.headerValue.split(";")[0];
  const block = cookieCodec.readBlock(
    new Headers({ cookie: cookieHeader }),
    identity,
    { now: 5_000 },
  );

  assert.equal(block?.allowed, false);
  assert.equal(block?.blockedBy, "cookie");
  assert.equal(block?.retryAfterMs, 56_000);
});
