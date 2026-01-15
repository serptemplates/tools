import TableConvertLanding from "@/components/table-convert/TableConvertLanding";
import { buildTableConvertMetadata } from "@/lib/table-convert";

const fromFormat = "json" as const;
const toFormat = "markdown" as const;
const title = "Convert JSON Array to Markdown Table Online";
const slug = "json-to-markdown";

export const generateMetadata = () =>
  buildTableConvertMetadata({ from: fromFormat, to: toFormat, title, slug });

export default function Page() {
  return <TableConvertLanding from={fromFormat} to={toFormat} title={title} />;
}
