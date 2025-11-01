import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";

import extensionsJson from "../data/extensions.json";
import categoriesJson from "../data/categories.json";
import topicsJson from "../data/topics.json";
import { getDb } from "../db/client";
import * as dbSchema from "../db/schema";
import type { ExtensionRow, CategoryRow, TopicRow } from "../db/schema";

export interface CategoryRecord {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface TopicRecord {
  id: string;
  slug: string;
  name: string;
  description?: string;
}

export interface ExtensionDeveloper {
  name?: string;
  website?: string;
  email?: string;
}

export interface ExtensionRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  overview?: string;
  category?: string;
  tags: string[];
  topics: string[];
  icon?: string;
  screenshots: string[];
  features: string[];
  languages: string[];
  chromeStoreUrl?: string;
  firefoxAddonUrl?: string;
  website?: string;
  url?: string;
  privacyPolicy?: string;
  supportSite?: string;
  isActive: boolean;
  isNew: boolean;
  isPopular: boolean;
  rating?: number;
  ratingCount?: number;
  users?: string;
  version?: string;
  updated?: string;
  size?: string;
  developer?: ExtensionDeveloper;
}

function cloneCategory(category: CategoryRecord): CategoryRecord {
  return { ...category };
}

function cloneTopic(topic: TopicRecord): TopicRecord {
  return { ...topic };
}

function cloneExtension(extension: ExtensionRecord): ExtensionRecord {
  return {
    ...extension,
    tags: [...(extension.tags ?? [])],
    topics: [...(extension.topics ?? [])],
    screenshots: [...(extension.screenshots ?? [])],
    features: [...(extension.features ?? [])],
    languages: [...(extension.languages ?? [])],
    developer: extension.developer ? { ...extension.developer } : undefined,
  };
}

function parseStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

function normalizeCategoryRow(row: CategoryRow): CategoryRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? undefined,
    icon: row.icon ?? undefined,
  };
}

function normalizeTopicRow(row: TopicRow): TopicRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? undefined,
  };
}

function normalizeExtensionRow(row: ExtensionRow): ExtensionRecord {
  const ratingValue = row.rating ? Number(row.rating) : undefined;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    overview: row.overview ?? undefined,
    category: row.category ?? undefined,
    tags: parseStringArray(row.tags),
    topics: parseStringArray(row.topics),
    icon: row.icon ?? undefined,
    screenshots: parseStringArray(row.screenshots),
    features: parseStringArray(row.features),
    languages: parseStringArray(row.languages),
    chromeStoreUrl: row.chromeStoreUrl ?? undefined,
    firefoxAddonUrl: row.firefoxAddonUrl ?? undefined,
    website: row.website ?? undefined,
    url: row.url ?? undefined,
    privacyPolicy: row.privacyPolicy ?? undefined,
    supportSite: row.supportSite ?? undefined,
    isActive: row.isActive ?? true,
    isNew: row.isNew ?? false,
    isPopular: row.isPopular ?? false,
    rating: Number.isFinite(ratingValue) ? ratingValue : undefined,
    ratingCount: row.ratingCount ?? undefined,
    users: row.users ?? undefined,
    version: row.version ?? undefined,
    updated: row.updated ?? row.updatedAt?.toISOString(),
    size: row.size ?? undefined,
    developer: row.developer ?? undefined,
  };
}

const loadCategories = cache(async (): Promise<CategoryRecord[]> => {
  const db = getDb();
  if (!db) {
    return (categoriesJson as CategoryRecord[]).map(cloneCategory);
  }

  const rows = await db.select().from(dbSchema.categories).orderBy(dbSchema.categories.name);
  return rows.map(normalizeCategoryRow);
});

const loadTopics = cache(async (): Promise<TopicRecord[]> => {
  const db = getDb();
  if (!db) {
    return (topicsJson as TopicRecord[]).map(cloneTopic);
  }

  const rows = await db.select().from(dbSchema.topics).orderBy(dbSchema.topics.name);
  return rows.map(normalizeTopicRow);
});

const loadExtensions = cache(async (): Promise<ExtensionRecord[]> => {
  const db = getDb();
  if (!db) {
    return (extensionsJson as ExtensionRecord[]).map(cloneExtension);
  }

  const rows = await db
    .select()
    .from(dbSchema.extensions)
    .where(eq(dbSchema.extensions.isActive, true));

  return rows.map(normalizeExtensionRow);
});

export async function getCategories(): Promise<CategoryRecord[]> {
  return loadCategories();
}

export async function getTopics(): Promise<TopicRecord[]> {
  return loadTopics();
}

export async function getActiveExtensions(): Promise<ExtensionRecord[]> {
  const extensions = await loadExtensions();
  return extensions.filter((extension) => extension.isActive !== false);
}

export async function getExtensionBySlugAndId(slug: string, id: string): Promise<ExtensionRecord | null> {
  const extensions = await getActiveExtensions();
  return extensions.find((extension) => extension.slug === slug && extension.id === id) ?? null;
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRecord | null> {
  const categories = await getCategories();
  return categories.find((category) => category.slug === slug) ?? null;
}

export async function getTopicBySlug(slug: string): Promise<TopicRecord | null> {
  const topics = await getTopics();
  return topics.find((topic) => topic.slug === slug) ?? null;
}

export async function getExtensionsByCategory(slug: string): Promise<ExtensionRecord[]> {
  const extensions = await getActiveExtensions();
  return extensions.filter((extension) => extension.category === slug);
}

export async function getExtensionsByTopic(slug: string): Promise<ExtensionRecord[]> {
  const extensions = await getActiveExtensions();
  return extensions.filter((extension) => extension.topics.includes(slug));
}

export async function getCategoriesWithCounts(): Promise<Array<CategoryRecord & { count: number }>> {
  const [categories, extensions] = await Promise.all([getCategories(), getActiveExtensions()]);
  const countMap = new Map<string, number>();

  extensions.forEach((extension) => {
    const key = extension.category ?? "other";
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  });

  return categories.map((category) => ({
    ...category,
    count: countMap.get(category.slug) ?? 0,
  }));
}

export async function getTopicsWithCounts(): Promise<Array<TopicRecord & { count: number }>> {
  const [topics, extensions] = await Promise.all([getTopics(), getActiveExtensions()]);
  const countMap = new Map<string, number>();

  extensions.forEach((extension) => {
    extension.topics.forEach((topicSlug) => {
      countMap.set(topicSlug, (countMap.get(topicSlug) ?? 0) + 1);
    });
  });

  return topics.map((topic) => ({
    ...topic,
    count: countMap.get(topic.slug) ?? 0,
  }));
}

export * as dbSchema from "../db/schema";
