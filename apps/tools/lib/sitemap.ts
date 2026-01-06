import toolsData from "@serp-tools/app-core/data/tools.json";

export const PAGE_SIZE = 10000;

export const STATIC_PATHS = ["/"];

export const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const normalizeBase = (site: string) => site.replace(/\/$/, "");

export const buildUrl = (base: string, path: string) => `${base}${path}`;

export function normalizePath(path: string) {
  if (!path) return "/";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  if (withSlash === "/") return "/";
  return withSlash.endsWith("/") ? withSlash : `${withSlash}/`;
}

export function resolveSiteBase(request: Request) {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || process.env.VERCEL_URL;
  if (envBase) {
    const withProtocol = envBase.startsWith("http") ? envBase : `https://${envBase}`;
    return normalizeBase(withProtocol);
  }
  return normalizeBase(new URL(request.url).origin);
}

export function getSitemapPaths() {
  const toolPaths = toolsData
    .filter((tool) => tool.isActive)
    .map((tool) => tool.route)
    .filter(Boolean)
    .map((path) => normalizePath(path));

  const seen = new Set<string>();
  const allPaths = [...STATIC_PATHS.map(normalizePath), ...toolPaths];
  return allPaths.filter((path) => {
    if (seen.has(path)) return false;
    seen.add(path);
    return true;
  });
}
