export type TableData = {
  headers: string[];
  rows: string[][];
};

export type FormatOption = { value: string; label: string };

export type InputFormat =
  | "csv"
  | "excel"
  | "json"
  | "markdown"
  | "html"
  | "sql"
  | "latex"
  | "xml"
  | "yaml"
  | "mysql"
  | "mediawiki";

export type OutputFormat =
  | "json"
  | "csv"
  | "markdown"
  | "sql"
  | "xml"
  | "yaml"
  | "html"
  | "latex"
  | "excel"
  | "pdf"
  | "png"
  | "jpeg";

export type ViewMode = "raw" | "preview";
