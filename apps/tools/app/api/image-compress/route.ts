import imagemin from "imagemin";
import imageminGifsicle from "imagemin-gifsicle";
import sharp from "sharp";
import { optimize } from "svgo";
import { mapQualityToImageQuality } from "@/lib/compression-utils";
import {
  buildServerActionRateLimitResponse,
  createServerActionCooldownCookieCodec,
  createServerActionRateLimiter,
  getServerActionRateLimitIdentity,
  isSecureRequest,
  type ServerActionRateLimitIdentity,
} from "@/lib/server-action-rate-limit";

export const runtime = "nodejs";

type ImageCompressFormat =
  | "avif"
  | "bmp"
  | "gif"
  | "heic"
  | "heif"
  | "svg"
  | "tif"
  | "tiff";

const IMAGE_COMPRESS_FORMATS = new Set<ImageCompressFormat>([
  "avif",
  "bmp",
  "gif",
  "heic",
  "heif",
  "svg",
  "tif",
  "tiff",
]);
const OUTPUT_MIME_MAP: Record<ImageCompressFormat, string> = {
  avif: "image/avif",
  bmp: "image/bmp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  svg: "image/svg+xml",
  tif: "image/tiff",
  tiff: "image/tiff",
};

const serverActionRateLimiter = createServerActionRateLimiter();
const serverActionCooldownCookieCodec = createServerActionCooldownCookieCodec();

function isImageCompressFormat(value: string): value is ImageCompressFormat {
  return IMAGE_COMPRESS_FORMATS.has(value as ImageCompressFormat);
}

function buildSuccessResponse(args: {
  buffer: Buffer;
  contentType: string;
  identity: ServerActionRateLimitIdentity;
  request: Request;
}): Response {
  serverActionRateLimiter.check(args.identity);
  const cooldownCookie = serverActionCooldownCookieCodec.createSetCookie(args.identity, {
    secure: isSecureRequest(args.request),
  });
  const headers = new Headers();
  headers.set("Content-Type", args.contentType);
  headers.set("Content-Length", args.buffer.length.toString());
  headers.set("set-cookie", cooldownCookie.headerValue);
  const body = new Uint8Array(args.buffer);
  return new Response(body, { headers });
}

async function compressSvg(buffer: Buffer): Promise<Buffer> {
  const svgSource = buffer.toString("utf8");
  const result = optimize(svgSource, { multipass: true });
  return Buffer.from(result.data);
}

async function compressGif(buffer: Buffer): Promise<Buffer> {
  return imagemin.buffer(buffer, {
    plugins: [
      imageminGifsicle({
        optimizationLevel: 2,
      }),
    ],
  });
}

async function compressWithSharp(format: ImageCompressFormat, buffer: Buffer): Promise<Buffer> {
  const quality = mapQualityToImageQuality(0.82);
  switch (format) {
    case "avif":
      return sharp(buffer).avif({ quality }).toBuffer();
    case "heic":
    case "heif":
      return sharp(buffer).heif({ quality }).toBuffer();
    case "tif":
    case "tiff":
      return sharp(buffer).tiff({ compression: "lzw", quality }).toBuffer();
    default:
      throw new Error(`Unsupported sharp compression format: ${format}`);
  }
}

async function compressImageByFormat(
  format: ImageCompressFormat,
  buffer: Buffer,
): Promise<Buffer> {
  switch (format) {
    case "svg":
      return compressSvg(buffer);
    case "gif":
      return compressGif(buffer);
    case "bmp":
      return buffer;
    default:
      return compressWithSharp(format, buffer);
  }
}

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

  const url = new URL(request.url);
  const rawFormat = url.searchParams.get("format");
  if (!rawFormat) {
    return Response.json({ error: "Missing image format." }, { status: 400 });
  }
  const format = rawFormat.toLowerCase();
  if (!isImageCompressFormat(format)) {
    return Response.json({ error: `Unsupported image format: ${rawFormat}.` }, { status: 400 });
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await request.arrayBuffer());
  } catch {
    return Response.json({ error: "Invalid image payload." }, { status: 400 });
  }

  if (!buffer.length) {
    return Response.json({ error: "Empty image payload." }, { status: 400 });
  }

  try {
    const result = await compressImageByFormat(format, buffer);
    return buildSuccessResponse({
      buffer: result,
      contentType: OUTPUT_MIME_MAP[format],
      identity: serverActionIdentity,
      request,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image compression failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
