import { ToolPageRenderer } from "@/components/ToolPageRenderer";
import { buildToolMetadata } from "@/lib/metadata";

const toolId = "png-to-gif";

export const generateMetadata = () => buildToolMetadata(toolId);

export default function Page() {
  return <ToolPageRenderer toolId={toolId} />;
}
