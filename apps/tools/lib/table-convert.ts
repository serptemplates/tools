import type { Metadata } from "next";

import { normalizePath } from "@/lib/sitemap";

const TABLE_CONVERT_LABELS: Record<string, string> = {
  csv: "CSV",
  json: "JSON",
  markdown: "Markdown",
  html: "HTML",
  xml: "XML",
  yaml: "YAML",
  sql: "SQL",
  latex: "LaTeX",
};

export const formatTableLabel = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return TABLE_CONVERT_LABELS[normalized] ?? normalized.toUpperCase();
};

type TableConvertMetadataInput = {
  from: string;
  to: string;
  title: string;
  slug: string;
};

export function buildTableConvertMetadata({
  from,
  to,
  title,
  slug,
}: TableConvertMetadataInput): Metadata {
  const fromLabel = formatTableLabel(from);
  const toLabel = formatTableLabel(to);
  const description = `Convert ${fromLabel} to ${toLabel} online with a live table preview.`;
  const canonical = normalizePath(slug);

  return {
    title: `${title} | SERP Tools`,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
