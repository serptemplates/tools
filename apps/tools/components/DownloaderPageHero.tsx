"use client";

import { useState } from "react";
import { ToolAdInline } from "@/components/ToolAds";
import VideoDownloaderTool from "@/components/VideoDownloaderTool";

type DownloaderPageHeroProps = {
  toolId: string;
  title: string;
  subtitle?: string;
};

function getDownloaderBannerSlotId(toolId: string) {
  return `${toolId}-banner-inline`;
}

export default function DownloaderPageHero({
  toolId,
  title,
  subtitle,
}: DownloaderPageHeroProps) {
  const [adsVisible, setAdsVisible] = useState(false);

  return (
    <>
      <VideoDownloaderTool
        toolId={toolId}
        title={title}
        subtitle={subtitle}
        adsVisible={adsVisible}
        onAdsVisibleChange={setAdsVisible}
      />

      {adsVisible && (
        <section className="border-y bg-muted/20">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Advertisement
            </p>
            <ToolAdInline
              visible={adsVisible}
              slotId={getDownloaderBannerSlotId(toolId)}
              className="mx-auto"
            />
          </div>
        </section>
      )}
    </>
  );
}
