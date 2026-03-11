"use client";

import { useMemo, useState } from "react";
import { ToolCard } from "@/components/ToolCard";
import { ToolsSearchBar } from "@/components/ToolsSearchBar";
import { ToolsLinkHub } from "@/components/sections/ToolsLinkHub";
import toolsData from "@serp-tools/app-core/data/tools.json";
import {
  buildToolDirectoryEntries,
  getToolDirectoryCategories,
} from "@/lib/tool-directory";
import type { Tool } from "@/types";

type ToolCategory = {
  id: string;
  name: string;
  count: number;
};

const processedTools = buildToolDirectoryEntries(toolsData as Tool[]);
const directoryCategories = getToolDirectoryCategories(processedTools);
const categories: ToolCategory[] = [
  { id: "all", name: "All Tools", count: processedTools.length },
  ...directoryCategories.map((category) => ({
    id: category.id,
    name: category.name,
    count: category.count,
  })),
];


export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const tools = processedTools;

  // Filter tools based on category and search
  const filteredTools = useMemo(() => {
    const search = searchQuery.toLowerCase();
    return tools.filter((tool) => {
      const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
      const matchesSearch = tool.name.toLowerCase().includes(search) ||
        tool.description.toLowerCase().includes(search) ||
        tool.tags.some((tag) => tag.toLowerCase().includes(search));
      return matchesCategory && matchesSearch;
    });
  }, [tools, searchQuery, selectedCategory]);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
        <div className="container relative py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              SERP Tools
            </h1>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container py-12">
        {/* Search and Filter Bar */}
        <ToolsSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        {/* Tools Grid */}
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">
              No tools found matching your criteria.
            </p>
          </div>
        )}
      </section>

      {/* All tools link hub */}
      <ToolsLinkHub />
    </main>
  );
}
