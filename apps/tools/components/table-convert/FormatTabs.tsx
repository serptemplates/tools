"use client";

import { Badge } from "@serp-tools/ui/components/badge";
import { Label } from "@serp-tools/ui/components/label";
import { Tabs, TabsList, TabsTrigger } from "@serp-tools/ui/components/tabs";
import { FormatOption } from "./types";

type FormatTabsProps = {
  label: string;
  badgeLabel: string;
  options: FormatOption[];
  value: string;
  onChange: (value: string) => void;
};

export default function FormatTabs({
  label,
  badgeLabel,
  options,
  value,
  onChange,
}: FormatTabsProps) {
  return (
    <Tabs value={value} onValueChange={onChange}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Badge variant="outline">{badgeLabel}</Badge>
      </div>
      <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-muted/50">
        {options.map((format) => (
          <TabsTrigger key={format.value} value={format.value} className="px-3">
            {format.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
