"use client";

import BatchHeroConverter from "@/components/BatchHeroConverter";
import { VideoSection } from "@/components/sections/VideoSection";
import { AboutFormatsSection } from "@/components/sections/AboutFormatsSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { ToolsLinkHub } from "@/components/sections/ToolsLinkHub";
import { BlogSection } from "@/components/sections/BlogSection";
import { ChangelogSection } from "@/components/sections/ChangelogSection";
import { toolContent } from '@/lib/tool-content';

export default function Page() {
  const content = toolContent["batch-compress-png"];

  if (!content) {
    return <div>Tool not found</div>;
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section with Batch Tool */}
      <BatchHeroConverter
        toolId={content.tool.id}
        title={content.tool.title}
        subtitle={content.tool.subtitle}
        from={content.tool.from}
        to={content.tool.to}
        accept={content.tool.accept}
      />

      {/* About the Formats Section */}
      {content.aboutSection && (
        <AboutFormatsSection
          fromFormat={content.aboutSection.fromFormat}
          toFormat={content.aboutSection.toFormat}
        />
      )}

      {/* Video Section */}
      {content.videoSection && <VideoSection embedId={content.videoSection.embedId} />}

      {/* FAQs Section */}
      {content.faqs && <FAQSection faqs={content.faqs} />}

      {/* Blog Articles Section */}
      {content.blogPosts && <BlogSection blogPosts={content.blogPosts} />}

      {/* Changelog Section */}
      {content.changelog && <ChangelogSection changelog={content.changelog} />}

      {/* Related Tools Link Hub */}
      <ToolsLinkHub relatedTools={content.relatedTools} />
    </main>
  );
}
