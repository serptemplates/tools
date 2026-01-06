import { NextResponse } from "next/server";

import { escapeXml, getToolPaths, PAGE_SIZE, resolveSiteBase } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const base = resolveSiteBase(request);
  const totalPages = Math.max(1, Math.ceil(getToolPaths().length / PAGE_SIZE));
  const sitemapUrls = Array.from({ length: totalPages }, (_, index) => `${base}/tools-${index}.xml`);

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...sitemapUrls.map((url) => `<sitemap><loc>${escapeXml(url)}</loc></sitemap>`),
    `</sitemapindex>`,
  ].join("");

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
