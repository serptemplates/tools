"use client";

import ToolPageTemplate from "@/components/ToolPageTemplate";
import HeroConverter from "@/components/HeroConverter";
import { toolContent } from '@/lib/tool-content';

export default function Page() {
  const content = toolContent["arw-to-jpg"];

  if (!content) {
    // Fallback to HeroConverter for tools without content
    return (
      <HeroConverter
        title="ARW to JPG"
        subtitle="Convert Sony ARW RAW to JPG"
        from="arw"
        to="jpg"
      />
    );
  }

  return (
    <ToolPageTemplate
      tool={content.tool}
      videoSection={content.videoSection}
      faqs={content.faqs}
      aboutSection={content.aboutSection}
      changelog={content.changelog}
      relatedTools={content.relatedTools}
      blogPosts={content.blogPosts}
    />
  );
}