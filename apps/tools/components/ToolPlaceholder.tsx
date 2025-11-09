import { Card, CardContent, CardHeader, CardTitle } from "@serp-tools/ui/components/card";
import { Wrench } from "lucide-react";

export default function ToolPlaceholder({ title }: { title: string }) {
  return (
    <div className="container py-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This tool is coming soon! Check back later.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}