import Link from "next/link";
import { Card } from "@serp-tools/ui/components/card";
import { Badge } from "@serp-tools/ui/components/badge";
import { ArrowRight } from "lucide-react";
import type { ProcessedExtension } from "@/lib/extensions-api";

export function ExtensionCard({ ext }: { ext: ProcessedExtension }) {
  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {ext.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ext.logoUrl} alt={ext.name} className="h-10 w-10 rounded" />
        ) : (
          <div className="h-10 w-10 rounded bg-muted" />
        )}
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{ext.name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {ext.rating !== undefined && <span>⭐ {ext.rating.toFixed(1)}</span>}
            {ext.users && (
              <>
                <span>•</span>
                <span>{ext.users} users</span>
              </>
            )}
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-3">{ext.description}</p>
      <div className="flex flex-wrap gap-1">
        {ext.tags?.slice(0, 4).map((t) => (
          <Badge key={t} variant="secondary">{t}</Badge>
        ))}
      </div>
      <div className="mt-auto pt-2">
        <Link
          href={`/extensions/${encodeURIComponent(ext.id)}`}
          className="inline-flex items-center text-sm text-primary hover:underline"
        >
          View details <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}

