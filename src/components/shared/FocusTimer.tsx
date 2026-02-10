import { useEffect, useRef, useCallback } from "react";
import { Timer, Play, Pause, SkipForward, X, Coffee, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/stores/toast-store";
import { useFocusStore, type TimerState } from "@/stores/focus-store";

/* ─── Helpers ─── */

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function stateLabel(state: TimerState): string {
  switch (state) {
    case "idle": return "Ready";
    case "work": return "Focus";
    case "short-break": return "Short Break";
    case "long-break": return "Long Break";
  }
}

function transitionMessage(state: TimerState): string {
  switch (state) {
    case "work": return "Break over — time to focus!";
    case "short-break": return "Great work! Take a short break.";
    case "long-break": return "Excellent session! Enjoy a long break.";
    default: return "";
  }
}

/* ─── Circular Progress Ring ─── */

const RING_SIZE = 88;
const STROKE_WIDTH = 4;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ProgressRing({
  progress,
  isBreak,
}: {
  progress: number; // 0-1
  isBreak: boolean;
}) {
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <svg
      width={RING_SIZE}
      height={RING_SIZE}
      className="absolute inset-0 -rotate-90"
    >
      {/* Background track */}
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        className="text-muted/20"
      />
      {/* Progress arc */}
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        className={cn(
          "transition-[stroke-dashoffset] duration-1000 ease-linear",
          isBreak ? "text-emerald-400" : "text-primary",
        )}
      />
    </svg>
  );
}

/* ─── Main Component ─── */

export function FocusTimer() {
  const {
    isTimerVisible,
    toggleTimerVisible,
    timerState,
    secondsRemaining,
    isRunning,
    completedPomodoros,
    totalDeepWorkMinutes,
    workDuration,
    breakDuration,
    longBreakDuration,
    startTimer,
    pauseTimer,
    tick,
    skipToNext,
    resetTimer,
    addDeepWorkSeconds,
  } = useFocusStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Tick loop ── */
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const transition = tick();

        // Track deep work time when ticking in work mode
        if (useFocusStore.getState().timerState === "work" || transition !== null) {
          // We just ticked one second — if we were in work mode before potential transition, count it
        }

        if (transition) {
          toast.info(transitionMessage(transition), 4000);
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, tick]);

  /* ── Track deep work seconds ── */
  useEffect(() => {
    if (isRunning && timerState === "work") {
      const dwInterval = setInterval(() => {
        addDeepWorkSeconds(1);
      }, 1000);
      return () => clearInterval(dwInterval);
    }
  }, [isRunning, timerState, addDeepWorkSeconds]);

  /* ── Keyboard shortcut: Space to toggle ── */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isTimerVisible) return;

      // Don't capture space when user is typing in an input/textarea/contenteditable
      const tag = (e.target as HTMLElement).tagName?.toLowerCase();
      const isEditable =
        tag === "input" ||
        tag === "textarea" ||
        (e.target as HTMLElement).isContentEditable;
      if (isEditable) return;

      if (e.code === "Space") {
        e.preventDefault();
        if (timerState === "idle") {
          startTimer();
        } else if (isRunning) {
          pauseTimer();
        } else {
          startTimer();
        }
      }
    },
    [isTimerVisible, timerState, isRunning, startTimer, pauseTimer],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  /* ── Derived values ── */
  const isBreak = timerState === "short-break" || timerState === "long-break";

  const totalDuration =
    timerState === "work"
      ? workDuration
      : timerState === "short-break"
        ? breakDuration
        : timerState === "long-break"
          ? longBreakDuration
          : workDuration;

  const progress =
    timerState === "idle" ? 1 : (totalDuration - secondsRemaining) / totalDuration;

  if (!isTimerVisible) {
    return (
      <button
        onClick={toggleTimerVisible}
        className={cn(
          "fixed bottom-5 right-20 z-40",
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
          "bg-card/80 border border-border/50 backdrop-blur-md shadow-lg",
          "text-[12px] font-medium text-muted-foreground",
          "hover:text-foreground hover:border-border transition-all duration-200",
          "hover:scale-105 active:scale-95",
        )}
        title="Open Focus Timer"
      >
        <Timer className="w-3.5 h-3.5" />
        <span>Focus</span>
        {completedPomodoros > 0 && (
          <span className="ml-0.5 text-primary font-semibold">{completedPomodoros}</span>
        )}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-5 right-20 z-40",
        "flex flex-col items-center gap-2 p-4 rounded-2xl",
        "bg-card/90 border backdrop-blur-xl shadow-2xl",
        "animate-in fade-in slide-in-from-bottom-3 duration-300",
        isBreak ? "border-emerald-500/25" : "border-border/50",
      )}
      style={{ minWidth: 160 }}
    >
      {/* ── Header ── */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isBreak ? (
            <Coffee className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Flame
              className={cn(
                "w-3.5 h-3.5",
                timerState === "work" ? "text-primary" : "text-muted-foreground",
              )}
            />
          )}
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-wider",
              isBreak ? "text-emerald-400" : "text-muted-foreground",
            )}
          >
            {stateLabel(timerState)}
          </span>
        </div>
        <button
          onClick={() => {
            if (isRunning) pauseTimer();
            toggleTimerVisible();
          }}
          className="w-5 h-5 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
          title="Minimize timer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* ── Timer Ring ── */}
      <div className="relative flex items-center justify-center" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <ProgressRing progress={progress} isBreak={isBreak} />
        <span
          className={cn(
            "relative text-xl font-mono font-bold tabular-nums",
            isBreak ? "text-emerald-400" : "text-foreground",
          )}
        >
          {formatTime(secondsRemaining)}
        </span>
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center gap-1.5">
        {/* Play / Pause */}
        {timerState === "idle" ? (
          <button
            onClick={startTimer}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full",
              "bg-primary text-primary-foreground",
              "hover:opacity-90 active:scale-95 transition-all",
            )}
            title="Start focus session (Space)"
          >
            <Play className="w-3.5 h-3.5 ml-0.5" />
          </button>
        ) : isRunning ? (
          <button
            onClick={pauseTimer}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full",
              isBreak
                ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                : "bg-primary/15 text-primary hover:bg-primary/25",
              "active:scale-95 transition-all",
            )}
            title="Pause (Space)"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={startTimer}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full",
              isBreak
                ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                : "bg-primary/15 text-primary hover:bg-primary/25",
              "active:scale-95 transition-all",
            )}
            title="Resume (Space)"
          >
            <Play className="w-3.5 h-3.5 ml-0.5" />
          </button>
        )}

        {/* Skip */}
        {timerState !== "idle" && (
          <button
            onClick={() => {
              const next = skipToNext();
              toast.info(transitionMessage(next), 3000);
            }}
            className={cn(
              "flex items-center justify-center w-7 h-7 rounded-full",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-muted/50 active:scale-95 transition-all",
            )}
            title="Skip to next"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Reset (only when not idle) */}
        {timerState !== "idle" && (
          <button
            onClick={() => {
              resetTimer();
              toast.info("Timer reset", 2000);
            }}
            className={cn(
              "flex items-center justify-center w-7 h-7 rounded-full",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-muted/50 active:scale-95 transition-all",
            )}
            title="Reset timer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* ── Stats Footer ── */}
      <div className="w-full flex items-center justify-between pt-1 border-t border-border/30">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Flame className="w-3 h-3 text-primary/60" />
          <span>{completedPomodoros} done</span>
        </div>
        <div className="text-[10px] text-muted-foreground">
          {Math.round(totalDeepWorkMinutes)}m deep work
        </div>
      </div>
    </div>
  );
}
