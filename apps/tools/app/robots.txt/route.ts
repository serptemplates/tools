import { NextResponse } from "next/server";

import { resolveSiteBase } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const base = resolveSiteBase(request);
  const body = [`User-agent: *`, `Allow: /`, `Sitemap: ${base}/sitemap-index.xml`].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
