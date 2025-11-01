"use client";

import HeroConverter from "@/components/HeroConverter";
import LanderHeroTwoColumn from "@/components/LanderHeroTwoColumn";
import { AboutFormatsSection } from "@/components/sections/AboutFormatsSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { ToolsLinkHub } from "@/components/sections/ToolsLinkHub";
import { BlogSection } from "@/components/sections/BlogSection";
import { ChangelogSection } from "@/components/sections/ChangelogSection";
import { RelatedToolsSection } from "@/components/sections/RelatedToolsSection";
import type {
  ToolInfo,
  VideoSectionData,
  FAQ,
  AboutFormatsSection as AboutFormatsSectionData,
  ChangelogEntry,
  RelatedTool,
  BlogPost
} from "@/types";

type ToolPageProps = {
  tool: ToolInfo;
  videoSection?: VideoSectionData;
  useTwoColumnLayout?: boolean;
  faqs?: FAQ[];
  aboutSection?: AboutFormatsSectionData;
  changelog?: ChangelogEntry[];
  relatedTools?: RelatedTool[];
  blogPosts?: BlogPost[];
};

export default function ToolPageTemplate({
  tool,
  videoSection,
  useTwoColumnLayout = true, // Default to true for two-column layout
  faqs,
  aboutSection,
  changelog,
  relatedTools,
  blogPosts,
}: ToolPageProps) {
  // If tool requires FFmpeg, always use single column layout (full dropzone)
  const shouldUseTwoColumn = useTwoColumnLayout && videoSection?.embedId && !tool.requiresFFmpeg;

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section with Tool */}
      {shouldUseTwoColumn ? (
        <>
          <LanderHeroTwoColumn
            title={tool.title}
            subtitle={tool.subtitle}
            from={tool.from}
            to={tool.to}
            accept={tool.accept}
            videoEmbedId={videoSection.embedId}
          />
          {/* About the Formats Section - Right after 2-column hero */}
          {aboutSection && (
            <AboutFormatsSection
              fromFormat={aboutSection.fromFormat}
              toFormat={aboutSection.toFormat}
            />
          )}
        </>
      ) : (
        <>
          <HeroConverter
            title={tool.title}
            subtitle={tool.subtitle}
            from={tool.from}
            to={tool.to}
            accept={tool.accept}
          />
          {/* About the Formats Section - Right after regular hero */}
          {aboutSection && (
            <AboutFormatsSection
              fromFormat={aboutSection.fromFormat}
              toFormat={aboutSection.toFormat}
            />
          )}
          {/* NO VIDEO for FFmpeg tools - they can't support YouTube embeds anyway */}
        </>
      )}

      {/* Related Tools Section - right after format cards */}
      {tool.from && tool.to && (
        <RelatedToolsSection
          currentFrom={tool.from}
          currentTo={tool.to}
          currentPath={`/${tool.from.toLowerCase()}-to-${tool.to.toLowerCase()}`}
        />
      )}

      {/* FAQs Section */}
      {faqs && <FAQSection faqs={faqs} />}

      {/* Blog Articles Section */}
      {blogPosts && <BlogSection blogPosts={blogPosts} />}

      {/* Changelog Section */}
      {changelog && <ChangelogSection changelog={changelog} />}

      {/* Footer with all tools */}
      <ToolsLinkHub />
    </main>
  );
}