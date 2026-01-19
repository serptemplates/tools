"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import {
  DEFAULT_ADSENSE_CLIENT,
  DEFAULT_ADSENSE_RESPONSIVE,
  DEFAULT_AD_SLOTS,
  TOOL_AD_SLOTS,
} from "@/lib/adsense";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? DEFAULT_ADSENSE_CLIENT;
const ADSENSE_TEST_MODE = process.env.NEXT_PUBLIC_ADSENSE_TEST_MODE === "true";
const ADSENSE_RESPONSIVE = process.env.NEXT_PUBLIC_ADSENSE_RESPONSIVE
  ? process.env.NEXT_PUBLIC_ADSENSE_RESPONSIVE === "true"
  : DEFAULT_ADSENSE_RESPONSIVE;
const ADSENSE_SLOTS = {
  left:
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_LEFT ??
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_RAIL ??
    DEFAULT_AD_SLOTS.left ??
    "",
  right:
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_RIGHT ??
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_RAIL ??
    DEFAULT_AD_SLOTS.right ??
    "",
  inline: process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE ?? DEFAULT_AD_SLOTS.inline ?? "",
};

function parseAdSize(size: string) {
  const [width, height] = size.split("x").map((value) => Number.parseInt(value, 10));
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  return { width, height };
}

function resolveAdSlot(slotId: string) {
  if (/^\d+$/.test(slotId)) {
    return slotId;
  }
  const match = slotId.match(/-(left|right|inline)$/);
  if (!match) return "";
  const suffix = match[1] as keyof typeof ADSENSE_SLOTS;
  const toolKey = slotId.replace(/-(left|right|inline)$/, "");
  const toolSlots = TOOL_AD_SLOTS[toolKey];
  return toolSlots?.[suffix] ?? ADSENSE_SLOTS[suffix] ?? "";
}

type ToolAdSlotProps = {
  slotId: string;
  size: string;
  className?: string;
  label?: string;
};

export function ToolAdSlot({
  slotId,
  size,
  className,
  label = "Advertisement",
}: ToolAdSlotProps) {
  const resolvedSlot = resolveAdSlot(slotId);
  const hasAdSense = Boolean(ADSENSE_CLIENT && resolvedSlot);
  const parsedSize = parseAdSize(size);

  useEffect(() => {
    if (!hasAdSense) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense can throw if blocked by extensions or not yet ready.
    }
  }, [hasAdSense, resolvedSlot, size]);

  if (hasAdSense) {
    const adStyle = ADSENSE_RESPONSIVE
      ? {
          display: "block",
          width: "100%",
          minHeight: parsedSize?.height,
        }
      : {
          display: "inline-block",
          width: parsedSize?.width,
          height: parsedSize?.height,
        };

    return (
      <div
        className={`relative flex items-center justify-center ${className ?? ""}`}
        data-ad-slot={slotId}
        data-ad-size={size}
        aria-label={label}
        role="complementary"
      >
        <ins
          className="adsbygoogle"
          style={adStyle}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={resolvedSlot}
          data-ad-format={ADSENSE_RESPONSIVE ? "auto" : undefined}
          data-full-width-responsive={ADSENSE_RESPONSIVE ? "true" : undefined}
          data-adtest={ADSENSE_TEST_MODE ? "on" : undefined}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/80 text-gray-400 ${className ?? ""}`}
      data-ad-slot={slotId}
      data-ad-size={size}
      aria-label={label}
      role="complementary"
    >
      <div className="text-center text-[10px] uppercase tracking-wide">
        <div>{label}</div>
        <div>{size}</div>
      </div>
    </div>
  );
}

type ToolAdRailProps = {
  visible: boolean;
  slotPrefix: string;
  children: ReactNode;
  className?: string;
};

export function ToolAdRail({ visible, slotPrefix, children, className }: ToolAdRailProps) {
  const railPlaceholderClass = "hidden h-[600px] w-full xl:block";

  return (
    <div
      className={`grid grid-cols-1 gap-6 xl:grid-cols-[160px_minmax(0,1fr)_160px] ${className ?? ""}`}
    >
      {visible ? (
        <ToolAdSlot
          slotId={`${slotPrefix}-left`}
          size="160x600"
          className="hidden h-[600px] w-full xl:flex"
        />
      ) : (
        <div className={railPlaceholderClass} aria-hidden="true" />
      )}
      <div className="min-w-0">{children}</div>
      {visible ? (
        <ToolAdSlot
          slotId={`${slotPrefix}-right`}
          size="160x600"
          className="hidden h-[600px] w-full xl:flex"
        />
      ) : (
        <div className={railPlaceholderClass} aria-hidden="true" />
      )}
    </div>
  );
}

type ToolAdInlineProps = {
  visible: boolean;
  slotId: string;
  size?: string;
  className?: string;
};

export function ToolAdInline({ visible, slotId, size = "728x90", className }: ToolAdInlineProps) {
  if (!visible) return null;
  return (
    <ToolAdSlot
      slotId={slotId}
      size={size}
      className={`mx-auto h-[90px] w-full max-w-[728px] ${className ?? ""}`}
    />
  );
}
