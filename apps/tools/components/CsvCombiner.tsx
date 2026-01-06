"use client";

import { useRef, useState } from "react";
import { Card } from "@serp-tools/ui/components/card";
import { Button } from "@serp-tools/ui/components/button";
import { Badge } from "@serp-tools/ui/components/badge";
import { saveBlob } from "@/components/saveAs";
import { beginToolRun } from "@/lib/telemetry";

type Props = {
  toolId?: string;
};

type FileEntry = {
  name: string;
  size: number;
};

type ParsedCsv = {
  headers: string[];
  rows: string[][];
};

const DELIMITERS = [",", ";", "\t", "|"];

function detectDelimiter(line: string) {
  const scores = DELIMITERS.map((delimiter) => ({
    delimiter,
    count: line.split(delimiter).length - 1,
  }));
  scores.sort((a, b) => b.count - a.count);
  return scores[0]?.count ? scores[0].delimiter : ",";
}

function parseCsvLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseCsv(text: string): ParsedCsv {
  const cleaned = text.replace(/^\uFEFF/, "").trim();
  if (!cleaned) {
    return { headers: [], rows: [] };
  }

  const lines = cleaned.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const delimiter = detectDelimiter(lines[0] ?? "");
  const headers = parseCsvLine(lines[0] ?? "", delimiter).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => parseCsvLine(line, delimiter));

  return { headers, rows };
}

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function mergeCsvFiles(parsedFiles: ParsedCsv[]) {
  const headerIndex = new Map<string, number>();
  const combinedHeaders: string[] = [];
  const combinedRows: string[][] = [];

  parsedFiles.forEach(({ headers, rows }) => {
    headers.forEach((header) => {
      if (!headerIndex.has(header)) {
        headerIndex.set(header, combinedHeaders.length);
        combinedHeaders.push(header);
        combinedRows.forEach((row) => row.push(""));
      }
    });

    rows.forEach((row) => {
      const output = new Array(combinedHeaders.length).fill("");
      headers.forEach((header, index) => {
        const targetIndex = headerIndex.get(header);
        if (targetIndex === undefined) return;
        output[targetIndex] = row[index] ?? "";
      });
      combinedRows.push(output);
    });
  });

  const csvLines = [
    combinedHeaders.map(escapeCsv).join(","),
    ...combinedRows.map((row) => row.map((value) => escapeCsv(value ?? "")).join(",")),
  ];

  return {
    csv: csvLines.join("\n"),
    rows: combinedRows.length,
    columns: combinedHeaders.length,
  };
}

export default function CsvCombiner({ toolId }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [output, setOutput] = useState("");
  const [stats, setStats] = useState({ rows: 0, columns: 0 });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function onPick() {
    inputRef.current?.click();
  }

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const next = Array.from(list);
    setSelectedFiles(next);
    setFiles(next.map((file) => ({ name: file.name, size: file.size })));
    setOutput("");
    setStats({ rows: 0, columns: 0 });
    setError("");
  }

  async function combineCsv() {
    if (selectedFiles.length === 0) {
      setError("Please add at least two CSV files.");
      return;
    }

    if (selectedFiles.length < 2) {
      setError("Please add at least two CSV files.");
      return;
    }

    setBusy(true);
    setError("");

    const run = beginToolRun({
      toolId: toolId ?? "csv-combiner",
      from: "csv",
      to: "csv",
      inputBytes: selectedFiles.reduce((sum, file) => sum + file.size, 0),
      metadata: { fileCount: selectedFiles.length },
    });

    try {
      const parsedFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          const text = await file.text();
          return parseCsv(text);
        })
      );

      if (parsedFiles.some((parsed) => parsed.headers.length === 0)) {
        throw new Error("One or more files are empty or invalid.");
      }

      const merged = mergeCsvFiles(parsedFiles);
      setOutput(merged.csv);
      setStats({ rows: merged.rows, columns: merged.columns });
      run.finishSuccess({
        outputBytes: new Blob([merged.csv]).size,
        metadata: { rows: merged.rows, columns: merged.columns },
      });
    } catch (err: any) {
      setError(err?.message || "Failed to combine CSV files.");
      run.finishFailure({ errorCode: "combine_failed" });
    } finally {
      setBusy(false);
    }
  }

  function downloadCsv() {
    if (!output) return;
    const blob = new Blob([output], { type: "text/csv" });
    saveBlob(blob, "combined.csv");
  }

  return (
    <section className="w-full bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">CSV Combiner</h1>
          <p className="text-lg text-gray-600">
            Merge multiple CSV files into one clean dataset without uploads.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">CSV Files</h3>
              {files.length > 0 && (
                <Badge variant="secondary">{files.length} files</Badge>
              )}
            </div>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={onPick}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
              }}
              data-testid="csv-combiner-dropzone"
            >
              <p className="text-sm text-gray-600">Drop CSV files here or click to select</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              data-testid="csv-combiner-input"
            />

            {files.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                {files.map((file) => (
                  <li key={file.name} className="flex justify-between">
                    <span>{file.name}</span>
                    <span>{Math.round(file.size / 1024)} KB</span>
                  </li>
                ))}
              </ul>
            )}

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <Button onClick={combineCsv} disabled={busy} data-testid="csv-combiner-run">
                {busy ? "Combining..." : "Combine CSV Files"}
              </Button>
              <Button variant="outline" onClick={() => {
                setFiles([]);
                setSelectedFiles([]);
                setOutput("");
                setStats({ rows: 0, columns: 0 });
                setError("");
                if (inputRef.current) inputRef.current.value = "";
              }}>
                Clear
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Combined Output</h3>
              {stats.rows > 0 && (
                <Badge variant="secondary">{stats.rows} rows × {stats.columns} columns</Badge>
              )}
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="Combined CSV output will appear here..."
              className="w-full h-96 p-4 border rounded-lg resize-none bg-gray-50 font-mono text-sm"
              data-testid="csv-combiner-output"
            />
            <div className="mt-4">
              <Button
                onClick={downloadCsv}
                disabled={!output}
                variant="secondary"
                data-testid="csv-combiner-download"
              >
                Download Combined CSV
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
