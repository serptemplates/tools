import { ToolPageRenderer } from "@/components/ToolPageRenderer";
import { buildToolMetadata } from "@/lib/metadata";

const toolId = "aiff-to-wav";

export const generateMetadata = () => buildToolMetadata(toolId);

export default function Page() {
  return <ToolPageRenderer toolId={toolId} />;
}
