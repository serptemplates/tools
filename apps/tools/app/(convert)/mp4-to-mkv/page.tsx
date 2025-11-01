"use client";

import ToolPageTemplate from "@/components/ToolPageTemplate";
import LanderHeroTwoColumn from "@/components/LanderHeroTwoColumn";
import { toolContent } from '@/lib/tool-content';

export default function Page() {
  const content = toolContent["mp4-to-mkv"];
  
  if (!content) {
    // Fallback to LanderHeroTwoColumn with placeholder video
    return (
      <LanderHeroTwoColumn
        title="MP4 to MKV"
        subtitle="Convert MP4 video files to MKV format"
        from="mp4"
        to="mkv"
        
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