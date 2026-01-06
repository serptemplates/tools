import { ToolPageRenderer } from "@/components/ToolPageRenderer";
import { buildToolMetadata } from "@/lib/metadata";

const toolId = "arw-to-jpg";

export const generateMetadata = () => buildToolMetadata(toolId);

export default function Page() {
  return <ToolPageRenderer toolId={toolId} />;
}
