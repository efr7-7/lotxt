import type { DocumentStatus } from "@/stores/editor-store";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "text-muted-foreground", bg: "bg-muted" },
  review: { label: "Review", color: "text-amber-600", bg: "bg-amber-500/10" },
  scheduled: { label: "Scheduled", color: "text-blue-600", bg: "bg-blue-500/10" },
  published: { label: "Published", color: "text-emerald-600", bg: "bg-emerald-500/10" },
};

const STATUS_ORDER: DocumentStatus[] = ["draft", "review", "scheduled", "published"];

interface Props {
  status: DocumentStatus;
  onClick?: (newStatus: DocumentStatus) => void;
  size?: "sm" | "md";
}

export function DocumentStatusBadge({ status, onClick, size = "sm" }: Props) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  const handleClick = () => {
    if (!onClick) return;
    const idx = STATUS_ORDER.indexOf(status);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    onClick(next);
  };

  return (
    <span
      onClick={onClick ? handleClick : undefined}
      className={cn(
        "inline-flex items-center rounded-full font-medium select-none",
        config.bg,
        config.color,
        onClick && "cursor-pointer hover:opacity-80 transition-opacity",
        size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
      )}
    >
      {config.label}
    </span>
  );
}
