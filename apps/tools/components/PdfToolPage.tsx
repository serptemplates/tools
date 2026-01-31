import { notFound } from "next/navigation";

import toolsData from "@serp-tools/app-core/data/tools.json";
import PdfTool from "@/components/PdfTool";
import { BlogSection } from "@/components/sections/BlogSection";
import { ChangelogSection } from "@/components/sections/ChangelogSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { HowToSection } from "@/components/sections/HowToSection";
import { InfoArticleSection } from "@/components/sections/InfoArticleSection";
import { ToolsLinkHub } from "@/components/sections/ToolsLinkHub";
import { toolContent } from "@/lib/tool-content";
import { buildHowToSection, buildInfoArticleSection } from "@/lib/tool-sections";
import type { FAQ, Tool, ToolContent } from "@/types";

const tools = toolsData as Tool[];

type PdfToolPageProps = {
  toolId: string;
};

const buildDefaultFaqs = (tool: Tool): FAQ[] => {
  if (tool.operation === "edit") {
    return [
      {
        question: "What edits are supported?",
        answer:
          "Use the built-in toolbar to highlight, draw, add text or shapes, and export an updated PDF.",
      },
      {
        question: "Are my PDFs uploaded anywhere?",
        answer: "No. Files are processed locally in your browser, so your PDFs stay on your device.",
      },
      {
        question: "Can I keep the original PDF?",
        answer: "Yes. The original file stays unchanged and you download a new edited copy.",
      },
    ];
  }

  return [
    {
      question: "Can I read multi-page PDFs?",
      answer: "Yes. Use the viewer toolbar and thumbnails to move through your document.",
    },
    {
      question: "Are my PDFs uploaded anywhere?",
      answer: "No. Files are processed locally in your browser, so your PDFs stay on your device.",
    },
    {
      question: "Does this work on mobile?",
      answer: "Yes. The viewer works on modern mobile browsers with touch-friendly controls.",
    },
  ];
};

const buildFallbackContent = (tool: Tool): ToolContent => {
  const baseSubtitle =
    tool.description ?? "Open and manage PDF documents directly in your browser.";
  return {
    tool: {
      id: tool.id,
      route: tool.route,
      operation: tool.operation,
      title: tool.name,
      subtitle: baseSubtitle,
      from: tool.from ?? "pdf",
      to: tool.to ?? "pdf",
      accept: ".pdf,application/pdf",
      requiresFFmpeg: tool.requiresFFmpeg,
    },
    howTo: buildHowToSection(tool),
    infoArticle: buildInfoArticleSection(tool),
    faqs: buildDefaultFaqs(tool),
    aboutSection: {
      title: "About PDF files",
      fromFormat: {
        name: "PDF",
        fullName: "Portable Document Format",
        description: "PDFs preserve layout and formatting across devices and platforms.",
      },
      toFormat: {
        name: "PDF",
        fullName: "Portable Document Format",
        description: "Your document stays in PDF format while you view or edit it.",
      },
    },
  };
};

export default function PdfToolPage({ toolId }: PdfToolPageProps) {
  const tool = tools.find((item) => item.id === toolId && item.isActive);

  if (!tool) {
    return notFound();
  }

  const content = toolContent[toolId] ?? buildFallbackContent(tool);
  const howTo = content.howTo ?? buildHowToSection(tool);
  const infoArticle = content.infoArticle ?? buildInfoArticleSection(tool);
  const faqs = content.faqs ?? buildDefaultFaqs(tool);
  const mode = tool.operation === "edit" ? "edit" : "view";

  return (
    <main className="min-h-screen bg-background">
      <PdfTool
        toolId={toolId}
        title={content.tool.title}
        subtitle={content.tool.subtitle}
        mode={mode}
      />

      {howTo && <HowToSection title={howTo.title} intro={howTo.intro} steps={howTo.steps} />}

      {infoArticle && (
        <InfoArticleSection title={infoArticle.title} markdown={infoArticle.markdown} />
      )}

      {faqs && <FAQSection faqs={faqs} />}

      {content.blogPosts && <BlogSection blogPosts={content.blogPosts} />}

      {content.changelog && <ChangelogSection changelog={content.changelog} />}

      <ToolsLinkHub relatedTools={content.relatedTools} />
    </main>
  );
}
