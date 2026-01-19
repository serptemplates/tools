import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const publisherOverride = process.env.ADSENSE_PUBLISHER_ID;
  const publisherId =
    publisherOverride ??
    (adsenseClient ? adsenseClient.replace(/^ca-/, "") : null) ??
    "pub-2343633734899216";
  const body = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
