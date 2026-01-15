"use client";

import { Label } from "@serp-tools/ui/components/label";
import { Tabs, TabsList, TabsTrigger } from "@serp-tools/ui/components/tabs";
import { ViewMode } from "./types";

type ViewToggleProps = {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
};

export default function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <Tabs value={value} onValueChange={(nextValue) => onChange(nextValue as ViewMode)}>
      <div className="flex items-center justify-between">
        <Label>View</Label>
        <TabsList className="h-9 w-fit bg-muted/50">
          <TabsTrigger value="raw" className="px-3">
            Raw
          </TabsTrigger>
          <TabsTrigger value="preview" className="px-3">
            Preview
          </TabsTrigger>
        </TabsList>
      </div>
    </Tabs>
  );
}
