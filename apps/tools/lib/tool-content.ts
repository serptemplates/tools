// Helper to get tool content from the tools data
import toolsData from '@serp-tools/app-core/data/tools.json';
import type { Tool, ToolContent } from '@/types';

const tools = toolsData as Tool[];

// Create a map of tool content by ID
export const toolContent: Record<string, ToolContent | undefined> = {};

// Create a map to track which tools require FFmpeg
export const toolRequiresFFmpeg: Record<string, boolean> = {};

tools.forEach(tool => {
  if (tool.content) {
    // Add requiresFFmpeg flag to the tool content if it exists
    if (tool.requiresFFmpeg) {
      tool.content.tool.requiresFFmpeg = true;
    }
    tool.content.tool.id = tool.id;
    tool.content.tool.route = tool.route;
    tool.content.tool.operation = tool.operation;
    toolContent[tool.id] = tool.content;
  }
  // Track FFmpeg requirement
  toolRequiresFFmpeg[tool.id] = tool.requiresFFmpeg || false;
});

// Helper to get content for a specific tool
export function getToolContent(toolId: string): ToolContent | undefined {
  return toolContent[toolId];
}

// Helper to check if a tool requires FFmpeg
export function requiresFFmpeg(toolId: string): boolean {
  return toolRequiresFFmpeg[toolId] || false;
}
