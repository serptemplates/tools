import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  jsonb
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const topics = pgTable("topics", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const extensions = pgTable("extensions", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  overview: text("overview"),
  category: text("category").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  topics: jsonb("topics").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  icon: text("icon"),
  screenshots: jsonb("screenshots").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  features: jsonb("features").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  languages: jsonb("languages").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  chromeStoreUrl: text("chrome_store_url"),
  firefoxAddonUrl: text("firefox_addon_url"),
  website: text("website"),
  url: text("url"),
  privacyPolicy: text("privacy_policy"),
  supportSite: text("support_site"),
  isActive: boolean("is_active").notNull().default(true),
  isNew: boolean("is_new").notNull().default(false),
  isPopular: boolean("is_popular").notNull().default(false),
  rating: numeric("rating"),
  ratingCount: integer("rating_count"),
  users: text("users"),
  version: text("version"),
  updated: text("updated"),
  size: text("size"),
  developer: jsonb("developer").$type<{
    name?: string;
    website?: string;
    email?: string;
  } | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CategoryRow = typeof categories.$inferSelect;
export type TopicRow = typeof topics.$inferSelect;
export type ExtensionRow = typeof extensions.$inferSelect;
