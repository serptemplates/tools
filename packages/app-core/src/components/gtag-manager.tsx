"use client";

import { GoogleTagManager } from "@next/third-parties/google";

export function GTagManager() {
  const gtmId = "GTM-PP9W77LK";

  if (process.env.NODE_ENV === "development") {
    return null;
  }

  return <GoogleTagManager gtmId={gtmId} />;
}
