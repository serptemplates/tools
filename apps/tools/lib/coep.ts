import { requiresVideoConversion } from "@/lib/capabilities";
import type { ToolInfo } from "@/types";

const TRANSCRIBE_TOOL_IDS = new Set([
  "audio-to-text",
  "audio-to-transcript",
  "mp3-to-transcript",
  "mp4-to-transcript",
  "tiktok-to-transcript",
  "video-to-transcript",
  "youtube-to-transcript",
  "youtube-to-transcript-generator",
]);

export function requiresCoepForTool(tool?: ToolInfo) {
  if (!tool) return false;
  if (tool.requiresFFmpeg) return true;
  if (tool.id && TRANSCRIBE_TOOL_IDS.has(tool.id)) return true;
  if (tool.operation === "convert" && tool.from && tool.to) {
    return requiresVideoConversion(tool.from, tool.to);
  }
  return false;
}
