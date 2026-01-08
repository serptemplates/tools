import type { ToolRunEvent } from "./types";

type ToolRunHandle = {
  runId: string;
  finishSuccess: (args: { outputBytes?: number; metadata?: Record<string, unknown> }) => void;
  finishFailure: (args: { errorCode?: string; metadata?: Record<string, unknown> }) => void;
};

const TELEMETRY_ENDPOINT = "/api/telemetry";

function sendTelemetry(event: ToolRunEvent) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify(event);
  if (navigator.sendBeacon) {
    navigator.sendBeacon(TELEMETRY_ENDPOINT, new Blob([body], { type: "application/json" }));
    return;
  }

  fetch(TELEMETRY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  }).catch(() => {});
}

export function beginToolRun(args: {
  toolId: string;
  from?: string;
  to?: string;
  inputBytes?: number;
  metadata?: Record<string, unknown>;
}): ToolRunHandle {
  if (typeof window === "undefined") {
    return {
      runId: "server",
      finishSuccess: () => {},
      finishFailure: () => {},
    };
  }

  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const startTime = performance.now();

  sendTelemetry({
    event: "tool_run_started",
    runId,
    toolId: args.toolId,
    from: args.from,
    to: args.to,
    startedAt,
    inputBytes: args.inputBytes,
    metadata: args.metadata,
  });

  return {
    runId,
    finishSuccess: ({ outputBytes, metadata }) => {
      const durationMs = Math.round(performance.now() - startTime);
      sendTelemetry({
        event: "tool_run_succeeded",
        runId,
        toolId: args.toolId,
        from: args.from,
        to: args.to,
        startedAt,
        durationMs,
        inputBytes: args.inputBytes,
        outputBytes,
        metadata,
      });
    },
    finishFailure: ({ errorCode, metadata }) => {
      const durationMs = Math.round(performance.now() - startTime);
      sendTelemetry({
        event: "tool_run_failed",
        runId,
        toolId: args.toolId,
        from: args.from,
        to: args.to,
        startedAt,
        durationMs,
        inputBytes: args.inputBytes,
        errorCode,
        metadata,
      });
    },
  };
}
