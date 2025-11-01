"use client";

import { useMemo, useState } from "react";
import type { ExtensionRecord, CategoryRecord } from "@serp-extensions/app-core/lib/catalog";
import { Button } from "@serp-extensions/ui/components/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ExtensionsCatalog } from "@/components/ExtensionsCatalog";
import { ToolsLinkHub } from "@/components/sections/ToolsLinkHub";

type HomePageClientProps = {
  extensions: ExtensionRecord[];
  categories: Array<CategoryRecord & { count: number }>;
};

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
  const [filteredExtensions, setFilteredExtensions] = useState<ExtensionRecord[]>(extensions);

  const categoryFilters = useMemo(
    () =>
      categories
        .map((category) => ({
          id: category.slug,
          name: formatCategoryName(category),
          count: category.count,
        }))
        .filter((category) => category.count > 0)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  const simplifiedExtensions = useMemo(
    () =>
      filteredExtensions.map((extension) => ({
        id: extension.id,
        slug: extension.slug,
        name: extension.name,
        category: extension.category,
      })),
    [filteredExtensions]
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
        <ExtensionsCatalog
          extensions={extensions}
          categories={categoryFilters}
          onFilteredExtensionsChange={setFilteredExtensions}
        />
      </section>

      <ToolsLinkHub extensions={simplifiedExtensions} />
    </main>
  );
}
