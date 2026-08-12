import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ContentStatus } from "@/lib/admin/schemas";

const STATUS_STYLES: Record<ContentStatus, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  HIDDEN: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  ARCHIVED: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABELS: Record<ContentStatus, string> = {
  ACTIVE: "Active",
  HIDDEN: "Hidden",
  ARCHIVED: "Archived",
};

export function StatusBadge({ status, className }: { status: ContentStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("border", STATUS_STYLES[status], className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
