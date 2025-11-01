"use client";

import { useEffect, useMemo, useState } from "react";
import type { ExtensionRecord } from "@serp-extensions/app-core/lib/catalog";

import { ToolCard } from "@/components/ToolCard";
import { ToolsSearchBar } from "@/components/ToolsSearchBar";
import { mapExtensionToToolCard } from "@/lib/tool-card";

type CategoryFilter = {
  id: string;
  name: string;
  count: number;
};

type ExtensionsCatalogProps = {
  extensions: ExtensionRecord[];
  categories: CategoryFilter[];
  showCategoryFilter?: boolean;
  initialSelectedCategory?: string;
  emptyStateMessage?: string;
  onFilteredExtensionsChange?: (extensions: ExtensionRecord[]) => void;
};

export function ExtensionsCatalog({
  extensions,
  categories,
  showCategoryFilter = true,
  initialSelectedCategory = "all",
  emptyStateMessage = "No extensions match your search yet. Try another keyword or category.",
  onFilteredExtensionsChange,
}: ExtensionsCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialSelectedCategory);
  const [searchQuery, setSearchQuery] = useState("");

  const entries = useMemo(
    () =>
      extensions.map((extension) => ({
        extension,
        tool: mapExtensionToToolCard(extension),
      })),
    [extensions]
  );

  const categoryFilters = useMemo(() => {
    const items = categories
      .map((category) => ({
        id: category.id,
        name: category.name,
        count: category.count,
      }))
      .filter((category) => category.count > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    const total = entries.length;

    return [{ id: "all", name: "All Extensions", count: total }, ...items];
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

  useEffect(() => {
    onFilteredExtensionsChange?.(filteredEntries.map(({ extension }) => extension));
  }, [filteredEntries, onFilteredExtensionsChange]);

  const filteredTools = useMemo(
    () => filteredEntries.map((entry) => entry.tool),
    [filteredEntries]
  );

  return (
    <>
      <ToolsSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categories={categoryFilters}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        enableCategoryFilter={showCategoryFilter}
      />

      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredTools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-lg text-muted-foreground">{emptyStateMessage}</p>
        </div>
      )}
    </>
  );
}
