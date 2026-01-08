import { NextResponse } from "next/server";
import { recordToolRun } from "@serp-tools/tool-telemetry/server";

export async function POST(request: Request) {
  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const result = await recordToolRun(payload);
  return NextResponse.json(result.body, { status: result.status });
}
