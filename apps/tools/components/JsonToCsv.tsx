"use client";

import { useState } from "react";
import { Card } from "@serp-tools/ui/components/card";
import { Button } from "@serp-tools/ui/components/button";
import { Badge } from "@serp-tools/ui/components/badge";
import { saveBlob } from "@/components/saveAs";
import { beginToolRun } from "@/lib/telemetry";

type Props = {
  toolId?: string;
};

export default function JsonToCsv({ toolId }: Props) {
  const [jsonInput, setJsonInput] = useState("");
  const [csvOutput, setCsvOutput] = useState("");
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ rows: 0, columns: 0 });

  const convertJsonToCsv = () => {
    setError("");
    setCsvOutput("");

    if (!jsonInput.trim()) {
      setError("Please enter JSON data");
      return;
    }

    const inputBytes = new Blob([jsonInput]).size;
    const run = beginToolRun({
      toolId: toolId ?? "json-to-csv",
      from: "json",
      to: "csv",
      inputBytes,
    });

    try {
      const data = JSON.parse(jsonInput);

      if (!Array.isArray(data)) {
        setError("JSON must be an array of objects");
        run.finishFailure({ errorCode: "invalid_format" });
        return;
      }

      if (data.length === 0) {
        setError("JSON array is empty");
        run.finishFailure({ errorCode: "empty_array" });
        return;
      }

      // Get all unique keys from all objects
      const allKeys = new Set<string>();
      data.forEach(obj => {
        Object.keys(obj).forEach(key => allKeys.add(key));
      });
      const headers = Array.from(allKeys);

      // Build CSV
      const csvRows = [];

      // Add headers
      csvRows.push(headers.map(h => escapeCSV(h)).join(','));

      // Add data rows
      data.forEach(obj => {
        const row = headers.map(header => {
          const value = obj[header];
          if (value === undefined || value === null) return '';
          return escapeCSV(String(value));
        });
        csvRows.push(row.join(','));
      });

      const csv = csvRows.join('\n');
      setCsvOutput(csv);
      setStats({ rows: data.length, columns: headers.length });
      run.finishSuccess({
        outputBytes: new Blob([csv]).size,
        metadata: { rows: data.length, columns: headers.length },
      });
    } catch (e) {
      setError("Invalid JSON: " + (e as Error).message);
      run.finishFailure({ errorCode: "invalid_json" });
    }
  };

  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
  };

  const downloadCSV = () => {
    if (!csvOutput) return;
    const blob = new Blob([csvOutput], { type: 'text/csv' });
    saveBlob(blob, 'data.csv');
  };

  const loadSampleData = () => {
    const sample = [
      { id: 1, name: "John Doe", email: "john@example.com", age: 30, city: "New York" },
      { id: 2, name: "Jane Smith", email: "jane@example.com", age: 25, city: "Los Angeles" },
      { id: 3, name: "Bob Johnson", email: "bob@example.com", age: 35, city: "Chicago" },
      { id: 4, name: "Alice Brown", email: "alice@example.com", age: 28, city: "Houston" }
    ];
    setJsonInput(JSON.stringify(sample, null, 2));
  };

  return (
    <section className="w-full bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">JSON to CSV Converter</h1>
          <p className="text-lg text-gray-600">
            Convert JSON data to CSV format for spreadsheets and data analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* JSON Input */}
          <div>
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">JSON Input</h3>
                <div className="flex gap-2">
                  <button
                    onClick={loadSampleData}
                    className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                  >
                    Load Sample
                  </button>
                  <button
                    onClick={() => setJsonInput("")}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='[{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]'
                className="w-full h-96 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                spellCheck={false}
                data-testid="json-input"
              />
              {error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {error}
                </div>
              )}
            </Card>
          </div>

          {/* CSV Output */}
          <div>
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">CSV Output</h3>
                <div className="flex gap-2">
                  {stats.rows > 0 && (
                    <>
                      <Badge variant="secondary">
                        {stats.rows} rows × {stats.columns} columns
                      </Badge>
                      <button
                        onClick={downloadCSV}
                        className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                        data-testid="json-to-csv-download"
                      >
                        Download CSV
                      </button>
                    </>
                  )}
                </div>
              </div>
              <textarea
                value={csvOutput}
                readOnly
                placeholder="CSV output will appear here..."
                className="w-full h-96 p-4 border rounded-lg resize-none bg-gray-50 font-mono text-sm"
                data-testid="csv-output"
              />
            </Card>
          </div>
        </div>

        {/* Convert Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={convertJsonToCsv}
            size="lg"
            className="px-8"
            data-testid="json-convert"
          >
            Convert JSON to CSV
          </Button>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Automatic Detection</h3>
            <p className="text-sm text-gray-600">
              Automatically detects all fields in your JSON objects and creates appropriate CSV columns
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Handles Missing Data</h3>
            <p className="text-sm text-gray-600">
              Gracefully handles missing fields and null values in your JSON data
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Privacy First</h3>
            <p className="text-sm text-gray-600">
              All conversion happens in your browser. Your data never leaves your device
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
