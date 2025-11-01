"use client";

import { useMemo } from "react";
import type { ExtensionRecord } from "@serp-extensions/app-core/lib/catalog";

import { cn } from "@serp-extensions/ui/lib/utils";

import { ToolCard } from "@/components/ToolCard";
import { mapExtensionToToolCard } from "@/lib/tool-card";

type ExtensionToolGridProps = {
  extensions: ExtensionRecord[];
  className?: string;
  columnsClassName?: string;
};

export function ExtensionToolGrid({ extensions, className = "", columnsClassName = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" }: ExtensionToolGridProps) {
  const tools = useMemo(() => extensions.map(mapExtensionToToolCard), [extensions]);

  if (tools.length === 0) {
    return null;
  }

  return (
    <div className={cn("grid gap-5", columnsClassName, className)}>
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
}
