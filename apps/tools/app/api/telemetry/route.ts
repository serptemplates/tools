import { NextResponse } from "next/server";
import { recordToolRun } from "@serp-tools/tool-telemetry/server";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    null
  );
}

function attachRequestMetadata(payload: unknown, request: Request): unknown {
  if (!isPlainObject(payload)) return payload;

  const metadata = isPlainObject(payload.metadata) ? { ...payload.metadata } : {};
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent");

  if (ip && metadata.ip === undefined) {
    metadata.ip = ip;
  }
  if (userAgent && metadata.userAgent === undefined) {
    metadata.userAgent = userAgent;
  }

  if (Object.keys(metadata).length > 0) {
    return { ...payload, metadata };
  }

  return payload;
}

export async function POST(request: Request) {
  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const enrichedPayload = attachRequestMetadata(payload, request);
  const result = await recordToolRun(enrichedPayload);
  return NextResponse.json(result.body, { status: result.status });
}
