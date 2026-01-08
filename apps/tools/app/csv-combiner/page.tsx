import CsvCombiner from "@/components/CsvCombiner";
import { AboutFormatsSection } from "@/components/sections/AboutFormatsSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { BlogSection } from "@/components/sections/BlogSection";
import { ChangelogSection } from "@/components/sections/ChangelogSection";
import { HowToSection } from "@/components/sections/HowToSection";
import { InfoArticleSection } from "@/components/sections/InfoArticleSection";
import { ToolsLinkHub } from "@/components/sections/ToolsLinkHub";
import { buildToolMetadata } from "@/lib/metadata";
import { toolContent } from "@/lib/tool-content";
import { requiresCoepForTool } from "@/lib/coep";

const toolId = "csv-combiner";

export const generateMetadata = () => buildToolMetadata(toolId);

export default function Page() {
  const content = toolContent[toolId];

  if (!content) {
    return <div>Tool not found</div>;
  }
  const videoEmbedId =
    content.videoSection && !requiresCoepForTool(content.tool)
      ? content.videoSection.embedId
      : undefined;

  return (
    <main className="min-h-screen bg-background">
      <CsvCombiner toolId={content.tool.id} videoEmbedId={videoEmbedId} />

      {content.aboutSection && (
        <AboutFormatsSection
          fromFormat={content.aboutSection.fromFormat}
          toFormat={content.aboutSection.toFormat}
        />
      )}

      {content.howTo && (
        <HowToSection title={content.howTo.title} intro={content.howTo.intro} steps={content.howTo.steps} />
      )}

      {content.infoArticle && (
        <InfoArticleSection
          title={content.infoArticle.title}
          markdown={content.infoArticle.markdown}
        />
      )}

      {content.faqs && <FAQSection faqs={content.faqs} />}

      {content.blogPosts && <BlogSection blogPosts={content.blogPosts} />}

      {content.changelog && <ChangelogSection changelog={content.changelog} />}

      <ToolsLinkHub relatedTools={content.relatedTools} />
    </main>
  );
}
