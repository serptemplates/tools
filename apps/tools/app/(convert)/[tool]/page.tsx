import { notFound } from "next/navigation";

import toolsData from "@serp-tools/app-core/data/tools.json";
import { DownloaderPageRenderer } from "@/components/DownloaderPageRenderer";
import PdfToolPage from "@/components/PdfToolPage";
import ToolPlaceholder from "@/components/ToolPlaceholder";
import { ToolPageRenderer } from "@/components/ToolPageRenderer";
import { buildToolMetadata } from "@/lib/metadata";
import type { Tool } from "@/types";

const tools = toolsData as Tool[];

type PageProps = {
  params: Promise<{ tool: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { tool: toolId } = await params;
  return buildToolMetadata(toolId);
}

export default async function Page({ params }: PageProps) {
  const { tool: toolId } = await params;
  const tool = tools.find((item) => item.id === toolId && item.isActive);

  if (!tool) {
    return notFound();
  }

  if (
    (tool.operation === "convert" || tool.operation === "compress") &&
    tool.from &&
    tool.to
  ) {
    return <ToolPageRenderer toolId={toolId} />;
  }

  if (tool.operation === "download") {
    return <DownloaderPageRenderer toolId={toolId} />;
  }

  if (
    tool.operation === "video-editor" ||
    tool.operation === "image-editor" ||
    tool.operation === "audio-editor"
  ) {
    return <ToolPlaceholder title={tool.name} />;
  }

  if (tool.operation === "view" || tool.operation === "edit") {
    return <PdfToolPage toolId={toolId} />;
  }

  return notFound();
}
