"use client";

import { ToolHeroLayout } from "@/components/ToolHeroLayout";

type PdfMode = "edit" | "view";

type PdfToolProps = {
  toolId: string;
  title: string;
  subtitle?: string;
  mode: PdfMode;
};

const viewerBasePath = "/vendor/pdfjs-annotation-extension/web/viewer.html";

function buildViewerUrl(mode: PdfMode): string {
  const hashParams = new URLSearchParams();
  hashParams.set("ae_username", "SERP Tools");
  hashParams.set("ae_get_url", "");
  hashParams.set("ae_post_url", "");
  hashParams.set("ae_default_editor_active", mode === "edit" ? "true" : "false");
  hashParams.set("ae_default_sidebar_open", mode === "edit" ? "true" : "false");
  return `${viewerBasePath}#${hashParams.toString()}`;
}

export default function PdfTool({ toolId, title, subtitle, mode }: PdfToolProps) {
  const viewerUrl = buildViewerUrl(mode);

  const heroContent = (
    <div className="text-center space-y-3">
      <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">{title}</h1>
      <p className="text-base text-gray-600 sm:text-lg">
        {subtitle ?? "Open and annotate PDF documents directly in your browser."}
      </p>
      <p className="text-sm text-gray-500">
        Use the built-in toolbar to open files, annotate, and download updates.
      </p>
    </div>
  );

  const viewerPanel = (
    <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
      <iframe
        title={`${title} viewer`}
        src={viewerUrl}
        className="h-[80vh] w-full bg-white"
        allowFullScreen
      />
    </div>
  );

  return (
    <ToolHeroLayout
      adsVisible={false}
      adSlotPrefix={toolId}
      hero={heroContent}
      below={viewerPanel}
      showInlineAd={false}
      showAdRail={false}
    />
  );
}
