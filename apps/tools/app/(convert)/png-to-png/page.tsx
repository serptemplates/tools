import { redirect } from "next/navigation";
import { buildToolMetadata } from "@/lib/metadata";

const toolId = "png-to-png";

export const generateMetadata = () => buildToolMetadata(toolId);

export default function Page() {
  redirect("/compress-png");
}
