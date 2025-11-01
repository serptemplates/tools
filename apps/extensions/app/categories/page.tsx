import { Badge } from "@serp-extensions/ui/components/badge";
import {
  getCategoriesWithCounts,
  type CategoryRecord,
} from "@serp-extensions/app-core/lib/catalog";

import { ToolCard } from "@/components/ToolCard";
import type { ToolCardData } from "@/lib/tool-card";

function resolveIconName(name?: string): string {
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return "Folder";
  }

  return name;
}

function formatCategoryName(category: CategoryRecord): string {
  if (category.name) return category.name;

  return category.slug
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts();
  const activeCategories = categories.filter((category) => category.count > 0);
  const totalActiveExtensions = categories.reduce((acc, category) => acc + category.count, 0);
  const sortedByPopularity = [...activeCategories].sort((a, b) => b.count - a.count);
  const popularCategories = sortedByPopularity.slice(0, 6);
  const popularCategorySlugs = new Set(popularCategories.map((category) => category.slug));

  const categoryCards: ToolCardData[] = activeCategories.map((category) => {
    const iconName = resolveIconName(category.icon);
    const name = formatCategoryName(category);
    const extensionCountLabel = `${category.count} ${category.count === 1 ? "extension" : "extensions"}`;

    return {
      id: category.id ?? category.slug,
      name,
      description:
        category.description ?? `Explore ${extensionCountLabel} curated for ${name.toLowerCase()} workflows.`,
      href: `/categories/${category.slug}`,
      iconName,
      users: extensionCountLabel,
      isPopular: popularCategorySlugs.has(category.slug),
    };
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      <section className="border-b bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <Badge variant="outline" className="uppercase tracking-wide text-xs">
                Browse by category
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                Find the right extension for every workflow
              </h1>
              <p className="text-lg text-muted-foreground">
                Explore curated collections of browser extensions. Each category is hand-labelled, so you can jump straight to the tools that fit your browsing habits.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <div>
                <span className="text-3xl font-semibold text-foreground block">{activeCategories.length}</span>
                Categories to explore
              </div>
              <div>
                <span className="text-3xl font-semibold text-foreground block">{totalActiveExtensions}</span>
                Active extensions tracked
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold">All categories</h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Choose a category to see the highest-rated extensions, quick stats, and curated recommendations.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {categoryCards.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
