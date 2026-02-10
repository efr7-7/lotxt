import { useEffect } from "react";
import { useSessionStore } from "@/stores/session-store";
import { useEditorStore } from "@/stores/editor-store";
import { X, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export function SessionGoalBar() {
  const currentSession = useSessionStore((s) => s.currentSession);
  const endSession = useSessionStore((s) => s.endSession);
  const checkProgress = useSessionStore((s) => s.checkProgress);
  const wordCount = useEditorStore((s) => s.currentDocument.wordCount);

  // Check progress whenever word count changes — triggers celebration when goal met
  useEffect(() => {
    if (currentSession?.isActive) {
      checkProgress(wordCount);
    }
  }, [wordCount, currentSession?.isActive, checkProgress]);

  // Only render when there is a session with a word goal
  if (!currentSession || currentSession.goalWords === null) {
    return null;
  }

  const goalWords = currentSession.goalWords;
  const wordsWritten = Math.max(0, wordCount - currentSession.startWordCount);
  const progressPercent = Math.min(100, (wordsWritten / goalWords) * 100);
  const isComplete = progressPercent >= 100;

  return (
    <div
      className={cn(
        "h-9 px-4 flex items-center gap-3 border-b border-border/30 shrink-0",
        "animate-in slide-in-from-top-1 fade-in duration-200",
        isComplete ? "bg-emerald-500/5" : "bg-card/50",
      )}
    >
      {/* Left: icon + word count */}
      <div className="flex items-center gap-2 shrink-0">
        <Target
          className={cn(
            "w-3.5 h-3.5",
            isComplete ? "text-emerald-500/80" : "text-primary/60",
          )}
        />
        <span
          className={cn(
            "text-[12px] font-medium tabular-nums",
            isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-foreground/70",
          )}
        >
          {wordsWritten.toLocaleString()} / {goalWords.toLocaleString()} words
        </span>
      </div>

      {/* Center: progress bar track */}
      <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isComplete ? "bg-emerald-500" : "bg-primary",
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Right: percentage + cancel button */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] text-muted-foreground/50 tabular-nums">
          {Math.round(progressPercent)}%
        </span>
        <button
          onClick={endSession}
          className="p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-accent/60 transition-colors"
          title="End session"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
