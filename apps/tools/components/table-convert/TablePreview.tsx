"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { InputFormat, OutputFormat, TableData } from "./types";

type TablePreviewProps = {
  table: TableData | null;
  emptyMessage: string;
  format?: InputFormat | OutputFormat;
  text?: string;
};

const containerClassName =
  "min-h-[280px] max-h-[360px] w-full overflow-auto rounded-lg border bg-background shadow-sm";

export default function TablePreview({
  table,
  emptyMessage,
  format,
  text,
}: TablePreviewProps) {
  if (format === "markdown" && text?.trim()) {
    return (
      <div className={containerClassName}>
        <div className="p-3 text-sm text-gray-700">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ children }) => (
                <table className="min-w-full border-collapse text-sm">{children}</table>
              ),
              thead: ({ children }) => (
                <thead className="sticky top-0 bg-muted/60 text-xs uppercase text-muted-foreground">
                  {children}
                </thead>
              ),
              th: ({ children }) => (
                <th className="border-b px-3 py-2 text-left font-semibold">{children}</th>
              ),
              td: ({ children }) => (
                <td className="border-b px-3 py-2 align-top">{children}</td>
              ),
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,
              code: ({ children }) => (
                <code className="rounded bg-muted/30 px-1 font-mono text-xs">{children}</code>
              ),
              pre: ({ children }) => (
                <pre className="overflow-auto rounded bg-muted/20 p-3 text-xs">{children}</pre>
              ),
            }}
          >
            {text}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="min-h-[280px] max-h-[360px] w-full rounded-lg border bg-muted/20 px-4 py-3 text-sm text-muted-foreground shadow-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <table className="min-w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-muted/60 text-xs uppercase text-muted-foreground">
          <tr>
            {table.headers.map((header, index) => (
              <th key={`header-${index}`} className="border-b px-3 py-2 text-left font-semibold">
                {header || `Column ${index + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr
              key={`row-${rowIndex}`}
              className={rowIndex % 2 === 0 ? "bg-background" : "bg-muted/20"}
            >
              {table.headers.map((_, cellIndex) => (
                <td key={`cell-${rowIndex}-${cellIndex}`} className="border-b px-3 py-2 align-top">
                  {row[cellIndex] || "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
