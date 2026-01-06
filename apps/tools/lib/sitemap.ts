import toolsData from "@serp-tools/app-core/data/tools.json";

export const PAGE_SIZE = 10000;

export const STATIC_PATHS = ["/"];
const CATEGORY_PATHS: string[] = [];

export const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const normalizeBase = (site: string) => site.replace(/\/$/, "");

export const buildUrl = (base: string, path: string) => `${base}${path}`;

const dedupePaths = (paths: string[]) => {
  const seen = new Set<string>();
  return paths.map(normalizePath).filter((path) => {
    if (seen.has(path)) return false;
    seen.add(path);
    return true;
  });
};

export function normalizePath(path: string) {
  if (!path) return "/";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  if (withSlash === "/") return "/";
  return withSlash.endsWith("/") ? withSlash : `${withSlash}/`;
}

export function resolveSiteBase(request: Request) {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL;
  if (envBase) {
    const withProtocol = envBase.startsWith("http") ? envBase : `https://${envBase}`;
    return normalizeBase(withProtocol);
  }
  return normalizeBase(new URL(request.url).origin);
}

export function getPagePaths() {
  return dedupePaths(STATIC_PATHS);
}

export function getToolPaths() {
  const toolPaths = toolsData
    .filter((tool) => tool.isActive)
    .map((tool) => tool.route)
    .filter((path): path is string => Boolean(path));
  return dedupePaths(toolPaths);
}

export function getCategoryPaths() {
  return dedupePaths(CATEGORY_PATHS);
}

export function getSitemapPaths() {
  return dedupePaths([...getPagePaths(), ...getToolPaths()]);
}
