"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
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
  setCellValues?: (coords: { x: number; y: number }, values: string[][], expand?: boolean) => void;
  deleteRows?: (range: [number, number]) => void;
  deleteCols?: (range: [number, number]) => void;
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

const areArraysEqual = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const areTablesEqual = (left: TableData, right: TableData) => {
  if (!areArraysEqual(left.headers, right.headers)) return false;
  if (left.rows.length !== right.rows.length) return false;
  for (let rowIndex = 0; rowIndex < left.rows.length; rowIndex += 1) {
    const leftRow = left.rows[rowIndex] ?? [];
    const rightRow = right.rows[rowIndex] ?? [];
    if (!areArraysEqual(leftRow, rightRow)) return false;
  }
  return true;
};

export default function DataGridEditor({ tableData, onChange }: DataGridEditorProps) {
  const reactId = useId();
  const containerId = useMemo(
    () => `datagridxl-${reactId.replace(/:/g, "")}`,
    [reactId]
  );
  const gridRef = useRef<DataGridXLInstance | null>(null);
  const latestTableDataRef = useRef<TableData>(tableData ?? SAMPLE_TABLE);
  const onChangeRef = useRef<DataGridEditorProps["onChange"]>(onChange);
  const changeHandlerRef = useRef<((event: unknown) => void) | null>(null);
  const syncingRef = useRef(false);
  const [status, setStatus] = useState("Loading editor...");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (tableData) {
      latestTableDataRef.current = tableData;
    }
  }, [tableData]);

  const initializeGrid = useCallback(
    (nextData: TableData) => {
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
      if (changeHandlerRef.current) {
        gridRef.current?.events?.off?.("change", changeHandlerRef.current);
      }
      gridRef.current?.destroy?.();
      syncingRef.current = true;
      const grid = new DataGridXL(containerId, {
        data: tableDataToObjects(nextData),
      });
      gridRef.current = grid;
      const handleGridChange = () => {
        if (syncingRef.current) return;
        const handler = onChangeRef.current;
        if (!handler || !grid.getData) return;
        const data = grid.getData();
        if (!Array.isArray(data)) return;
        handler(objectsToTableData(data as Array<Record<string, unknown>>));
      };
      changeHandlerRef.current = handleGridChange;
      grid.events?.on?.("change", handleGridChange);
      syncingRef.current = false;
      setStatus("Editor ready.");
    },
    [containerId]
  );

  useEffect(() => {
    let isMounted = true;

    if (window.DataGridXL) {
      if (isMounted) {
        initializeGrid(latestTableDataRef.current);
      }
      return () => {
        isMounted = false;
        if (changeHandlerRef.current) {
          gridRef.current?.events?.off?.("change", changeHandlerRef.current);
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

    const handleLoad = () => {
      if (!isMounted) return;
      initializeGrid(latestTableDataRef.current);
    };
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
      if (changeHandlerRef.current) {
        gridRef.current?.events?.off?.("change", changeHandlerRef.current);
      }
      gridRef.current?.destroy?.();
      gridRef.current = null;
    };
  }, [containerId, initializeGrid]);

  useEffect(() => {
    if (!tableData) return;
    const grid = gridRef.current;
    if (!grid?.getData || !grid.setCellValues) return;
    const currentData = grid.getData();
    if (!Array.isArray(currentData)) return;

    const currentTable = objectsToTableData(currentData as Array<Record<string, unknown>>);
    if (areTablesEqual(currentTable, tableData)) return;

    if (!areArraysEqual(currentTable.headers, tableData.headers)) {
      initializeGrid(tableData);
      return;
    }

    syncingRef.current = true;
    const currentRows = currentTable.rows.length;
    const currentCols = currentTable.headers.length;
    const nextRows = tableData.rows.length;
    const nextCols = tableData.headers.length;

    if (grid.deleteCols && nextCols < currentCols) {
      grid.deleteCols([nextCols, currentCols - 1]);
    }
    if (grid.deleteRows && nextRows < currentRows) {
      grid.deleteRows([nextRows, currentRows - 1]);
    }

    const values = tableData.rows.map((row) =>
      tableData.headers.map((_, index) => row[index] ?? "")
    );
    if (values.length > 0 && values[0]?.length) {
      grid.setCellValues({ x: 0, y: 0 }, values, true);
    }
    syncingRef.current = false;
  }, [initializeGrid, tableData]);

  return (
    <div className="space-y-3">
      <div
        id={containerId}
        data-testid="dgxl-editor"
        className="h-[420px] w-full overflow-hidden rounded-lg border bg-white"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{status}</span>
      </div>
    </div>
  );
}
