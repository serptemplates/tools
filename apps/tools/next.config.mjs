import path from "node:path";
import ffmpegPath from "ffmpeg-static";

const ffmpegDir = ffmpegPath ? path.dirname(ffmpegPath) : null;
const ffmpegTrace = ffmpegDir ? `./${path.relative(process.cwd(), ffmpegDir)}/**` : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use Vercel's Next.js runtime (no static export)
  transpilePackages: ["@serp-tools/ui"],
  trailingSlash: true,
  env: {
    BUILD_MODE: "server",
    SUPPORTS_VIDEO_CONVERSION: "true",
  },
  outputFileTracingIncludes: ffmpegTrace
    ? {
        "/api/video-convert": [ffmpegTrace],
        "/api/image-convert": [ffmpegTrace],
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
