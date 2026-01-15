import TableConvertLanding from "@/components/table-convert/TableConvertLanding";
import { buildTableConvertMetadata } from "@/lib/table-convert";

const fromFormat = "xml" as const;
const toFormat = "csv" as const;
const title = "Convert XML to CSV Online";
const slug = "xml-to-csv";

export const generateMetadata = () =>
  buildTableConvertMetadata({ from: fromFormat, to: toFormat, title, slug });

export default function Page() {
  return <TableConvertLanding from={fromFormat} to={toFormat} title={title} />;
}
