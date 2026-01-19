import { NextResponse } from "next/server";

import { buildUrl, escapeXml, getCategoryPaths, PAGE_SIZE, resolveSiteBase } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ page?: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const base = resolveSiteBase(request);
  const { page } = (await params) as { page?: string };
  if (!page) {
    return new NextResponse("Not found", { status: 404 });
  }

  const pageNumber = Number.parseInt(page, 10);
  if (!Number.isFinite(pageNumber) || pageNumber < 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  const paths = getCategoryPaths();
  if (paths.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }
  const totalPages = Math.max(1, Math.ceil(paths.length / PAGE_SIZE));
  if (pageNumber >= totalPages) {
    return new NextResponse("Not found", { status: 404 });
  }

  const offset = pageNumber * PAGE_SIZE;
  const slice = paths.slice(offset, offset + PAGE_SIZE);
  const urls = slice.map((path) => buildUrl(base, path));

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`,
    ...urls.map((loc) => `<url><loc>${escapeXml(loc)}</loc></url>`),
    `</urlset>`,
  ].join("");

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
