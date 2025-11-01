"use client";

import { useMemo, useState } from "react";
import type { ExtensionRecord, CategoryRecord } from "@serp-extensions/app-core/lib/catalog";
import { Button } from "@serp-extensions/ui/components/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ToolCard } from "@/components/ToolCard";
import { ToolsSearchBar } from "@/components/ToolsSearchBar";
import { ToolsLinkHub } from "@/components/sections/ToolsLinkHub";

type HomePageClientProps = {
  extensions: ExtensionRecord[];
  categories: Array<CategoryRecord & { count: number }>;
};

type ToolCardData = {
  id: string;
  name: string;
  description: string;
  href: string;
  imageUrl?: string;
  rating?: number;
  users?: string;
  isPopular?: boolean;
  isNew?: boolean;
};

function mapExtensionToTool(extension: ExtensionRecord): ToolCardData {
  return {
    id: extension.id,
    name: extension.name,
    description: extension.description,
    href: `/extensions/${extension.slug}/${extension.id}`,
    imageUrl: extension.icon,
    rating: extension.rating,
    users: extension.users,
    isPopular: extension.isPopular,
    isNew: extension.isNew,
  };
}

function formatCategoryName(category: CategoryRecord): string {
  if (category.name) {
    return category.name;
  }

  return category.slug
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function HomePageClient({ extensions, categories }: HomePageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const entries = useMemo(
    () =>
      extensions.map((extension) => ({
        extension,
        tool: mapExtensionToTool(extension),
      })),
    [extensions]
  );

  const tools = useMemo(() => entries.map((entry) => entry.tool), [entries]);

  const categoryFilters = useMemo(() => {
    const items = categories
      .map((category) => ({
        id: category.slug,
        name: formatCategoryName(category),
        count: category.count,
      }))
      .filter((category) => category.count > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    return [{ id: "all", name: "All Extensions", count: entries.length }, ...items];
  }, [categories, entries.length]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return entries.filter(({ extension, tool }) => {
      const matchesCategory =
        selectedCategory === "all" || extension.category === selectedCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        tool.name,
        tool.description,
        ...(extension.tags ?? []),
        ...(extension.topics ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [entries, searchQuery, selectedCategory]);

  const filteredTools = useMemo(
    () => filteredEntries.map((entry) => entry.tool),
    [filteredEntries]
  );

  const simplifiedExtensions = useMemo(
    () =>
      filteredEntries.map(({ extension }) => ({
        id: extension.id,
        slug: extension.slug,
        name: extension.name,
        category: extension.category,
      })),
    [filteredEntries]
  );

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
        <div className="container relative py-16 md:py-24 px-4">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <div>
              <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                SERP Extensions
              </h1>
              <p className="text-lg text-muted-foreground">
                Discover curated browser extensions for productivity, privacy, accessibility, and beyond.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/categories" className="inline-flex items-center gap-2">
                  Explore categories
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/best/dark-mode" className="inline-flex items-center gap-2">
                  See popular picks
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-4xl py-12 px-4">
        <ToolsSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categories={categoryFilters}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">
              No extensions match your search yet. Try another keyword or category.
            </p>
          </div>
        )}
      </section>

      <ToolsLinkHub extensions={simplifiedExtensions} />
    </main>
  );
}
