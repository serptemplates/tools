/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  transpilePackages: ["@serp-tools/ui"],
  trailingSlash: true,
};

export default nextConfig;
