/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use Vercel's Next.js runtime (no static export)
  transpilePackages: ["@serp-tools/ui"],
  trailingSlash: true,
  env: {
    BUILD_MODE: "server",
    SUPPORTS_VIDEO_CONVERSION: "true",
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
};

export default nextConfig;
