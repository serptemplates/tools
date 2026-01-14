import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const body = "google.com, pub-2343633734899216, DIRECT, f08c47fec0942fa0";

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
