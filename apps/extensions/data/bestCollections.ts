import type { ExtensionRecord } from "@serp-extensions/app-core/lib/catalog";

export type BestCollectionSlug =
  | "video-downloaders"
  | "screenshot-extensions"
  | "ad-blockers"
  | "volume-boosters";

export interface BestCollectionConfig {
  slug: BestCollectionSlug;
  title: string;
  tagline: string;
  description: string;
  keywords: string[];
  highlight?: string;
}

export const BEST_COLLECTION_CONFIGS: Record<BestCollectionSlug, BestCollectionConfig> = {
  "video-downloaders": {
    slug: "video-downloaders",
    title: "Best Video Downloader Extensions",
    tagline: "Save videos from across the web, straight from your browser.",
    description:
      "Curated browser extensions that make capturing videos effortless—supporting popular streaming sites, playlists, and bulk downloads.",
    keywords: ["video", "download", "downloader", "media"],
    highlight: "Hand-picked downloaders that balance reliability with download speed and format coverage.",
  },
  "screenshot-extensions": {
    slug: "screenshot-extensions",
    title: "Top Screenshot Extensions",
    tagline: "Capture, annotate, and share any page without leaving your tab.",
    description:
      "From scrolling captures to instant annotations, these extensions keep documentation and collaboration fast.",
    keywords: ["screenshot", "capture", "screen", "annotate"],
    highlight: "Find tools that support full-page screenshots, instant markups, and cloud storage workflows.",
  },
  "ad-blockers": {
    slug: "ad-blockers",
    title: "Leading Ad Blocker Extensions",
    tagline: "Keep pages fast, private, and distraction-free.",
    description:
      "Battle-tested blockers that strip ads, trackers, and malware to keep browsing serene.",
    keywords: ["ad", "ads", "block", "blocker", "privacy", "tracker"],
    highlight: "All picks support custom filter lists and ship regular threat updates.",
  },
  "volume-boosters": {
    slug: "volume-boosters",
    title: "Best Volume Booster Extensions",
    tagline: "Amplify videos, music, and calls in a single click.",
    description:
      "When tabs are too quiet, these gain boosters and equalizers keep the audio audible without fiddling with system settings.",
    keywords: ["volume", "audio", "sound", "booster", "loud"],
    highlight: "Extensions that offer fine-grained gain controls, presets, and safe-guarded limits.",
  },
};

export function getBestCollectionConfig(slug: string): BestCollectionConfig | null {
  return BEST_COLLECTION_CONFIGS[slug as BestCollectionSlug] ?? null;
}

export function listBestCollections(): BestCollectionConfig[] {
  return Object.values(BEST_COLLECTION_CONFIGS);
}

export function filterExtensionsForCollection(
  extensions: ExtensionRecord[],
  config: BestCollectionConfig,
) {
  if (config.slug === "screenshot-extensions") {
    const exactKeyword = "screenshot extensions";
    return extensions.filter((extension) => {
      const keywordSources = [
        ...(extension.tags ?? []),
        ...(extension.topics ?? []),
      ];

      return keywordSources.some(
        (value) => typeof value === "string" && value.trim().toLowerCase() === exactKeyword,
      );
    });
  }

  const normalizedKeywords = config.keywords.map((keyword) => keyword.toLowerCase());

  return extensions.filter((extension) => {
    const haystackParts = [
      extension.name,
      extension.description,
      extension.overview ?? "",
      ...(extension.tags ?? []),
      ...(extension.topics ?? []),
      extension.category ?? "",
    ];

    const haystack = haystackParts
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return normalizedKeywords.some((keyword) => haystack.includes(keyword));
  });
}
