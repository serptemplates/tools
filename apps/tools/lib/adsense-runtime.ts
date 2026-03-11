type AdSenseSlotRuntimeArgs = {
  adsenseClient?: string;
  resolvedSlot?: string;
  adsenseTestMode?: boolean;
  nodeEnv?: string;
};

export function isAdSenseSlotEnabled({
  adsenseClient,
  resolvedSlot,
  adsenseTestMode = false,
  nodeEnv = process.env.NODE_ENV,
}: AdSenseSlotRuntimeArgs) {
  if (!adsenseClient || !resolvedSlot) {
    return false;
  }

  if (nodeEnv === "development" && !adsenseTestMode) {
    return false;
  }

  return true;
}
