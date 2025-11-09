/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use Vercel's Next.js runtime (no static export)
  transpilePackages: ["@serp-tools/ui"],
  trailingSlash: true,
};

export default nextConfig;
