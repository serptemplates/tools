import { compressPDF } from "ghostscript-node";
import {
  buildServerActionRateLimitResponse,
  createServerActionCooldownCookieCodec,
  createServerActionRateLimiter,
  getServerActionRateLimitIdentity,
  isSecureRequest,
} from "@/lib/server-action-rate-limit";

export const runtime = "nodejs";

const serverActionRateLimiter = createServerActionRateLimiter();
const serverActionCooldownCookieCodec = createServerActionCooldownCookieCodec();

export async function POST(request: Request): Promise<Response> {
  const serverActionIdentity = getServerActionRateLimitIdentity(request.headers);
  const cookieBlock = serverActionCooldownCookieCodec.readBlock(
    request.headers,
    serverActionIdentity,
  );
  if (cookieBlock) {
    return buildServerActionRateLimitResponse(cookieBlock);
  }

  const inMemoryBlock = serverActionRateLimiter.check(serverActionIdentity, {
    record: false,
  });
  if (!inMemoryBlock.allowed) {
    return buildServerActionRateLimitResponse(inMemoryBlock);
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await request.arrayBuffer());
  } catch {
    return Response.json({ error: "Invalid PDF payload." }, { status: 400 });
  }

  if (!buffer.length) {
    return Response.json({ error: "Empty PDF payload." }, { status: 400 });
  }

  try {
    const result = await compressPDF(buffer);
    serverActionRateLimiter.check(serverActionIdentity);
    const cooldownCookie = serverActionCooldownCookieCodec.createSetCookie(
      serverActionIdentity,
      { secure: isSecureRequest(request) },
    );
    const body = new Uint8Array(result);
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": result.length.toString(),
        "set-cookie": cooldownCookie.headerValue,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF compression failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
