"use client";
import Link from "next/link";
import toolsData from '@serp-tools/app-core/data/tools.json';

type ToolsLinkHubProps = {
  relatedTools?: Array<{
    title: string;
    href: string;
  }>;
};

interface Tool {
  id: string;
  name: string;
  route: string;
  tags?: string[];
  priority?: number;
  isActive: boolean;
  from?: string;
  to?: string;
}

// Define better categories based on format types
const CATEGORY_MAP: Record<string, string> = {
  'heic': 'Image Formats',
  'jpg': 'Image Formats',
  'jpeg': 'Image Formats',
  'png': 'Image Formats',
  'webp': 'Image Formats',
  'gif': 'Image Formats',
  'bmp': 'Image Formats',
  'svg': 'Image Formats',
  'ico': 'Image Formats',
  'tiff': 'Image Formats',

  'mp4': 'Video Formats',
  'mkv': 'Video Formats',
  'avi': 'Video Formats',
  'mov': 'Video Formats',
  'webm': 'Video Formats',
  'flv': 'Video Formats',
  'wmv': 'Video Formats',
  'mpeg': 'Video Formats',
  'm4v': 'Video Formats',
  'ts': 'Video Formats',

  'mp3': 'Audio Formats',
  'wav': 'Audio Formats',
  'ogg': 'Audio Formats',
  'aac': 'Audio Formats',
  'm4a': 'Audio Formats',
  'flac': 'Audio Formats',
  'opus': 'Audio Formats',

  'pdf': 'Document Formats',
  'doc': 'Document Formats',
  'docx': 'Document Formats',
  'txt': 'Document Formats',
  'rtf': 'Document Formats',

  'csv': 'Data Formats',
  'json': 'Data Formats',
  'xml': 'Data Formats',
  'yaml': 'Data Formats',

  'zip': 'Archive Formats',
  'rar': 'Archive Formats',
  '7z': 'Archive Formats',
  'tar': 'Archive Formats',
  'gz': 'Archive Formats',
};

// Generate dynamic tools from tools.json
function generateAllTools() {
  const allTools = (toolsData as Tool[]).filter(tool => tool.isActive);

  // Group tools by smart categories
  const groupedTools = allTools.reduce((groups, tool) => {
    // Try to categorize based on from/to formats
    let category = 'Other Tools';

    // Check primary tag first
    const primaryTag = tool.tags?.[0];
    if (primaryTag && CATEGORY_MAP[primaryTag]) {
      category = CATEGORY_MAP[primaryTag];
    }
    // Check from format
    else if (tool.from && CATEGORY_MAP[tool.from]) {
      category = CATEGORY_MAP[tool.from] ?? category;
    }
    // Check to format
    else if (tool.to && CATEGORY_MAP[tool.to]) {
      category = CATEGORY_MAP[tool.to] ?? category;
    }
    // Check any tag for categorization
    else if (tool.tags) {
      for (const tag of tool.tags) {
        if (CATEGORY_MAP[tag]) {
          category = CATEGORY_MAP[tag];
          break;
        }
      }
    }

    const categoryGroup = groups[category] || [];
    categoryGroup.push({
      title: tool.name,
      href: tool.route
    });
    groups[category] = categoryGroup;
    return groups;
  }, {} as Record<string, Array<{ title: string; href: string }>>);

  // Sort tools within each group by priority (higher first) then name
  Object.values(groupedTools).forEach(tools => {
    tools.sort((a, b) => {
      const toolA = allTools.find(t => t.route === a.href);
      const toolB = allTools.find(t => t.route === b.href);

      const priorityA = toolA?.priority || 0;
      const priorityB = toolB?.priority || 0;

      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      return a.title.localeCompare(b.title);
    });
  });

  // Sort categories to put most important ones first
  const categoryOrder = [
    'Image Formats',
    'Video Formats',
    'Audio Formats',
    'Document Formats',
    'Data Formats',
    'Archive Formats',
    'Other Tools'
  ];

  const sortedGroups: Record<string, Array<{ title: string; href: string }>> = {};
  categoryOrder.forEach(cat => {
    if (groupedTools[cat]) {
      sortedGroups[cat] = groupedTools[cat];
    }
  });

  // Add any remaining categories
  Object.keys(groupedTools).forEach(cat => {
    if (!sortedGroups[cat] && groupedTools[cat]) {
      sortedGroups[cat] = groupedTools[cat];
    }
  });

  return sortedGroups;
}

export function ToolsLinkHub({ relatedTools }: ToolsLinkHubProps) {
  const allTools = generateAllTools();

  return (
    <section className="py-16 bg-gradient-to-b from-gray-100 to-gray-50 border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-2xl font-bold text-center mb-10 text-gray-900">
          All Conversion Tools
        </h2>

        <div className="space-y-12">
          {Object.entries(allTools).map(([category, tools]) => {
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