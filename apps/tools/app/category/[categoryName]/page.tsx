import { notFound } from "next/navigation";

import toolsData from "@serp-tools/app-core/data/tools.json";
import CategoryPageTemplate from "@/components/CategoryPageTemplate";
import { buildCategoryMetadata } from "@/lib/metadata";
import {
  buildToolDirectoryEntries,
  getAvailableToolOperations,
  getToolDirectoryCategories,
  getToolsForDirectoryCategory,
} from "@/lib/tool-directory";
import { isToolOperation } from "@/lib/tool-operations";
import type { Tool } from "@/types";

const tools = buildToolDirectoryEntries(toolsData as Tool[]);
const categories = getToolDirectoryCategories(tools);
const availableOperations = getAvailableToolOperations(toolsData as Tool[]);

type PageProps = {
  params: Promise<{ categoryName: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return availableOperations.map((categoryName) => ({ categoryName }));
}

export async function generateMetadata({ params }: PageProps) {
  const { categoryName } = await params;
  return buildCategoryMetadata(categoryName);
}

export default async function Page({ params }: PageProps) {
  const { categoryName } = await params;
  if (!isToolOperation(categoryName)) {
    return notFound();
  }

  const activeCategory = categories.find((category) => category.id === categoryName);
  if (!activeCategory) {
    return notFound();
  }

  const categoryTools = getToolsForDirectoryCategory(tools, categoryName);
  if (categoryTools.length === 0) {
    return notFound();
  }

  return (
    <CategoryPageTemplate
      activeCategory={activeCategory}
      categories={categories}
      tools={categoryTools}
    />
  );
}
