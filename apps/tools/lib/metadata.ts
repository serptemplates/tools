import type { Metadata } from "next";

import toolsData from "@serp-tools/app-core/data/tools.json";
import {
  getCategoryPageContent,
  getCategoryPagePath,
} from "@/lib/tool-directory";
import {
  buildOperationFallbackDescription,
  isToolOperation,
} from "@/lib/tool-operations";
import { toolContent } from "@/lib/tool-content";
import { normalizePath } from "@/lib/sitemap";
import type { Tool } from "@/types";

const tools = toolsData as Tool[];

const buildFallbackDescription = (tool: Tool) => {
  return buildOperationFallbackDescription({
    operation: tool.operation,
    from: tool.from,
    to: tool.to,
    description: tool.description,
  });
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

export function buildCategoryMetadata(categoryName: string): Metadata {
  if (!isToolOperation(categoryName)) {
    return {};
  }

  const content = getCategoryPageContent(categoryName);
  const canonical = normalizePath(getCategoryPagePath(categoryName));

  return {
    title: `${content.title} | SERP Tools`,
    description: content.description,
    alternates: { canonical },
    openGraph: {
      title: content.title,
      description: content.description,
      type: "website",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: content.title,
      description: content.description,
    },
  };
}

export function buildCategoriesIndexMetadata(): Metadata {
  const title = "Categories";
  const description = "Browse every SERP Tools category and jump into the tools available in each one.";
  const canonical = normalizePath("/categories/");

  return {
    title: `${title} | SERP Tools`,
    description,
    alternates: { canonical },
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
