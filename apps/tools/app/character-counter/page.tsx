"use client";

import CharacterCounter from "@/components/CharacterCounter";
import { FAQSection } from "@/components/sections/FAQSection";
import { BlogSection } from "@/components/sections/BlogSection";
import { ChangelogSection } from "@/components/sections/ChangelogSection";
import { ToolsLinkHub } from "@/components/sections/ToolsLinkHub";
import { toolContent } from '@/lib/tool-content';

export default function Page() {
  const content = toolContent["character-counter"];

  if (!content) {
    return <div>Tool not found</div>;
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Custom Character Counter Component */}
      <CharacterCounter />

      {/* Related Tools Section - Character counter doesn't have from/to formats */}

      {/* FAQs Section */}
      {content.faqs && <FAQSection faqs={content.faqs} />}

      {/* Blog Articles Section */}
      {content.blogPosts && <BlogSection blogPosts={content.blogPosts} />}

      {/* Changelog Section */}
      {content.changelog && <ChangelogSection changelog={content.changelog} />}

      {/* Footer with all tools */}
      <ToolsLinkHub />
    </main>
  );
}