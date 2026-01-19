"use client";

import { ToolAdInline, ToolAdRail } from "@/components/ToolAds";
import {
  ToolProgressIndicator,
  type ToolProgressFile,
} from "@/components/ToolProgressIndicator";

type ToolHeroLayoutProps = {
  adsVisible: boolean;
  adSlotPrefix: string;
  hero: React.ReactNode;
  below?: React.ReactNode;
  background?: React.ReactNode;
  showAdRail?: boolean;
  currentFile?: ToolProgressFile | null;
  progressClassName?: string;
  progressCompletedLabel?: string;
  sectionClassName?: string;
  containerClassName?: string;
  contentClassName?: string;
  inlineAdClassName?: string;
  showInlineAd?: boolean;
};

export function ToolHeroLayout({
  adsVisible,
  adSlotPrefix,
  hero,
  below,
  background,
  showAdRail = true,
  currentFile = null,
  progressClassName,
  progressCompletedLabel,
  sectionClassName,
  containerClassName,
  contentClassName,
  inlineAdClassName,
  showInlineAd = true,
}: ToolHeroLayoutProps) {
  const sectionClasses = ["w-full bg-white", sectionClassName]
    .filter(Boolean)
    .join(" ");
  const containerClasses = ["mx-auto max-w-7xl px-6 py-8", containerClassName]
    .filter(Boolean)
    .join(" ");
  const inlineAdClasses = ["mt-6", inlineAdClassName].filter(Boolean).join(" ");
  const progressClasses = progressClassName ?? "mt-6 max-w-2xl mx-auto";
  const content = (
    <div className={contentClassName}>
      {hero}
      <ToolProgressIndicator
        currentFile={currentFile}
        className={progressClasses}
        completedLabel={progressCompletedLabel}
      />
      {below}
    </div>
  );

  return (
    <section className={sectionClasses}>
      {background}
      <div className={containerClasses}>
        {showAdRail ? (
          <ToolAdRail visible={adsVisible} slotPrefix={adSlotPrefix} className="items-start">
            {content}
          </ToolAdRail>
        ) : (
          content
        )}
        {showInlineAd && (
          <ToolAdInline
            visible={adsVisible}
            slotId={`${adSlotPrefix}-inline`}
            className={inlineAdClasses}
          />
        )}
      </div>
    </section>
  );
}
