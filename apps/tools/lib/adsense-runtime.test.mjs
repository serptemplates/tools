import test from "node:test";
import assert from "node:assert/strict";

import { isAdSenseSlotEnabled } from "./adsense-runtime.ts";

test("isAdSenseSlotEnabled is disabled in development when test mode is off", () => {
  assert.equal(
    isAdSenseSlotEnabled({
      adsenseClient: "ca-pub-123",
      resolvedSlot: "3136872527",
      adsenseTestMode: false,
      nodeEnv: "development",
    }),
    false,
  );
});

test("isAdSenseSlotEnabled is enabled in production when client and slot are present", () => {
  assert.equal(
    isAdSenseSlotEnabled({
      adsenseClient: "ca-pub-123",
      resolvedSlot: "3136872527",
      nodeEnv: "production",
    }),
    true,
  );
});

test("isAdSenseSlotEnabled is enabled in development when test mode is on", () => {
  assert.equal(
    isAdSenseSlotEnabled({
      adsenseClient: "ca-pub-123",
      resolvedSlot: "3136872527",
      adsenseTestMode: true,
      nodeEnv: "development",
    }),
    true,
  );
});
