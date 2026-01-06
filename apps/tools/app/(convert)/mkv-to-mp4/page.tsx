import { ToolPageRenderer } from "@/components/ToolPageRenderer";
import { buildToolMetadata } from "@/lib/metadata";

const toolId = "mkv-to-mp4";

export const generateMetadata = () => buildToolMetadata(toolId);

export default function Page() {
  return <ToolPageRenderer toolId={toolId} />;
}
