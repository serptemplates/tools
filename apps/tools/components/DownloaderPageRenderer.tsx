import { notFound } from "next/navigation";

import toolsData from "@serp-tools/app-core/data/tools.json";
import DownloaderPageTemplate from "@/components/DownloaderPageTemplate";
import { buildHowToSection, buildInfoArticleSection } from "@/lib/tool-sections";
import { toolContent } from "@/lib/tool-content";
import type { Tool, ToolContent } from "@/types";

const tools = toolsData as Tool[];

type DownloaderPageRendererProps = {
  toolId: string;
};

function getSourceLabel(tool: Tool): string {
  const source = tool.content?.tool.from ?? tool.from ?? tool.name.replace(/ Video Downloader$/, "");
  return source || "video";
}

function buildDownloaderFallbackContent(tool: Tool): ToolContent {
  const sourceLabel = getSourceLabel(tool);
  const subtitle = tool.description || `Download ${sourceLabel} videos from public ${sourceLabel} links.`;
  const isM3U8 = sourceLabel.toUpperCase() === "M3U8";
  const sourceTypeLabel = isM3U8 ? `${sourceLabel} playlist link` : `${sourceLabel} link`;

  return {
    tool: {
      id: tool.id,
      route: tool.route,
      operation: tool.operation,
      title: tool.name,
      subtitle,
      from: sourceTypeLabel,
      to: "Video file",
    },
    howTo: {
      title: `How to download ${sourceLabel} videos`,
      intro: `Follow these steps to save public ${sourceLabel} videos.`,
      steps: [
        `Paste a public ${sourceTypeLabel}.`,
        `Wait while we fetch the ${sourceLabel} video.`,
        "Download the video file to your device.",
      ],
    },
    infoArticle: {
      title: `About ${sourceLabel} video downloads`,
      markdown: `${tool.name} fetches public ${sourceLabel} videos and prepares a downloadable file. It works best with public pages, embeds, or direct media links that load in a normal browser tab.\n\nPrivate, restricted, paywalled, or logged-in content is not supported. If a link fails, confirm the source is public and that the URL loads without signing in.\n\n**Why use this tool**\n\n- Fast paste-and-download flow for public links.\n- Saves a video file you can keep or share.\n- Works in modern desktop and mobile browsers.`,
    },
    faqs: [
      {
        question: `Which ${sourceLabel} links work?`,
        answer: `Public ${sourceLabel} pages, embeds, or direct media links that load without signing in. Private or logged-in content is not supported.`,
      },
      {
        question: "What file type do I get?",
        answer: "Most downloads are saved as MP4 or WebM, depending on what the source provides.",
      },
      {
        question: "Do you store my videos?",
        answer: "No. We fetch the media and stream it to you for download; files are not stored after the request completes.",
      },
      {
        question: `Why did my ${sourceLabel} link fail?`,
        answer: "The source may be private, expired, geo-blocked, or temporarily limiting downloads. Try another public link and confirm it opens without login.",
      },
    ],
    aboutSection: {
      title: `${sourceLabel} video download`,
      fromFormat: {
        name: sourceTypeLabel,
        fullName: `Public ${sourceTypeLabel}`,
        description: `A public ${sourceLabel} URL that points to an accessible video or media stream.`,
      },
      toFormat: {
        name: "Video file",
        fullName: "Downloadable MP4 video file",
        description: `A saved ${sourceLabel} video file you can watch, keep, or share.`,
      },
    },
  };
}

export function DownloaderPageRenderer({
  toolId,
}: DownloaderPageRendererProps) {
  const tool = tools.find((item) => item.id === toolId && item.isActive);

  if (!tool || tool.operation !== "download") {
    return notFound();
  }

  const content = toolContent[toolId] ?? buildDownloaderFallbackContent(tool);
  const resolvedContent: ToolContent = {
    ...content,
    howTo: content.howTo ?? buildHowToSection(tool),
    infoArticle: content.infoArticle ?? buildInfoArticleSection(tool),
  };

  return <DownloaderPageTemplate toolId={toolId} content={resolvedContent} />;
}
