"use client";

import type { ReactNode } from "react";

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
  if (!visible) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`grid grid-cols-1 gap-6 xl:grid-cols-[220px,minmax(0,1fr),220px] ${className ?? ""}`}
    >
      <ToolAdSlot
        slotId={`${slotPrefix}-left`}
        size="300x600"
        className="hidden h-[600px] xl:flex"
      />
      <div className="min-w-0">{children}</div>
      <ToolAdSlot
        slotId={`${slotPrefix}-right`}
        size="300x600"
        className="hidden h-[600px] xl:flex"
      />
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
