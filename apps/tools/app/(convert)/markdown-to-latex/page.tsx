import TableConvertLanding from "@/components/table-convert/TableConvertLanding";
import { buildTableConvertMetadata } from "@/lib/table-convert";

const fromFormat = "markdown" as const;
const toFormat = "latex" as const;
const title = "Convert Markdown Table to LaTeX Table Online";
const slug = "markdown-to-latex";

export const generateMetadata = () =>
  buildTableConvertMetadata({ from: fromFormat, to: toFormat, title, slug });

export default function Page() {
  return <TableConvertLanding from={fromFormat} to={toFormat} title={title} />;
}
