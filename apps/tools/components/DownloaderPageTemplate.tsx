import DownloaderExtensionCTA from "@/components/DownloaderExtensionCTA";
import DownloaderPageHero from "@/components/DownloaderPageHero";
import { FAQSection } from "@/components/sections/FAQSection";
import { BlogSection } from "@/components/sections/BlogSection";
import { ChangelogSection } from "@/components/sections/ChangelogSection";
import { HowToSection } from "@/components/sections/HowToSection";
import { InfoArticleSection } from "@/components/sections/InfoArticleSection";
import { ToolsLinkHub } from "@/components/sections/ToolsLinkHub";
import type { ToolContent } from "@/types";

type DownloaderPageTemplateProps = {
  toolId: string;
  content: ToolContent;
};

export default function DownloaderPageTemplate({
  toolId,
  content,
}: DownloaderPageTemplateProps) {
  return (
    <main className="min-h-screen bg-background">
      <DownloaderExtensionCTA />

      <DownloaderPageHero
        toolId={toolId}
        title={content.tool.title}
        subtitle={content.tool.subtitle}
      />

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
