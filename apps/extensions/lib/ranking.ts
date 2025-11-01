import type { ExtensionRecord } from "@serp-extensions/app-core/lib/catalog";

export interface RankedExtension {
  extension: ExtensionRecord;
  score: number;
}

export function rankExtensions(extensions: ExtensionRecord[]): RankedExtension[] {
  return extensions
    .map((extension) => ({
      extension,
      score: getScore(extension),
    }))
    .sort((a, b) => b.score - a.score);
}

function getScore(extension: ExtensionRecord): number {
  const ratingScore = (extension.rating ?? 0) * 10;
  const ratingCountScore = extension.ratingCount ? Math.log10(extension.ratingCount + 1) * 5 : 0;
  const popularityBoost = extension.isPopular ? 8 : 0;
  const freshnessBoost = extension.isNew ? 3 : 0;

  return ratingScore + ratingCountScore + popularityBoost + freshnessBoost;
}
