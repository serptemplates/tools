"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { objectsToTableData, tableDataToObjects } from "./convert";
import { SAMPLE_TABLE } from "./formats";
import { TableData } from "./types";

type DataGridEditorProps = {
  tableData?: TableData | null;
  onChange?: (table: TableData) => void;
};

type DataGridXLEvents = {
  on?: (eventName: string, handler: (event: unknown) => void) => void;
  off?: (eventName: string, handler: (event: unknown) => void) => void;
};

type DataGridXLInstance = {
  destroy?: () => void;
  getData?: () => Array<Record<string, unknown>>;
  events?: DataGridXLEvents;
};

type DataGridXLConstructor = new (
  containerId: string,
  options?: {
    data?: Array<Record<string, string>>;
  }
) => DataGridXLInstance;

declare global {
  interface Window {
    DataGridXL?: DataGridXLConstructor;
  }
}

const SCRIPT_SRC = "https://code.datagridxl.com/datagridxl2.js";
const SCRIPT_MARKER = "data-dgxl-script";

export default function DataGridEditor({ tableData, onChange }: DataGridEditorProps) {
  const reactId = useId();
  const containerId = useMemo(
    () => `datagridxl-${reactId.replace(/:/g, "")}`,
    [reactId]
  );
  const gridRef = useRef<DataGridXLInstance | null>(null);
  const initialDataRef = useRef<TableData>(tableData ?? SAMPLE_TABLE);
  const onChangeRef = useRef<DataGridEditorProps["onChange"]>(onChange);
  const [status, setStatus] = useState("Loading editor...");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let isMounted = true;
    let activeGrid: DataGridXLInstance | null = null;
    let handleGridChange: ((event: unknown) => void) | null = null;

    const initializeGrid = () => {
      if (!isMounted) return;
      const DataGridXL = window.DataGridXL;
      if (!DataGridXL) {
        setStatus("Editor failed to load.");
        return;
      }
      const container = document.getElementById(containerId);
      if (!container) {
        setStatus("Editor container missing.");
        return;
      }
      gridRef.current?.destroy?.();
      activeGrid = new DataGridXL(containerId, {
        data: tableDataToObjects(initialDataRef.current),
      });
      gridRef.current = activeGrid;
      handleGridChange = () => {
        const handler = onChangeRef.current;
        if (!handler || !activeGrid?.getData) return;
        const data = activeGrid.getData();
        if (!Array.isArray(data)) return;
        handler(objectsToTableData(data as Array<Record<string, unknown>>));
      };
      activeGrid.events?.on?.("change", handleGridChange);
      setStatus("Editor ready.");
    };

    if (window.DataGridXL) {
      initializeGrid();
      return () => {
        isMounted = false;
        if (handleGridChange) {
          activeGrid?.events?.off?.("change", handleGridChange);
        }
        gridRef.current?.destroy?.();
        gridRef.current = null;
      };
    }

    let script = document.querySelector<HTMLScriptElement>(`script[${SCRIPT_MARKER}]`);
    if (!script) {
      script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.setAttribute(SCRIPT_MARKER, "true");
      document.body.appendChild(script);
    }

    const handleLoad = () => initializeGrid();
    const handleError = () => {
      if (!isMounted) return;
      setStatus("Editor failed to load.");
    };

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    return () => {
      isMounted = false;
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
      if (handleGridChange) {
        activeGrid?.events?.off?.("change", handleGridChange);
      }
      gridRef.current?.destroy?.();
      gridRef.current = null;
    };
  }, [containerId]);

  return (
    <div className="space-y-3">
      <div
        id={containerId}
        data-testid="dgxl-editor"
        className="h-[420px] w-full overflow-hidden rounded-lg border bg-white"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{status}</span>
        <a
          className="text-sm text-blue-600 underline"
          href="https://datagridxl.com"
          target="_blank"
          rel="noreferrer"
        >
          Data grid by DataGridXL
        </a>
      </div>
    </div>
  );
}
