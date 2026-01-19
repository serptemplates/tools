import { notFound } from "next/navigation";

import ToolPageTemplate from "@/components/ToolPageTemplate";
import { buildHowToSection, buildInfoArticleSection } from "@/lib/tool-sections";
import { toolContent } from "@/lib/tool-content";
import toolsData from "@serp-tools/app-core/data/tools.json";
import type { Tool, ToolContent } from "@/types";

const tools = toolsData as Tool[];

type ToolPageRendererProps = {
  toolId: string;
};

const formatLabel = (value: string) => {
  const upper = value.toUpperCase();
  if (upper === "JPG") return "JPG";
  if (upper === "SVG") return "SVG";
  return upper;
};

const buildAccept = (from: string) => {
  if (from === "pdf") return ".pdf";
  if (from === "jpg") return ".jpg,.jpeg";
  if (from === "jpeg") return ".jpeg,.jpg";
  if (from === "tiff") return ".tif,.tiff";
  return `.${from}`;
};

const buildFallbackContent = (tool: Tool): ToolContent => {
  const fromLabel = formatLabel(tool.from ?? "");
  const toLabel = formatLabel(tool.to ?? "");
  return {
    tool: {
      id: tool.id,
      route: tool.route,
      operation: tool.operation,
      title: tool.name,
      subtitle: tool.description || `Convert ${fromLabel} files to ${toLabel} format in seconds.`,
      from: tool.from ?? "",
      to: tool.to ?? "",
      accept: tool.from ? buildAccept(tool.from) : undefined,
      requiresFFmpeg: tool.requiresFFmpeg,
    },
    aboutSection: {
      title: `${fromLabel} to ${toLabel} conversion`,
      fromFormat: {
        name: fromLabel,
        fullName: `${fromLabel} file`,
        description: `${fromLabel} is a common file format used for storing images. This tool converts ${fromLabel} files directly in your browser.`,
      },
      toFormat: {
        name: toLabel,
        fullName: `${toLabel} file`,
        description: `${toLabel} is a widely supported image format that works across devices and platforms.`,
      },
    },
    faqs: [
      {
        question: `How do I convert ${fromLabel} to ${toLabel}?`,
        answer: "Drop your file in the converter above and download the result once it finishes.",
      },
      {
        question: "Is this conversion private?",
        answer: "Yes. Conversion runs locally in your browser, so your files never leave your device.",
      },
      {
        question: "Do I need to install anything?",
        answer: "No. Everything runs in the browser—just upload and convert.",
      },
    ],
  };
};

export function ToolPageRenderer({ toolId }: ToolPageRendererProps) {
  const tool = tools.find((item) => item.id === toolId && item.isActive);

  if (!tool || !tool.from || !tool.to) {
    return notFound();
  }

  const content = toolContent[toolId] ?? buildFallbackContent(tool);
  const resolvedContent: ToolContent = {
    ...content,
    howTo: content.howTo ?? buildHowToSection(tool),
    infoArticle: content.infoArticle ?? buildInfoArticleSection(tool),
  };

  return (
    <ToolPageTemplate
      tool={resolvedContent.tool}
      videoSection={resolvedContent.videoSection}
      howTo={resolvedContent.howTo}
      infoArticle={resolvedContent.infoArticle}
      faqs={resolvedContent.faqs}
      aboutSection={resolvedContent.aboutSection}
      changelog={resolvedContent.changelog}
      relatedTools={resolvedContent.relatedTools}
      blogPosts={resolvedContent.blogPosts}
    />
  );
}
