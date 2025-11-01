export interface ProcessedExtension {
  id: string;
  slug: string;
  name: string;
  description: string;
  overview?: string;
  category: string;
  topics?: string[];
  iconKey?: string;
  logoUrl?: string;
  href: string | null;
  tags: string[];
  isNew: boolean;
  isPopular: boolean;
  rating?: number;
  users?: string;
  url?: string;
  chromeStoreUrl?: string;
  firefoxAddonUrl?: string;
  version?: string;
  lastUpdated?: string;
  size?: string;
  developer?: { name: string; verified: boolean; website?: string };
  permissions?: string[];
  languages?: string[];
  screenshots?: string[];
  features?: string[];
  reviews?: { total: number; average: number; distribution: Record<string, number> };
}

export interface CategoryWithCount {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

export interface TopicWithCount {
  id: string;
  slug: string;
  name: string;
  description: string;
  count: number;
}

function apiBase() {
  return process.env.EXTENSIONS_API_BASE || "http://localhost:3001";
}

export async function fetchExtensions(): Promise<ProcessedExtension[]> {
  const res = await fetch(`${apiBase()}/api/extensions`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load extensions: ${res.status}`);
  return res.json();
}

export async function fetchExtension(id: string): Promise<ProcessedExtension | null> {
  const res = await fetch(`${apiBase()}/api/extensions/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load extension ${id}: ${res.status}`);
  return res.json();
}

export async function fetchCategories(): Promise<CategoryWithCount[]> {
  const res = await fetch(`${apiBase()}/api/categories`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load categories: ${res.status}`);
  return res.json();
}

export async function fetchTopics(): Promise<TopicWithCount[]> {
  const res = await fetch(`${apiBase()}/api/topics`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load topics: ${res.status}`);
  return res.json();
}

