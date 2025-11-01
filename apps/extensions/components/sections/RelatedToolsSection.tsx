import Link from "next/link";
import { Card } from "@serp-extensions/ui/components/card";
import extensionsData from "@serp-extensions/app-core/data/extensions.json";

type Tool = {
  id: string;
  name: string;
  description: string;
  url?: string;
  chromeStoreUrl?: string;
  category?: string;
  isActive: boolean;
};

type RelatedToolsSectionProps = {
  currentFrom: string;
  currentTo: string;
  currentPath: string; // to exclude current tool
};

export function RelatedToolsSection({ currentFrom, currentTo, currentPath }: RelatedToolsSectionProps) {
  const allTools = (extensionsData as any[]).filter(tool => tool.isActive);

  // Show up to 5 random other extensions
  const relatedTools = allTools
    .filter(tool => tool.chromeStoreUrl !== currentPath && tool.url !== currentPath)
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);

  // If no related tools, don't render the section
  if (relatedTools.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
          Related Extensions
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {relatedTools.map((tool) => (
            <Link key={tool.id} href={`/extensions/${tool.slug}/${tool.id}`}>
              <Card className="p-3 hover:shadow-md transition-all duration-200 cursor-pointer border-gray-200 hover:border-blue-300 hover:bg-blue-50/50">
                <h4 className="font-semibold text-sm text-gray-900 mb-0.5 truncate">
                  {tool.name}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-1">
                  {tool.description}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}