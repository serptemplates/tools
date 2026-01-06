import { Card } from "@serp-tools/ui/components/card";
import relatedAppsData from "@serp-tools/app-core/data/related-apps.json";

type RelatedApp = {
  id: string;
  name: string;
  url: string;
  formats: string[];
  description?: string;
};

type RelatedAppsSectionProps = {
  currentFrom: string;
  currentTo: string;
};

const normalizeFormat = (format: string) => format.trim().toLowerCase();

export function RelatedAppsSection({ currentFrom, currentTo }: RelatedAppsSectionProps) {
  const formatSet = new Set(
    [currentFrom, currentTo].filter(Boolean).map(format => normalizeFormat(format))
  );

  const relatedApps = (relatedAppsData as RelatedApp[]).filter(app =>
    app.formats.some(format => formatSet.has(normalizeFormat(format)))
  );

  const uniqueApps = Array.from(new Map(relatedApps.map(app => [app.id, app])).values());

  if (uniqueApps.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
          Related Apps
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {uniqueApps.map((app) => (
            <a key={app.id} href={app.url} target="_blank" rel="noreferrer">
              <Card className="p-3 hover:shadow-md transition-all duration-200 cursor-pointer border-gray-200 hover:border-blue-300 hover:bg-blue-50/50">
                <h4 className="font-semibold text-sm text-gray-900 mb-0.5 truncate">
                  {app.name}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-1">
                  {app.description ?? app.url}
                </p>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
