import Papa from "papaparse";
import { markdownTable } from "markdown-table";
import YAML from "yaml";
import { InputFormat, OutputFormat, TableData } from "./types";

type AnyFormat = InputFormat | OutputFormat;

type ParseResult = {
  table: TableData | null;
  supported: boolean;
  error?: string | null;
};

type SerializeResult = {
  text: string;
  supported: boolean;
  notice?: string;
};

function normalizeTable(headers: string[], rows: string[][]) {
  const maxColumns = Math.max(headers.length, ...rows.map((row) => row.length), 0);
  const safeHeaders = headers.length
    ? headers
    : Array.from({ length: maxColumns }, (_, index) => `column_${index + 1}`);
  const normalizedRows = rows.map((row) =>
    safeHeaders.map((_, index) => (row[index] ?? "").toString())
  );
  return { headers: safeHeaders, rows: normalizedRows };
}

export function tableDataToObjects(table: TableData) {
  return table.rows.map((row) => {
    const output: Record<string, string> = {};
    table.headers.forEach((header, index) => {
      output[header] = row[index] ?? "";
    });
    return output;
  });
}

export function objectsToTableData(list: Array<Record<string, unknown>>) {
  const headerSet = new Set<string>();
  list.forEach((item) => {
    Object.keys(item).forEach((key) => headerSet.add(key));
  });
  const headers = Array.from(headerSet);
  const rows = list.map((item) =>
    headers.map((header) => {
      const value = item[header];
      if (value === null || value === undefined) return "";
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    })
  );
  return normalizeTable(headers, rows);
}

function parseCsv(text: string) {
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
  if (parsed.errors.length) {
    return { table: null, error: parsed.errors[0]?.message ?? "CSV parse error" };
  }
  const data = parsed.data as string[][];
  if (!data.length) {
    return { table: null, error: "CSV is empty." };
  }
  const [headerRow, ...rows] = data;
  return { table: normalizeTable(headerRow, rows), error: null };
}

function parseJson(text: string) {
  const parsed = JSON.parse(text) as unknown;
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      return { table: null, error: "JSON array is empty." };
    }
    if (parsed.every((row) => Array.isArray(row))) {
      const rows = parsed as unknown[][];
      const firstRow = rows[0] as unknown[];
      const allStrings = firstRow.every((cell) => typeof cell === "string");
      const maxColumns = Math.max(...rows.map((row) => row.length));
      const headers = allStrings
        ? firstRow.map((cell) => String(cell))
        : Array.from({ length: maxColumns }, (_, index) => `column_${index + 1}`);
      const dataRows = allStrings
        ? rows.slice(1).map((row) => row.map((cell) => (cell ?? "").toString()))
        : rows.map((row) => row.map((cell) => (cell ?? "").toString()));
      return { table: normalizeTable(headers, dataRows), error: null };
    }
    if (parsed.every((row) => row && typeof row === "object" && !Array.isArray(row))) {
      return {
        table: objectsToTableData(parsed as Array<Record<string, unknown>>),
        error: null,
      };
    }
  }
  return { table: null, error: "JSON must be an array of objects or arrays." };
}

function splitMarkdownRow(line: string) {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function isMarkdownDivider(line: string) {
  const cells = splitMarkdownRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseMarkdown(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return { table: null, error: "Markdown table needs a header and separator line." };
  }
  const headerRow = splitMarkdownRow(lines[0]);
  const dividerIndex = isMarkdownDivider(lines[1]) ? 2 : 1;
  const rows = lines.slice(dividerIndex).map(splitMarkdownRow);
  return { table: normalizeTable(headerRow, rows), error: null };
}

function parseHtml(text: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");
  const table = doc.querySelector("table");
  if (!table) {
    return { table: null, error: "No <table> found in HTML." };
  }
  const rows = Array.from(table.querySelectorAll("tr")).map((row) =>
    Array.from(row.querySelectorAll("th, td")).map((cell) =>
      (cell.textContent ?? "").trim()
    )
  );
  if (!rows.length) {
    return { table: null, error: "HTML table is empty." };
  }
  const [headerRow, ...bodyRows] = rows;
  return { table: normalizeTable(headerRow, bodyRows), error: null };
}

function parseXml(text: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror")) {
    return { table: null, error: "XML parse error." };
  }
  let rowNodes = Array.from(doc.querySelectorAll("row"));
  if (!rowNodes.length && doc.documentElement) {
    rowNodes = Array.from(doc.documentElement.children);
  }
  if (!rowNodes.length) {
    return { table: null, error: "XML needs <row> elements." };
  }
  const headersSet = new Set<string>();
  const rowMaps = rowNodes.map((node) => {
    const map: Record<string, string> = {};
    Array.from(node.children).forEach((child) => {
      const key = child.tagName;
      headersSet.add(key);
      map[key] = (child.textContent ?? "").trim();
    });
    return map;
  });
  const headers = Array.from(headersSet);
  const rows = rowMaps.map((row) => headers.map((header) => row[header] ?? ""));
  return { table: normalizeTable(headers, rows), error: null };
}

function parseYaml(text: string) {
  const parsed = YAML.parse(text) as unknown;
  if (Array.isArray(parsed)) {
    if (!parsed.length) {
      return { table: null, error: "YAML array is empty." };
    }
    if (parsed.every((row) => row && typeof row === "object" && !Array.isArray(row))) {
      return {
        table: objectsToTableData(parsed as Array<Record<string, unknown>>),
        error: null,
      };
    }
  }
  return { table: null, error: "YAML must be a list of objects." };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeSql(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function escapeLatex(value: string) {
  return value.replace(/([&%$#_{}~^\\])/g, "\\$1");
}

export function serializeOutput(format: AnyFormat, table: TableData): SerializeResult {
  switch (format) {
    case "csv":
      return {
        text: Papa.unparse({ fields: table.headers, data: table.rows }),
        supported: true,
      };
    case "json":
      return {
        text: JSON.stringify(tableDataToObjects(table), null, 2),
        supported: true,
      };
    case "markdown":
      return {
        text: markdownTable([table.headers, ...table.rows]),
        supported: true,
      };
    case "html":
      return {
        text: [
          "<table>",
          "  <thead>",
          `    <tr>${table.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>`,
          "  </thead>",
          "  <tbody>",
          ...table.rows.map(
            (row) =>
              `    <tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
          ),
          "  </tbody>",
          "</table>",
        ].join("\n"),
        supported: true,
      };
    case "xml":
      return {
        text: [
          "<rows>",
          ...table.rows.map((row) => {
            const cells = row
              .map(
                (cell, index) =>
                  `    <${table.headers[index]}>${escapeXml(cell)}</${table.headers[index]}>`
              )
              .join("\n");
            return `  <row>\n${cells}\n  </row>`;
          }),
          "</rows>",
        ].join("\n"),
        supported: true,
      };
    case "yaml":
      return {
        text: YAML.stringify(tableDataToObjects(table)),
        supported: true,
      };
    case "sql":
      return {
        text: [
          `INSERT INTO table_name (${table.headers.join(", ")}) VALUES`,
          ...table.rows.map((row, index) => {
            const values = row.map((cell) => escapeSql(cell)).join(", ");
            const suffix = index === table.rows.length - 1 ? ";" : ",";
            return `  (${values})${suffix}`;
          }),
        ].join("\n"),
        supported: true,
      };
    case "latex":
      return {
        text: [
          `\\begin{tabular}{${"l".repeat(table.headers.length)}}`,
          `${table.headers.map(escapeLatex).join(" & ")} \\\\`,
          "\\hline",
          ...table.rows.map((row) => `${row.map(escapeLatex).join(" & ")} \\\\`),
          "\\end{tabular}",
        ].join("\n"),
        supported: true,
      };
    case "excel":
    case "pdf":
    case "png":
    case "jpeg":
      return {
        text: `Binary output placeholder for ${format.toUpperCase()}.`,
        supported: false,
        notice: `${format.toUpperCase()} output is not wired yet in the demo.`,
      };
    default:
      return {
        text: `Format ${format} is not wired yet.`,
        supported: false,
        notice: `Format ${format} is not wired yet.`,
      };
  }
}

export function parseInput(format: InputFormat, text: string): ParseResult {
  if (!text.trim()) {
    return { table: null, supported: true, error: "Paste or upload data to begin." };
  }
  try {
    switch (format) {
      case "csv":
        return { ...parseCsv(text), supported: true };
      case "json":
        return { ...parseJson(text), supported: true };
      case "markdown":
        return { ...parseMarkdown(text), supported: true };
      case "html":
        return { ...parseHtml(text), supported: true };
      case "xml":
        return { ...parseXml(text), supported: true };
      case "yaml":
        return { ...parseYaml(text), supported: true };
      case "sql":
      case "latex":
      case "excel":
      case "mysql":
      case "mediawiki":
        return {
          table: null,
          supported: false,
          error: `${format.toUpperCase()} input parsing is not wired yet.`,
        };
      default:
        return { table: null, supported: false, error: "Unsupported input format." };
    }
  } catch (error) {
    return {
      table: null,
      supported: true,
      error: error instanceof Error ? error.message : "Parse error",
    };
  }
}
