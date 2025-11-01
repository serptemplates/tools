import extensionsData from '@serp-extensions/app-core/data/extensions.json';

export const SITEMAP_PAGE_SIZE = 20000;

interface SitemapEntry {
  loc: string;
  lastModified: Date;
  changeFrequency?: string;
  priority?: number;
}

export function resolveBaseUrl(): string {
  const domain =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "https://extensions.serp.co";

  return domain.replace(/\/$/, "");
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildCorePageEntries(): SitemapEntry[] {
  const baseUrl = resolveBaseUrl();
  const now = new Date();

  return [
    {
      loc: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];
}

export function buildToolEntries(): SitemapEntry[] {
  const baseUrl = resolveBaseUrl();
  const now = new Date();

  return (extensionsData as any[])
    .filter((ext: any) => ext.isActive)
    .map((ext: any) => ({
      loc: `${baseUrl}/extensions/${ext.slug}/${ext.id}`,
      lastModified: ext.updated ? new Date(ext.updated) : now,
      changeFrequency: "weekly",
      priority: ext.isPopular ? 0.8 : 0.6,
    }));
}
