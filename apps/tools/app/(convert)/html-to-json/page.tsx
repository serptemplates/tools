import TableConvertLanding from "@/components/table-convert/TableConvertLanding";
import { buildTableConvertMetadata } from "@/lib/table-convert";

const fromFormat = "html" as const;
const toFormat = "json" as const;
const title = "Convert HTML Table to JSON Array Online";
const slug = "html-to-json";

export const generateMetadata = () =>
  buildTableConvertMetadata({ from: fromFormat, to: toFormat, title, slug });

export default function Page() {
  return <TableConvertLanding from={fromFormat} to={toFormat} title={title} />;
}
