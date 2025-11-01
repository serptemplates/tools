import toolsData from "@serp-tools/app-core/data/tools.json";

export const SITEMAP_PAGE_SIZE = 20000;

export type SitemapUrlEntry = {
  loc: string;
  lastModified: Date;
  changeFrequency?: string;
  priority?: number;
};

export function resolveBaseUrl(): string {
  const domain = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tools.serp.co";
  return domain.replace(/\/$/, "");
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildCorePageEntries(): SitemapUrlEntry[] {
  const baseUrl = resolveBaseUrl();
  const now = new Date();

  return [
    {
      loc: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}

export function buildToolEntries(): SitemapUrlEntry[] {
  const baseUrl = resolveBaseUrl();
  const now = new Date();

  const tools = toolsData as Array<{ route?: string; isActive?: boolean }>;

  return tools
    .filter((t) => !!t.route && t.isActive !== false)
    .map((t) => ({
      loc: `${baseUrl}${t.route!}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    } satisfies SitemapUrlEntry));
}

export function buildAppSitemapEntries(): SitemapUrlEntry[] {
  return [...buildCorePageEntries(), ...buildToolEntries()];
}

