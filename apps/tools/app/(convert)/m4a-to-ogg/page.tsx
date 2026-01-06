"use client";

import ToolPageTemplate from "@/components/ToolPageTemplate";
import { toolContent } from "@/lib/tool-content";

export default function Page() {
  const content = toolContent["m4a-to-ogg"];
  
  if (!content) {
    return <div>Tool not found</div>;
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
