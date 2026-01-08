import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import ffmpegPath from "ffmpeg-static";

const require = createRequire(import.meta.url);
const appRoot = path.dirname(fileURLToPath(import.meta.url));
const tracingRoot = path.resolve(appRoot, "../..");
const ffmpegDir = ffmpegPath ? path.dirname(ffmpegPath) : null;
const ffmpegTrace = ffmpegDir ? `./${path.relative(tracingRoot, ffmpegDir)}/**` : null;
let magickTrace = null;
try {
  const magickWasmPath = require.resolve("@imagemagick/magick-wasm/magick.wasm");
  magickTrace = `./${path.relative(tracingRoot, magickWasmPath)}`;
} catch {
  magickTrace = null;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use Vercel's Next.js runtime (no static export)
  transpilePackages: ["@serp-tools/ui", "@serp-tools/tool-telemetry"],
  trailingSlash: true,
  env: {
    BUILD_MODE: "server",
    SUPPORTS_VIDEO_CONVERSION: "true",
    NEXT_PUBLIC_FFMPEG_SINGLE_THREAD: "true",
    NEXT_PUBLIC_VIDEO_CONVERSION_PREFER_SERVER: "true",
  },
  outputFileTracingRoot: tracingRoot,
  outputFileTracingIncludes: ffmpegTrace
    ? {
        "/app/api/video-convert": [ffmpegTrace],
        "/app/api/image-convert": magickTrace ? [ffmpegTrace, magickTrace] : [ffmpegTrace],
      }
    : {},
  webpack(config) {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
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
      {
        source: "/tools-:page.xml",
        destination: "/sitemaps/tools/:page",
      },
      {
        source: "/categories-:page.xml",
        destination: "/sitemaps/categories/:page",
      },
    ];
  },
};

export default nextConfig;
