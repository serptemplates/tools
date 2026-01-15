import TableConvertLanding from "@/components/table-convert/TableConvertLanding";
import { buildTableConvertMetadata } from "@/lib/table-convert";

const fromFormat = "csv" as const;
const toFormat = "json" as const;
const title = "Convert CSV to JSON Array Online";
const slug = "csv-to-json";

export const generateMetadata = () =>
  buildTableConvertMetadata({ from: fromFormat, to: toFormat, title, slug });

export default function Page() {
  return <TableConvertLanding from={fromFormat} to={toFormat} title={title} />;
}
