import { useState, useEffect, useRef, useCallback } from "react";
import { useCaptureStore } from "@/stores/capture-store";
import { toast } from "@/stores/toast-store";
import { Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── QuickCapture ───
   Global idea-capture dialog triggered by Ctrl+.
   Glass-style overlay matching the CommandPalette pattern.
   ──────────────────── */

export function QuickCapture() {
  const isDialogOpen = useCaptureStore((s) => s.isDialogOpen);
  const closeCapture = useCaptureStore((s) => s.closeCapture);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  /* ── Auto-focus title input when dialog opens ── */
  useEffect(() => {
    if (isDialogOpen) {
      setTitle("");
      setBody("");
      setShowDetails(false);
      setCapturing(false);
      // Small delay so the DOM is rendered before focus
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [isDialogOpen]);

  /* ── Escape to close ── */
  useEffect(() => {
    if (!isDialogOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeCapture();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDialogOpen, closeCapture]);

  /* ── Click outside closes ── */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) {
        closeCapture();
      }
    },
    [closeCapture],
  );

  /* ── Submit logic ── */
  const handleSubmit = useCallback(() => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    // Trigger sparkle glow
    setCapturing(true);

    // Brief delay for the glow animation, then save & close
    setTimeout(() => {
      useCaptureStore.getState().addItem(trimmedTitle, body.trim());
      toast.success("\u2728 Idea captured");
      setCapturing(false);
      // addItem already sets isDialogOpen to false
    }, 400);
  }, [title, body]);

  /* ── Keyboard handlers ── */
  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          // Ctrl+Enter: submit with body
          handleSubmit();
        } else {
          // Enter: submit title-only
          handleSubmit();
        }
      }
    },
    [handleSubmit],
  );

  const handleBodyKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  if (!isDialogOpen) return null;

  return (
    <>
      {/* Inline keyframes for the entrance animation */}
      <style>{`
        @keyframes quick-capture-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      <div
        ref={backdropRef}
        className="fixed inset-0 z-50 flex items-center justify-center"
        onClick={handleBackdropClick}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

        {/* Card */}
        <div
          className={cn(
            "relative w-full max-w-[480px] mx-4",
            "bg-popover/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-overlay",
            "flex flex-col",
            "transition-shadow duration-400",
          )}
          style={{
            animation: "quick-capture-in 150ms cubic-bezier(0.16, 1, 0.3, 1) both",
            boxShadow: capturing
              ? "0 0 30px hsl(var(--primary) / 0.25), var(--shadow-xl)"
              : undefined,
          }}
        >
          {/* ── Header ── */}
          <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-foreground flex-1">
              Quick Capture
            </h2>
            <kbd className="inline-flex items-center h-5 px-1.5 rounded border border-border/60 bg-muted/40 text-[10px] font-mono text-muted-foreground/70 shadow-[0_1px_0_hsl(var(--border))]">
              Ctrl+.
            </kbd>
          </div>

          {/* ── Title Input ── */}
          <div className="px-5">
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              placeholder="What's the idea?"
              className={cn(
                "w-full bg-transparent text-[15px] font-medium text-foreground",
                "placeholder:text-muted-foreground/40",
                "border-b border-border/40 focus:border-primary/50",
                "outline-none py-2.5 transition-colors",
              )}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* ── Details Toggle ── */}
          <div className="px-5 pt-2.5">
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className={cn(
                "flex items-center gap-1.5 text-[12px] font-medium",
                "text-muted-foreground/60 hover:text-muted-foreground transition-colors",
              )}
            >
              {showDetails ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              Add details
            </button>
          </div>

          {/* ── Body Textarea (collapsible) ── */}
          {showDetails && (
            <div className="px-5 pt-2">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={handleBodyKeyDown}
                placeholder="Add some notes..."
                rows={3}
                className={cn(
                  "w-full bg-muted/30 text-[13px] text-foreground/85",
                  "placeholder:text-muted-foreground/35",
                  "border border-border/30 rounded-lg",
                  "outline-none focus:border-primary/40",
                  "resize-none p-3 transition-colors",
                )}
              />
            </div>
          )}

          {/* ── Footer ── */}
          <div className="flex items-center justify-between px-5 py-3.5 mt-1">
            <span className="text-[11px] text-muted-foreground/40">
              Enter to save &middot; Esc to close
            </span>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!title.trim() || capturing}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 active:scale-95 transition-all",
                "disabled:opacity-40 disabled:pointer-events-none",
              )}
            >
              Capture
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
