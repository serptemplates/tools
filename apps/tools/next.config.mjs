import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import ffmpegPath from "ffmpeg-static";

const require = createRequire(import.meta.url);
const appRoot = path.dirname(fileURLToPath(import.meta.url));
const tracingRoot = path.resolve(appRoot, "../..");
const toolsPath = path.resolve(tracingRoot, "packages/app-core/src/data/tools.json");
const appDir = path.resolve(appRoot, "app");
let ffmpegRoutes = [];
const transcribeRoutes = new Set();

function normalizeRoute(route) {
  if (!route) return null;
  const normalized = String(route).replace(/\/$/, "");
  return normalized.length ? normalized : "/";
}

function routeFromFilePath(filePath) {
  const relative = path.relative(appDir, path.dirname(filePath));
  if (!relative || relative === ".") return "/";
  const parts = relative.split(path.sep).filter((part) => part && !/^\(.*\)$/.test(part));
  return normalizeRoute(`/${parts.join("/")}`);
}

function collectTranscribeRoutes() {
  if (!fs.existsSync(appDir)) return;
  const queue = [appDir];
  while (queue.length) {
    const current = queue.pop();
    if (!current) continue;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }
      if (!entry.isFile() || entry.name !== "page.tsx") continue;
      const source = fs.readFileSync(fullPath, "utf8");
      if (!source.includes("TranscribeTool")) continue;
      const toolIdMatch = source.match(/const toolId = ['"]([^'"]+)['"]/);
      const toolId = toolIdMatch?.[1];
      if (toolId) {
        transcribeRoutes.add({ toolId, fallbackRoute: routeFromFilePath(fullPath) });
      } else {
        transcribeRoutes.add({ toolId: null, fallbackRoute: routeFromFilePath(fullPath) });
      }
    }
  }
}

try {
  const toolsJson = JSON.parse(fs.readFileSync(toolsPath, "utf8"));
  collectTranscribeRoutes();
  const seenRoutes = new Set();
  const transcribeRouteSet = new Set(
    Array.from(transcribeRoutes)
      .map((entry) => {
        if (!entry.toolId) return entry.fallbackRoute;
        const tool = toolsJson.find((candidate) => candidate?.id === entry.toolId);
        return normalizeRoute(tool?.route) ?? entry.fallbackRoute;
      })
      .filter(Boolean)
  );
  ffmpegRoutes = toolsJson
    .filter((tool) => tool?.isActive && tool?.route && (tool?.requiresFFmpeg || transcribeRouteSet.has(normalizeRoute(tool.route))))
    .map((tool) => normalizeRoute(tool.route))
    .filter((route) => {
      if (!route || seenRoutes.has(route)) return false;
      seenRoutes.add(route);
      return true;
    });
  for (const route of transcribeRouteSet) {
    if (!route || seenRoutes.has(route)) continue;
    seenRoutes.add(route);
    ffmpegRoutes.push(route);
  }
} catch {
  ffmpegRoutes = [];
}
const ffmpegDir = ffmpegPath ? path.dirname(ffmpegPath) : null;
const ffmpegTrace = ffmpegDir ? `./${path.relative(tracingRoot, ffmpegDir)}/**` : null;
let magickTrace = null;
try {
  const magickWasmPath = require.resolve("@imagemagick/magick-wasm/magick.wasm");
  magickTrace = `./${path.relative(tracingRoot, magickWasmPath)}`;
} catch {
  magickTrace = null;
}
let ytDlpTrace = null;
try {
  const ytDlpRoot = path.dirname(require.resolve("youtube-dl-exec/package.json"));
  const ytDlpBinDir = path.resolve(ytDlpRoot, "bin");
  ytDlpTrace = `./${path.relative(tracingRoot, ytDlpBinDir)}/**`;
} catch {
  ytDlpTrace = null;
}

const outputFileTracingIncludes = {};
if (ffmpegTrace) {
  outputFileTracingIncludes["/app/api/video-convert"] = [ffmpegTrace];
  outputFileTracingIncludes["/app/api/image-convert"] = magickTrace
    ? [ffmpegTrace, magickTrace]
    : [ffmpegTrace];
} else if (magickTrace) {
  outputFileTracingIncludes["/app/api/image-convert"] = [magickTrace];
}
if (ytDlpTrace) {
  outputFileTracingIncludes["/app/api/media-fetch"] = [ytDlpTrace];
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
  outputFileTracingIncludes,
  webpack(config) {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
  async headers() {
    const isolationHeaders = [
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
    ];

    return ffmpegRoutes.map((route) => ({
      source: `${route}/:path*`,
      headers: isolationHeaders,
    }));
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
