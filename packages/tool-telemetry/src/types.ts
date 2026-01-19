export type ToolRunEventType = "tool_run_started" | "tool_run_succeeded" | "tool_run_failed";

export type ToolRunStatus = "started" | "succeeded" | "failed";

export type ToolRunEvent = {
  event: ToolRunEventType;
  runId: string;
  toolId: string;
  from?: string;
  to?: string;
  startedAt: string;
  durationMs?: number;
  inputBytes?: number;
  outputBytes?: number;
  errorCode?: string;
  metadata?: Record<string, unknown>;
};

export type ToolRunRecord = {
  toolId: string;
  status: ToolRunStatus;
  startedAt: Date;
  durationMs?: number | null;
  inputBytes?: number | null;
  outputBytes?: number | null;
  errorCode?: string | null;
  metadata?: Record<string, unknown> | null;
};
