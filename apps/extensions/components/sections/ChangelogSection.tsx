import { Badge } from "@serp-extensions/ui/components/badge";
import { Card } from "@serp-extensions/ui/components/card";
import {
  Sparkles,
  Zap,
  Bug,
  AlertCircle,
  CheckCircle,
  Info,
  GitCommit,
  Calendar
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ChangeType = 'feature' | 'improvement' | 'fix' | 'breaking' | 'deprecation' | 'performance' | 'security' | 'other';

type ChangelogEntry = {
  date: string;
  version?: string;
  changes: string[] | { text: string; type?: ChangeType }[];
};

type ChangelogSectionProps = {
  changelog: ChangelogEntry[];
};

// Icon and color mapping for change types
const changeTypeConfig: Record<ChangeType, { icon: LucideIcon; color: string; bgColor: string; label: string }> = {
  feature: {
    icon: Sparkles,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'New'
  },
  improvement: {
    icon: Zap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Improved'
  },
  fix: {
    icon: Bug,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Fixed'
  },
  breaking: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'Breaking'
  },
  deprecation: {
    icon: Info,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    label: 'Deprecated'
  },
  performance: {
    icon: Zap,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    label: 'Performance'
  },
  security: {
    icon: CheckCircle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    label: 'Security'
  },
  other: {
    icon: GitCommit,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    label: 'Update'
  }
};

// Function to detect change type from text
function detectChangeType(text: string): ChangeType {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('add') || lowerText.includes('new') || lowerText.includes('launch')) return 'feature';
  if (lowerText.includes('fix') || lowerText.includes('resolve') || lowerText.includes('correct')) return 'fix';
  if (lowerText.includes('improve') || lowerText.includes('enhance') || lowerText.includes('optimize')) return 'improvement';
  if (lowerText.includes('breaking') || lowerText.includes('remove')) return 'breaking';
  if (lowerText.includes('deprecat')) return 'deprecation';
  if (lowerText.includes('performance') || lowerText.includes('speed') || lowerText.includes('faster')) return 'performance';
  if (lowerText.includes('security') || lowerText.includes('vulnerab')) return 'security';
  return 'other';
}

export function ChangelogSection({ changelog }: ChangelogSectionProps) {
  if (!changelog || changelog.length === 0) return null;

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="outline">
            <Calendar className="mr-1 h-3 w-3" />
            Updates
          </Badge>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Changelog
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Track the latest updates, improvements, and fixes to our tools
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-gray-200 via-gray-200 to-transparent" />

          {/* Entries */}
          <div className="space-y-12">
            {changelog.map((entry, idx) => {
              // Parse date to get month and year
              const date = new Date(entry.date);
              const month = date.toLocaleDateString('en-US', { month: 'short' });
              const year = date.getFullYear();
              const day = date.getDate();

              return (
                <div key={idx} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute left-8 w-3 h-3 bg-white border-2 border-gray-300 rounded-full -translate-x-1/2" />

                  {/* Content */}
                  <div className="ml-20">
                    {/* Date and version */}
                    <div className="flex items-center gap-3 mb-4">
                      <time className="text-sm font-semibold text-gray-900">
                        {month} {day}, {year}
                      </time>
                      {entry.version && (
                        <Badge variant="secondary" className="text-xs">
                          v{entry.version}
                        </Badge>
                      )}
                    </div>

                    {/* Changes card */}
                    <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
                      <div className="space-y-3">
                        {entry.changes.map((change, changeIdx) => {
                          const changeText = typeof change === 'string' ? change : change.text;
                          const changeType = typeof change === 'string'
                            ? detectChangeType(change)
                            : (change.type || detectChangeType(change.text));

                          const config = changeTypeConfig[changeType];
                          const Icon = config.icon;

                          return (
                            <div
                              key={changeIdx}
                              className="flex items-start gap-3 group"
                            >
                              {/* Icon with background */}
                              <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <Icon className={`w-4 h-4 ${config.color}`} />
                              </div>

                              {/* Change text */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs px-2 py-0 ${config.color} border-current`}
                                  >
                                    {config.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {changeText}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>

          {/* End of timeline indicator */}
          <div className="absolute left-8 bottom-0 w-3 h-3 bg-gradient-to-b from-gray-200 to-transparent rounded-full -translate-x-1/2" />
        </div>

        {/* View all updates link (optional) */}
        <div className="text-center mt-12">
          <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            End of changelog
          </button>
        </div>
      </div>
    </section>
  );
}