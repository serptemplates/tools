import { NextResponse } from "next/server";

import {
  SITEMAP_PAGE_SIZE,
  buildCorePageEntries,
  buildToolEntries,
  escapeXml,
  resolveBaseUrl,
} from "@/lib/sitemap-utils";

export const dynamic = "force-static";

export function GET(): NextResponse {
  const baseUrl = resolveBaseUrl();
  const now = new Date();

  const coreEntries = buildCorePageEntries();
  const coreLastMod =
    coreEntries.reduce<Date | null>((latest, entry) => {
      return !latest || entry.lastModified > latest ? entry.lastModified : latest;
    }, null) ?? now;

  const toolEntries = buildToolEntries();
  const totalExtensionPages = toolEntries.length
    ? Math.max(1, Math.ceil(toolEntries.length / SITEMAP_PAGE_SIZE))
    : 0;
  const toolsLastMod = toolEntries.length
    ? toolEntries.reduce<Date | null>((latest, entry) => {
        return !latest || entry.lastModified > latest ? entry.lastModified : latest;
      }, null) ?? now
    : null;

  const sitemapEntries: Array<{ loc: string; lastmod: string }> = [];

  if (coreEntries.length > 0) {
    sitemapEntries.push({
      loc: `${baseUrl}/pages-sitemap.xml`,
      lastmod: coreLastMod.toISOString(),
    });
  }

  if (totalExtensionPages > 0 && toolsLastMod) {
    sitemapEntries.push({
      loc: `${baseUrl}/extensions-sitemap.xml`,
      lastmod: toolsLastMod.toISOString(),
    });

    // Only needed if we ever paginate beyond page 1
    for (let page = 2; page <= totalExtensionPages; page += 1) {
      sitemapEntries.push({
        loc: `${baseUrl}/extensions-sitemap-${page}.xml`,
        lastmod: toolsLastMod.toISOString(),
      });
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries
  .map(
    (item) => `  <sitemap>
    <loc>${escapeXml(item.loc)}</loc>
    <lastmod>${item.lastmod}</lastmod>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
