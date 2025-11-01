"use client";
import Link from "next/link";
import extensionsData from '@serp-extensions/app-core/data/extensions.json';

type ExtensionSummary = {
  id: string;
  slug: string;
  name: string;
  category?: string;
  chromeStoreUrl?: string;
  url?: string;
  isActive?: boolean;
};

type ToolsLinkHubProps = {
  extensions?: ExtensionSummary[];
};

type CategoryGroup = Record<string, Array<{ title: string; href: string }>>;

function formatCategoryLabel(value?: string): string {
  if (!value) {
    return "Other Extensions";
  }

  return value
    .split(/[-_]/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function buildGroups(source: ExtensionSummary[]): CategoryGroup {
  return source.reduce<CategoryGroup>((groups, extension) => {
    const key = formatCategoryLabel(extension.category);
    const next = groups[key] ?? [];
    const href = `/extensions/${extension.slug}/${extension.id}`;

    next.push({
      title: extension.name,
      href: extension.chromeStoreUrl ?? extension.url ?? href,
    });

    groups[key] = next;
    return groups;
  }, {});
}

function sortGroups(groups: CategoryGroup): CategoryGroup {
  const sortedEntries = Object.entries(groups)
    .map(([category, items]) => ({
      category,
      items: [...items].sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .sort((a, b) => a.category.localeCompare(b.category));

  return sortedEntries.reduce<CategoryGroup>((acc, entry) => {
    acc[entry.category] = entry.items;
    return acc;
  }, {});
}

export function ToolsLinkHub({ extensions }: ToolsLinkHubProps) {
  const dataset = extensions && extensions.length > 0
    ? extensions
    : ((extensionsData as ExtensionSummary[]).filter((extension) => extension.isActive !== false));

  const grouped = sortGroups(buildGroups(dataset));

  return (
    <section className="py-16 bg-gradient-to-b from-gray-100 to-gray-50 border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-2xl font-bold text-center mb-10 text-gray-900">
          Extensions by Category
        </h2>

        <div className="space-y-12">
          {Object.entries(grouped).map(([category, tools]) => {
            // For categories with many tools, use a more compact multi-column layout
            const isLargeCategory = tools.length > 15;

            return (
              <div key={category} className="border-b border-gray-200 pb-8 last:border-0">
                <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wider mb-4">
                  {category} ({tools.length})
                </h3>

                {isLargeCategory ? (
                  // Multi-column layout for large categories
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-2">
                    {tools.map((tool) => (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        className="text-sm text-gray-700 hover:text-blue-600 transition-colors duration-150 hover:underline block py-1"
                      >
                        {tool.title}
                      </Link>
                    ))}
                  </div>
                ) : (
                  // Inline layout for smaller categories
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {tools.map((tool, index) => (
                      <span key={tool.href} className="flex items-center">
                        <Link
                          href={tool.href}
                          className="text-sm text-gray-700 hover:text-blue-600 transition-colors duration-150 hover:underline"
                        >
                          {tool.title}
                        </Link>
                        {index < tools.length - 1 && (
                          <span className="text-gray-400 ml-6">•</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Can&apos;t find what you&apos;re looking for?
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              Browse All Tools
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}