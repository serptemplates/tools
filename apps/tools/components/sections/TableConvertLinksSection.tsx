import Link from "next/link";
import { Card } from "@serp-tools/ui/components/card";

import { formatTableLabel } from "@/lib/table-convert";
import { TABLE_CONVERT_PAGES } from "@/lib/table-convert-pages";

type TableConvertLinksSectionProps = {
  currentSlug?: string;
  title?: string;
};

export function TableConvertLinksSection({
  currentSlug,
  title = "More Table Converters",
}: TableConvertLinksSectionProps) {
  const pages = TABLE_CONVERT_PAGES.filter((page) => page.slug !== currentSlug);

  if (!pages.length) return null;

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">{title}</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {pages.map((page) => {
            const fromLabel = formatTableLabel(page.from);
            const toLabel = formatTableLabel(page.to);
            return (
              <Link key={page.slug} href={`/${page.slug}`}>
                <Card className="p-3 hover:shadow-md transition-all duration-200 cursor-pointer border-gray-200 hover:border-blue-300 hover:bg-blue-50/50">
                  <h4 className="font-semibold text-sm text-gray-900 mb-0.5 truncate">
                    {fromLabel} to {toLabel}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-1">{page.title}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
