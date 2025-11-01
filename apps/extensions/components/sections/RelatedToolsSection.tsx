"use client";

import { useMemo } from "react";
import Link from "next/link";
import extensionsData from "@serp-extensions/app-core/data/extensions.json";
import type { ExtensionRecord } from "@serp-extensions/app-core/lib/catalog";

import { ToolCard } from "@/components/ToolCard";
import { mapExtensionToToolCard } from "@/lib/tool-card";

type RelatedToolsSectionProps = {
  currentPath?: string;
};

export function RelatedToolsSection({ currentPath }: RelatedToolsSectionProps) {
  const allTools = useMemo(
    () => (extensionsData as ExtensionRecord[]).filter((tool) => tool.isActive),
    []
  );

  // Show up to 5 random other extensions
  const relatedTools = useMemo(() => {
    return allTools
      .filter((tool) => {
        if (!currentPath) return true;
        const extensionPath = `/extensions/${tool.slug}/${tool.id}`;
        return extensionPath !== currentPath;
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);
  }, [allTools, currentPath]);

  // If no related tools, don't render the section
  if (relatedTools.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-gray-200 bg-gray-50 py-16">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-slate-900">Related Extensions</h2>
          <Link
            href="/categories"
            className="hidden text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 transition-colors hover:text-slate-700 md:inline"
          >
            Browse all
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {relatedTools.map((tool) => (
            <ToolCard key={tool.id} tool={mapExtensionToToolCard(tool)} />
          ))}
        </div>

        <div className="mt-10 text-center md:hidden">
          <Link
            href="/categories"
            className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
          >
            Browse all extensions →
          </Link>
        </div>
      </div>
    </section>
  );
}