"use client";

import JsonToCsv from "@/components/JsonToCsv";
import { FAQSection } from "@/components/sections/FAQSection";
import { BlogSection } from "@/components/sections/BlogSection";
import { ChangelogSection } from "@/components/sections/ChangelogSection";
import { ToolsLinkHub } from "@/components/sections/ToolsLinkHub";
import { toolContent } from '@/lib/tool-content';

export default function Page() {
  const content = toolContent["json-to-csv"];

  if (!content) {
    return <div>Tool not found</div>;
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Custom JSON to CSV Component */}
      <JsonToCsv />

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