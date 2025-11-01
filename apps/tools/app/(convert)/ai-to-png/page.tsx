"use client";

import Converter from "@/components/Converter";

export default function AiToPngPage() {
  return (
    <div className="container py-8">
      <Converter
        title="AI to PNG Converter"
        from="ai"
        to="png"
        description="Convert Adobe Illustrator files to PNG format"
        accepts={[".ai"]}
      />
    </div>
  );
}