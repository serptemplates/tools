"use client";

import { useMemo, useState } from "react";
import { Button } from "@serp-tools/ui/components/button";
import { ToolCard } from "@/components/ToolCard";
import { ToolsSearchBar } from "@/components/ToolsSearchBar";
import { ToolsLinkHub } from "@/components/sections/ToolsLinkHub";
import {
  ArrowRight,
  Image,
  FileImage,
  FileJson,
  Table,
  Type,
  Video,
  Music
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import toolsData from '@serp-tools/app-core/data/tools.json';

type ToolData = {
  id: string;
  name: string;
  description: string;
  operation?: string;
  route?: string;
  from?: string;
  to?: string;
  isActive?: boolean;
  keywords?: string[];
  isNew?: boolean;
  isPopular?: boolean;
};

type ProcessedTool = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: LucideIcon;
  href: string;
  tags: string[];
  isNew: boolean;
  isPopular: boolean;
};

type ToolCategory = {
  id: string;
  name: string;
  count: number;
};

// Icon mapping for tools
const iconMap: Record<string, LucideIcon> = {
  'heic-to-jpg': Image,
  'heic-to-jpeg': Image,
  'heic-to-png': Image,
  'heic-to-pdf': FileImage,
  'heif-to-jpg': Image,
  'heif-to-png': Image,
  'heif-to-pdf': FileImage,
  'pdf-to-jpg': FileImage,
  'pdf-to-png': FileImage,
  'jpg-to-pdf': FileImage,
  'jpeg-to-pdf': FileImage,
  'jpg-to-png': Image,
  'png-to-jpg': Image,
  'jpeg-to-png': Image,
  'jpeg-to-jpg': Image,
  'webp-to-png': Image,
  'png-to-webp': Image,
  'jpg-to-webp': Image,
  'jpeg-to-webp': Image,
  'gif-to-webp': Image,
  'webp-to-jpg': Image,
  'webp-to-jpeg': Image,
  'avif-to-png': Image,
  'avif-to-jpg': Image,
  'avif-to-jpeg': Image,
  'bmp-to-jpg': Image,
  'bmp-to-png': Image,
  'ico-to-png': Image,
  'gif-to-jpg': Image,
  'gif-to-png': Image,
  'jfif-to-jpg': Image,
  'jfif-to-jpeg': Image,
  'jfif-to-png': Image,
  'jfif-to-pdf': FileImage,
  'cr2-to-jpg': Image,
  'cr3-to-jpg': Image,
  'dng-to-jpg': Image,
  'arw-to-jpg': Image,
  'jpg-to-svg': FileImage,
  'png-optimizer': Image,
  'csv-combiner': Table,
  'json-to-csv': FileJson,
  'character-counter': Type,
  'mkv-to-mp4': Video,
  'mkv-to-webm': Video,
  'mkv-to-avi': Video,
  'mkv-to-mov': Video,
  'mkv-to-gif': Image,
  'mkv-to-mp3': Music,
  'mkv-to-wav': Music,
  'mkv-to-ogg': Music,
  'batch-compress-png': Image,
};

// Process tools from JSON data
const processedTools: ProcessedTool[] = (toolsData as ToolData[])
  .filter((tool) => tool.isActive)
  .map((tool) => {
    const tags = [tool.from, tool.to].filter((tag): tag is string => Boolean(tag));
    return {
    id: tool.id,
    name: tool.name,
    description: tool.description,
    category: tool.operation ?? 'convert',
    icon: iconMap[tool.id] || Image,
    href: tool.route ?? "/",
    tags: tags.concat(tool.keywords ?? []),
    isNew: Boolean(tool.isNew),
    isPopular: Boolean(tool.isPopular),
  };
});


export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const tools = processedTools;
  const categories = useMemo<ToolCategory[]>(() => {
    const categoryMap = new Map<string, ToolCategory>();
    categoryMap.set("all", { id: "all", name: "All Tools", count: tools.length });

    tools.forEach((tool) => {
      if (!categoryMap.has(tool.category)) {
        let catName = tool.category.charAt(0).toUpperCase() + tool.category.slice(1);
        if (tool.category === "combine") catName = "Combine";
        else if (tool.category === "compress") catName = "Compress";
        else if (tool.category === "convert") catName = "Convert";
        else if (tool.category === "download") catName = "Download";
        else if (tool.category === "bulk") catName = "Bulk Operations";

        categoryMap.set(tool.category, {
          id: tool.category,
          name: catName,
          count: 0,
        });
      }
      const entry = categoryMap.get(tool.category);
      if (entry) entry.count += 1;
    });

    return Array.from(categoryMap.values());
  }, [tools]);

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

      {/* CTA Section */}
      <section className="border-t bg-muted/30">
        <div className="container py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold">
              Need a specific tool?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              We&apos;re constantly adding new tools. Let us know what you need!
            </p>
            <Button size="lg" className="group">
              Request a Tool
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer with all tools */}
      <ToolsLinkHub />
    </main>
  );
}
