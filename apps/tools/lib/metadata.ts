import type { Metadata } from "next";

import toolsData from "@serp-tools/app-core/data/tools.json";
import { toolContent } from "@/lib/tool-content";
import { normalizePath } from "@/lib/sitemap";
import type { Tool } from "@/types";

const tools = toolsData as Tool[];

const formatLabel = (value: string) => {
  const upper = value.toUpperCase();
  if (upper === "JPG") return "JPG";
  if (upper === "SVG") return "SVG";
  return upper;
};

const buildFallbackDescription = (tool: Tool) => {
  const fromLabel = formatLabel(tool.from ?? "");
  const toLabel = formatLabel(tool.to ?? "");
  if (fromLabel && toLabel) {
    return `Convert ${fromLabel} to ${toLabel} online.`;
  }
  return tool.description ?? "Online file converter from SERP Tools.";
};

export function buildToolMetadata(toolId: string): Metadata {
  const tool = tools.find((item) => item.id === toolId && item.isActive);
  if (!tool) {
    return {};
  }

  const content = toolContent[toolId];
  const title = content?.tool.title ?? tool.name;
  const description = content?.tool.subtitle ?? tool.description ?? buildFallbackDescription(tool);
  const canonical = tool.route ? normalizePath(tool.route) : undefined;

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
