import Link from "next/link";
import { Card } from "@serp-tools/ui/components/card";
import toolsData from "@serp-tools/app-core/data/tools.json";

type Tool = {
  id: string;
  name: string;
  description: string;
  route: string;
  from?: string;
  to?: string;
  isActive: boolean;
};

type RelatedToolEntry = {
  toolId?: string;
  href?: string;
  title: string;
  description?: string;
};

type RelatedToolsSectionProps = {
  currentFrom?: string;
  currentTo?: string;
  currentRoute?: string; // to exclude current tool
  currentToolId?: string;
  relatedTools?: RelatedToolEntry[];
};

export function RelatedToolsSection({
  currentFrom,
  currentTo,
  currentRoute,
  currentToolId,
  relatedTools,
}: RelatedToolsSectionProps) {
  const allTools = (toolsData as any[]).filter(tool => tool.isActive);
  const toolsById = new Map(allTools.map((tool) => [tool.id, tool as Tool]));
  const toolsByRoute = new Map(allTools.map((tool) => [tool.route, tool as Tool]));

  const resolvedFromContent = (relatedTools ?? [])
    .map((tool, index) => {
      if (tool.toolId) {
        const resolved = toolsById.get(tool.toolId);
        if (!resolved) return null;
        return {
          ...resolved,
          description: tool.description ?? resolved.description,
          name: tool.title || resolved.name,
        };
      }
      if (tool.href) {
        if (tool.href.startsWith("/")) {
          const resolved = toolsByRoute.get(tool.href);
          if (!resolved) return null;
          return {
            ...resolved,
            description: tool.description ?? resolved.description,
            name: tool.title || resolved.name,
          };
        }
        return {
          id: tool.toolId ?? `related-${index}`,
          name: tool.title,
          description: tool.description ?? "",
          route: tool.href,
          isActive: true,
        } as Tool;
      }
      return null;
    })
    .filter(Boolean) as Tool[];

  const curatedTools = resolvedFromContent.filter((tool) =>
    (currentToolId ? tool.id !== currentToolId : true) &&
    (currentRoute ? tool.route !== currentRoute : true)
  );

  // Find all tools that involve either format (combining both)
  const relatedToolsFallback = currentFrom && currentTo
    ? allTools.filter(tool =>
        ((tool.from === currentFrom || tool.to === currentFrom ||
          tool.from === currentTo || tool.to === currentTo)) &&
        (currentRoute ? tool.route !== currentRoute : true) &&
        (currentToolId ? tool.id !== currentToolId : true)
      )
    : [];

  // Remove duplicates
  const toolsToShow = curatedTools.length ? curatedTools : relatedToolsFallback;
  const uniqueTools = Array.from(new Map(toolsToShow.map(tool => [tool.id || tool.route, tool])).values());

  // If no related tools, don't render the section
  if (uniqueTools.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
          Related Tools
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {uniqueTools.map((tool) => (
            <Link key={tool.id} href={tool.route}>
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
