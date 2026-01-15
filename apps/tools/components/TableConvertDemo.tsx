"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@serp-tools/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@serp-tools/ui/components/card";
import { Badge } from "@serp-tools/ui/components/badge";
import { saveBlob } from "@/components/saveAs";
import DataGridEditor from "@/components/table-convert/DataGridEditor";
import FormatTabs from "@/components/table-convert/FormatTabs";
import TablePreview from "@/components/table-convert/TablePreview";
import ViewToggle from "@/components/table-convert/ViewToggle";
import {
  INPUT_FORMATS,
  OUTPUT_FORMATS,
  SAMPLE_TABLE,
  detectFormatFromFile,
  getLabel,
  getPlaceholder,
} from "@/components/table-convert/formats";
import { parseInput, serializeOutput } from "@/components/table-convert/convert";
import { InputFormat, OutputFormat, TableData, ViewMode } from "@/components/table-convert/types";

type TableConvertDemoProps = {
  initialInputFormat?: InputFormat;
  initialOutputFormat?: OutputFormat;
  title?: string;
  subtitle?: string;
};

export default function TableConvertDemo({
  initialInputFormat = "csv",
  initialOutputFormat = "json",
  title = "Dual Viewer Converter Demo",
  subtitle = "Paste or upload on the left, convert to a target format, and preview on the right.",
}: TableConvertDemoProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [inputFormat, setInputFormat] = useState<InputFormat>(initialInputFormat);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(initialOutputFormat);
  const [inputView, setInputView] = useState<ViewMode>("raw");
  const [outputView, setOutputView] = useState<ViewMode>("raw");
  const [inputText, setInputText] = useState(
    () => serializeOutput(initialInputFormat, SAMPLE_TABLE).text
  );
  const [outputText, setOutputText] = useState(
    () => serializeOutput(initialOutputFormat, SAMPLE_TABLE).text
  );
  const [outputNotice, setOutputNotice] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(SAMPLE_TABLE);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Auto-convert is on.");
  const [dragActive, setDragActive] = useState(false);

  const inputLabel = getLabel(INPUT_FORMATS, inputFormat);
  const outputLabel = getLabel(OUTPUT_FORMATS, outputFormat);
  const inputPreviewMessage = error ?? "Rendered input preview will appear here.";
  const outputPreviewMessage =
    outputNotice ??
    (tableData ? "Rendered output preview will appear here." : "Waiting for valid input.");

  useEffect(() => {
    const result = parseInput(inputFormat, inputText);
    if (!result.supported) {
      setError(result.error ?? "Input format not supported.");
      return;
    }
    if (!result.table) {
      setTableData(null);
      setError(result.error ?? null);
      return;
    }
    setError(null);
    setTableData(result.table);
  }, [inputText, inputFormat]);

  useEffect(() => {
    if (!tableData) {
      setOutputText("");
      setOutputNotice("Waiting for valid input.");
      return;
    }
    const serialized = serializeOutput(outputFormat, tableData);
    setOutputText(serialized.text);
    setOutputNotice(serialized.supported ? null : serialized.notice ?? null);
    setStatus(`Auto-converting ${inputLabel} to ${outputLabel}.`);
  }, [tableData, outputFormat, inputLabel, outputLabel]);

  function handleInputFormatChange(nextFormat: InputFormat, reserialize = true) {
    if (nextFormat === inputFormat) return;
    setInputFormat(nextFormat);
    if (!tableData || !reserialize) return;
    const serialized = serializeOutput(nextFormat, tableData);
    if (serialized.supported) {
      setInputText(serialized.text);
      setError(null);
    }
  }

  function handleUploadClick() {
    fileRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const detected = detectFormatFromFile(file);
    if (detected && detected !== inputFormat) {
      handleInputFormatChange(detected, false);
    }
    setFileName(file.name);
    const text = await file.text();
    setInputText(text);
    setStatus(`Loaded ${file.name}.`);
  }

  async function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    const detected = detectFormatFromFile(file);
    if (detected && detected !== inputFormat) {
      handleInputFormatChange(detected, false);
    }
    setFileName(file.name);
    const text = await file.text();
    setInputText(text);
    setStatus(`Loaded ${file.name}.`);
  }

  function handleClear() {
    setInputText("");
    setFileName(null);
    setError(null);
    setStatus("Cleared current view.");
  }

  async function handleCopyOutput() {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setStatus(`Copied ${outputLabel} output.`);
    } catch {
      setStatus("Copy failed.");
    }
  }

  function handleDownload() {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: "text/plain" });
    saveBlob(blob, `tableconvert-demo.${outputFormat}.txt`);
    setStatus(`Downloaded ${outputLabel} output.`);
  }

  function handleEditorChange(nextTable: TableData) {
    setTableData(nextTable);
    const serialized = serializeOutput(inputFormat, nextTable);
    if (serialized.supported) {
      setInputText(serialized.text);
      setError(null);
    }
  }

  return (
    <section className="w-full bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">{title}</h1>
          <p className="text-lg text-gray-600">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 items-start">
          <Card
            className={`min-h-[540px] ${dragActive ? "border-blue-500 ring-2 ring-blue-200" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <CardHeader className="border-b">
              <CardTitle>Source</CardTitle>
              <CardDescription>Paste or upload, then switch the input format tab.</CardDescription>
              <CardAction>
                <Badge variant="secondary">Input</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormatTabs
                label="Input format"
                badgeLabel={inputLabel}
                options={INPUT_FORMATS}
                value={inputFormat}
                onChange={(value) => handleInputFormatChange(value as InputFormat)}
              />

              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleUploadClick}>
                  Upload file
                </Button>
                <Button size="sm" variant="ghost" onClick={handleClear}>
                  Clear view
                </Button>
                <input ref={fileRef} type="file" onChange={handleFileChange} className="hidden" />
                {fileName && (
                  <span className="text-xs text-muted-foreground">Selected: {fileName}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Drag and drop a file anywhere in this panel to load it.
              </p>

              <ViewToggle value={inputView} onChange={setInputView} />

              {inputView === "raw" ? (
                <textarea
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  placeholder={getPlaceholder(inputFormat)}
                  className={`min-h-[280px] w-full resize-none rounded-lg border bg-background px-4 py-3 font-mono text-sm shadow-sm focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                    error ? "border-red-400" : ""
                  }`}
                  spellCheck={false}
                />
              ) : (
                <TablePreview
                  table={tableData}
                  emptyMessage={inputPreviewMessage}
                  format={inputFormat}
                  text={inputText}
                />
              )}
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="min-h-[540px]">
            <CardHeader className="border-b">
              <CardTitle>Online table editor</CardTitle>
              <CardDescription>Work directly in a spreadsheet-style grid.</CardDescription>
              <CardAction>
                <Badge variant="secondary">Editor</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              <DataGridEditor tableData={tableData} onChange={handleEditorChange} />
            </CardContent>
          </Card>

          <Card className="min-h-[540px]">
            <CardHeader className="border-b">
              <CardTitle>Output</CardTitle>
              <CardDescription>Auto-converts as you type or drop a file.</CardDescription>
              <CardAction>
                <Badge variant="secondary">Output</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormatTabs
                label="Output format"
                badgeLabel={outputLabel}
                options={OUTPUT_FORMATS}
                value={outputFormat}
                onChange={(value) => setOutputFormat(value as OutputFormat)}
              />

              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleCopyOutput}>
                  Copy
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  Download
                </Button>
              </div>
              {outputNotice && <p className="text-xs text-muted-foreground">{outputNotice}</p>}
              <div className="text-xs text-muted-foreground">{status}</div>

              <ViewToggle value={outputView} onChange={setOutputView} />

              {outputView === "raw" ? (
                <textarea
                  readOnly
                  value={outputText}
                  className="min-h-[280px] w-full resize-none rounded-lg border bg-muted/20 px-4 py-3 font-mono text-sm shadow-sm"
                  spellCheck={false}
                />
              ) : (
                <TablePreview
                  table={tableData}
                  emptyMessage={outputPreviewMessage}
                  format={outputFormat}
                  text={outputText}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
