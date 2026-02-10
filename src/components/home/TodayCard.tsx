import { useMemo } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { useStreakStore } from "@/stores/streak-store";
import { useFocusStore } from "@/stores/focus-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  FileText,
  ArrowRight,
  Flame,
  Clock,
  Target,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Heatmap colour for a given word count ──

function heatmapColor(wordsWritten: number): string {
  if (wordsWritten >= 500) return "bg-primary/70";
  if (wordsWritten >= 100) return "bg-primary/40";
  if (wordsWritten >= 1) return "bg-primary/20";
  return "bg-muted/30";
}

// ── Build last-14-day date strings ──

function getLast14Days(): string[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
}

// ────────────────────────────────────────────
// TodayCard
// ────────────────────────────────────────────

export default function TodayCard() {
  const { documents, currentDocument, loadDocument, createNewDocument } =
    useEditorStore();
  const { setActiveWorkspace } = useWorkspaceStore();
  const streakDays = useStreakStore((s) => s.days);
  const currentStreak = useStreakStore((s) => s.currentStreak);
  const dailyWordGoal = useStreakStore((s) => s.dailyWordGoal);
  const getToday = useStreakStore((s) => s.getToday);
  const completedPomodoros = useFocusStore((s) => s.completedPomodoros);

  // ── All docs: stored + current ──

  const allDocuments = useMemo(() => {
    const stored = documents ?? [];
    const ids = new Set(stored.map((d) => d.id));
    if (currentDocument && !ids.has(currentDocument.id)) {
      return [currentDocument, ...stored];
    }
    return stored;
  }, [documents, currentDocument]);

  // ── Most recently edited document ──

  const recentDoc = useMemo(() => {
    if (allDocuments.length === 0) return null;
    return [...allDocuments].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )[0];
  }, [allDocuments]);

  // ── Today's progress ──

  const today = getToday();
  const wordsToday = today.wordsWritten;
  const focusMinutes = today.focusMinutes;
  const wordProgress = dailyWordGoal > 0
    ? Math.min(100, Math.round((wordsToday / dailyWordGoal) * 100))
    : 0;

  // ── Heatmap data ──

  const heatmapDates = useMemo(() => getLast14Days(), []);

  const heatmapData = useMemo(() => {
    const dayMap = new Map(streakDays.map((d) => [d.date, d]));
    const todayStr = new Date().toISOString().slice(0, 10);

    return heatmapDates.map((date) => {
      const day = dayMap.get(date);
      return {
        date,
        dayOfMonth: new Date(date + "T12:00:00").getDate(),
        wordsWritten: day?.wordsWritten ?? 0,
        isToday: date === todayStr,
      };
    });
  }, [heatmapDates, streakDays]);

  // ── Handlers ──

  const handleContinueWriting = () => {
    if (recentDoc) {
      useEditorStore.getState().loadDocument(recentDoc.id);
      setActiveWorkspace("editor");
    }
  };

  const handleStartFirstDraft = () => {
    createNewDocument();
    setActiveWorkspace("editor");
  };

  // ── Truncation helper ──

  const truncate = (str: string, max: number) =>
    str.length <= max ? str : str.slice(0, max - 1) + "\u2026";

  return (
    <div
      className="rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)]"
      style={{
        animation: "slide-up 0.3s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      {/* ── Top section: Continue Writing + Today's Progress ── */}
      <div className="flex flex-col md:flex-row">
        {/* ── Left: Continue Writing (~60%) ── */}
        <div className="flex-[3] p-6 flex flex-col justify-center gap-3 border-b md:border-b-0 md:border-r border-border">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary/60" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Today
            </span>
          </div>

          {recentDoc ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                  <FileText className="w-4.5 h-4.5 text-primary/60" />
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-foreground truncate">
                    {truncate(recentDoc.title || "Untitled", 30)}
                  </p>
                  <p className="text-[11px] text-muted-foreground/50">
                    {recentDoc.wordCount.toLocaleString()} words
                  </p>
                </div>
              </div>
              <button
                onClick={handleContinueWriting}
                className={cn(
                  "mt-1 self-start inline-flex items-center gap-1.5",
                  "px-3.5 py-1.5 rounded-lg",
                  "bg-primary text-primary-foreground",
                  "text-[12px] font-medium",
                  "hover:bg-primary/90 active:scale-[0.97]",
                  "transition-all duration-150",
                  "shadow-[var(--shadow-xs)]",
                )}
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[14px] text-muted-foreground/60">
                No documents yet. Start your first draft.
              </p>
              <button
                onClick={handleStartFirstDraft}
                className={cn(
                  "mt-1 self-start inline-flex items-center gap-1.5",
                  "px-3.5 py-1.5 rounded-lg",
                  "bg-primary text-primary-foreground",
                  "text-[12px] font-medium",
                  "hover:bg-primary/90 active:scale-[0.97]",
                  "transition-all duration-150",
                  "shadow-[var(--shadow-xs)]",
                )}
              >
                Start your first draft
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* ── Right: Today's Progress (~40%) ── */}
        <div className="flex-[2] p-6 flex flex-col gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Progress
          </span>

          <div className="flex flex-col gap-2.5">
            {/* Words Today */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground/50" />
                  <span className="text-[12px] text-muted-foreground">
                    Words
                  </span>
                </div>
                <span className="text-[12px] font-semibold text-foreground tabular-nums">
                  {wordsToday.toLocaleString()}
                  <span className="text-muted-foreground/40 font-normal">
                    /{dailyWordGoal.toLocaleString()}
                  </span>
                </span>
              </div>
              {/* Mini progress bar */}
              <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${wordProgress}%` }}
                />
              </div>
            </div>

            {/* Streak */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Flame
                  className={cn(
                    "w-3.5 h-3.5",
                    currentStreak > 0
                      ? "text-orange-400"
                      : "text-muted-foreground/50",
                  )}
                />
                <span className="text-[12px] text-muted-foreground">
                  Streak
                </span>
              </div>
              <span className="text-[12px] font-semibold text-foreground tabular-nums">
                {currentStreak}{" "}
                <span className="text-muted-foreground/40 font-normal">
                  days
                </span>
              </span>
            </div>

            {/* Focus Minutes */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground/50" />
                <span className="text-[12px] text-muted-foreground">
                  Focus
                </span>
              </div>
              <span className="text-[12px] font-semibold text-foreground tabular-nums">
                {focusMinutes}{" "}
                <span className="text-muted-foreground/40 font-normal">
                  min
                </span>
              </span>
            </div>

            {/* Pomodoros */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-muted-foreground/50" />
                <span className="text-[12px] text-muted-foreground">
                  Pomodoros
                </span>
              </div>
              <span className="text-[12px] font-semibold text-foreground tabular-nums">
                {completedPomodoros}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom: 14-Day Heatmap ── */}
      <div className="border-t border-border px-6 py-4">
        <div className="flex items-center gap-2 mb-2.5">
          <Flame className="w-3.5 h-3.5 text-muted-foreground/40" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
            Last 14 Days
          </span>
        </div>
        <div className="flex items-end gap-1.5">
          {heatmapData.map((cell) => (
            <div key={cell.date} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-5 h-5 rounded-sm transition-colors",
                  heatmapColor(cell.wordsWritten),
                  cell.isToday && "ring-1 ring-primary/50 ring-offset-1 ring-offset-card",
                )}
                title={`${cell.date}: ${cell.wordsWritten} words`}
              />
              <span className="text-[9px] text-muted-foreground/40 tabular-nums leading-none">
                {cell.dayOfMonth}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
