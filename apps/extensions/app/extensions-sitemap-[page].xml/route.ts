import { NextResponse } from "next/server";

import { SITEMAP_PAGE_SIZE, buildToolEntries, escapeXml } from "@/lib/sitemap-utils";

export async function GET(request: Request): Promise<NextResponse> {
  const { pathname } = new URL(request.url);
  const match = pathname.match(/\/extensions-sitemap-(\d+)\.xml$/);
  const pageNumber = match ? Number.parseInt(match[1] ?? "", 10) : NaN;
  if (!Number.isFinite(pageNumber) || pageNumber < 2) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const entries = await buildToolEntries();
  const totalPages = Math.max(1, Math.ceil(entries.length / SITEMAP_PAGE_SIZE));

  if (pageNumber > totalPages) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const start = (pageNumber - 1) * SITEMAP_PAGE_SIZE;
  const slice = entries.slice(start, start + SITEMAP_PAGE_SIZE);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${slice
  .map((entry) => {
    const changefreq = entry.changeFrequency
      ? `    <changefreq>${entry.changeFrequency}</changefreq>\n`
      : "";
    const priority =
      entry.priority !== undefined
        ? `    <priority>${entry.priority.toFixed(1)}</priority>\n`
        : "";

    return `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n    <lastmod>${entry.lastModified.toISOString()}</lastmod>\n${changefreq}${priority}  </url>`;
  })
  .join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}

