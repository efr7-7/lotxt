import { useCaptureStore } from "@/stores/capture-store";
import { Wand2, X, Lightbulb, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Simple relative time ──

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// ── Max items shown ──

const MAX_VISIBLE = 5;

// ────────────────────────────────────────────
// IdeaInbox
// ────────────────────────────────────────────

export default function IdeaInbox() {
  const items = useCaptureStore((s) => s.getUnpromoted());
  const removeItem = useCaptureStore((s) => s.removeItem);
  const openCapture = useCaptureStore((s) => s.openCapture);

  const visibleItems = items.slice(0, MAX_VISIBLE);
  const totalCount = items.length;

  return (
    <section
      className="flex flex-col gap-3"
      style={{
        animation:
          "slide-up 0.35s cubic-bezier(0.16,1,0.3,1) 0.08s both",
      }}
    >
      {/* ── Section Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Idea Inbox
          </h2>
          {totalCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold tabular-nums">
              {totalCount}
            </span>
          )}
        </div>
        {totalCount > MAX_VISIBLE && (
          <button
            onClick={openCapture}
            className="flex items-center gap-1 text-[12px] font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View all ({totalCount})
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* ── Items or Empty State ── */}
      {visibleItems.length > 0 ? (
        <div className="flex flex-col gap-2">
          {visibleItems.map((item, index) => (
            <IdeaItem
              key={item.id}
              id={item.id}
              title={item.title}
              body={item.body}
              createdAt={item.createdAt}
              index={index}
              onPromote={() =>
                useCaptureStore.getState().promoteToDocument(item.id)
              }
              onDismiss={() => removeItem(item.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </section>
  );
}

// ────────────────────────────────────────────
// IdeaItem
// ────────────────────────────────────────────

function IdeaItem({
  id,
  title,
  body,
  createdAt,
  index,
  onPromote,
  onDismiss,
}: {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  index: number;
  onPromote: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-card/50 p-3",
        "hover:border-border/80 hover:bg-card/70",
        "transition-all duration-150",
      )}
      style={{
        animation: "slide-up 0.3s cubic-bezier(0.16,1,0.3,1) both",
        animationDelay: `${index * 40}ms`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-foreground truncate">
            {title || "Untitled idea"}
          </p>
          <p className="text-[11px] text-muted-foreground/50 mt-0.5">
            {relativeTime(createdAt)}
          </p>
          {body && (
            <p className="text-[11px] text-muted-foreground/40 mt-1 line-clamp-1">
              {body}
            </p>
          )}
        </div>

        {/* Action buttons — visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
          <button
            onClick={onPromote}
            title="Promote to document"
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center",
              "text-primary/60 hover:text-primary hover:bg-primary/10",
              "transition-colors duration-150",
            )}
          >
            <Wand2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDismiss}
            title="Dismiss"
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center",
              "text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10",
              "transition-colors duration-150",
            )}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// EmptyState
// ────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="rounded-xl border border-border bg-card/30 p-8 flex flex-col items-center justify-center text-center">
      <Lightbulb className="w-8 h-8 text-muted-foreground/20 mb-3" />
      <p className="text-[13px] text-muted-foreground/50 leading-relaxed">
        Your ideas are waiting to become something.
      </p>
      <p className="text-[12px] text-muted-foreground/40 mt-1.5">
        Press{" "}
        <kbd className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted border border-border text-[11px] font-mono font-medium text-muted-foreground/60">
          Ctrl+.
        </kbd>{" "}
        anytime to capture one.
      </p>
    </div>
  );
}
