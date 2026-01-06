import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const tracingRoot = path.resolve(appRoot, "../..");
const ffmpegDir = ffmpegPath ? path.dirname(ffmpegPath) : null;
const ffmpegTrace = ffmpegDir ? `./${path.relative(tracingRoot, ffmpegDir)}/**` : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use Vercel's Next.js runtime (no static export)
  transpilePackages: ["@serp-tools/ui"],
  trailingSlash: true,
  env: {
    BUILD_MODE: "server",
    SUPPORTS_VIDEO_CONVERSION: "true",
    NEXT_PUBLIC_VIDEO_CONVERSION_PREFER_SERVER: "true",
  },
  outputFileTracingRoot: tracingRoot,
  outputFileTracingIncludes: ffmpegTrace
    ? {
        "/app/api/video-convert": [ffmpegTrace],
        "/app/api/image-convert": [ffmpegTrace],
      }
    : {},
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/sitemap-:page.xml",
        destination: "/sitemap/:page",
      },
      {
        source: "/pages-:page.xml",
        destination: "/sitemaps/pages/:page",
      },
    ];
  },
};

export default nextConfig;
