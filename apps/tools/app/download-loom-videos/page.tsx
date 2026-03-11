import DownloaderPageTemplate from "@/components/DownloaderPageTemplate";
import { buildToolMetadata } from "@/lib/metadata";
import { toolContent } from "@/lib/tool-content";

const toolId = "download-loom-videos";

export const generateMetadata = () => buildToolMetadata(toolId);

export default function Page() {
  const content = toolContent[toolId];

  if (!content) {
    return <div>Tool not found</div>;
  }

  return <DownloaderPageTemplate toolId={toolId} content={content} />;
}
