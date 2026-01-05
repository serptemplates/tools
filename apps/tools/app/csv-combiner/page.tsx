"use client";

import CsvCombiner from "@/components/CsvCombiner";
import { AboutFormatsSection } from "@/components/sections/AboutFormatsSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { BlogSection } from "@/components/sections/BlogSection";
import { ChangelogSection } from "@/components/sections/ChangelogSection";
import { ToolsLinkHub } from "@/components/sections/ToolsLinkHub";
import { VideoSection } from "@/components/sections/VideoSection";
import { toolContent } from "@/lib/tool-content";

export default function Page() {
  const content = toolContent["csv-combiner"];

  if (!content) {
    return <div>Tool not found</div>;
  }

  return (
    <main className="min-h-screen bg-background">
      <CsvCombiner toolId={content.tool.id} />

      {content.aboutSection && (
        <AboutFormatsSection
          fromFormat={content.aboutSection.fromFormat}
          toFormat={content.aboutSection.toFormat}
        />
      )}

      {content.videoSection && <VideoSection embedId={content.videoSection.embedId} />}

      {content.faqs && <FAQSection faqs={content.faqs} />}

      {content.blogPosts && <BlogSection blogPosts={content.blogPosts} />}

      {content.changelog && <ChangelogSection changelog={content.changelog} />}

      <ToolsLinkHub relatedTools={content.relatedTools} />
    </main>
  );
}
