import { useEffect, useState, useMemo, useCallback } from "react";
import { useSessionStore, getMotivationalLine } from "@/stores/session-store";
import { cn } from "@/lib/utils";

/* ─── Celebration ───
   Full-screen celebration overlay when writing goals are hit.
   Shows confetti, session stats, and a motivational line.
   Auto-dismisses after 3 seconds.
   ──────────────────── */

const CONFETTI_COLORS = [
  "hsl(var(--primary))",
  "#34d399",
  "#fbbf24",
  "#a78bfa",
  "#fb7185",
];

export function Celebration() {
  const showCelebration = useSessionStore((s) => s.showCelebration);
  const lastSessionStats = useSessionStore((s) => s.lastSessionStats);
  const dismissCelebration = useSessionStore((s) => s.dismissCelebration);

  const [entered, setEntered] = useState(false);

  /* ── Motivational line — generated once per display ── */
  const motivationalLine = useMemo(() => {
    if (!showCelebration) return "";
    return getMotivationalLine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCelebration]);

  /* ── Confetti configs — generated once per display ── */
  const confetti = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        left: `${5 + Math.random() * 90}%`,
        color: CONFETTI_COLORS[i % 5],
        delay: `${Math.random() * 0.8}s`,
        duration: `${2 + Math.random() * 1.5}s`,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showCelebration],
  );

  /* ── Entrance animation trigger ── */
  useEffect(() => {
    if (showCelebration) {
      // Trigger the entrance on next frame so the transition applies
      const raf = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setEntered(false);
    }
  }, [showCelebration]);

  /* ── Auto-dismiss after 3 seconds ── */
  useEffect(() => {
    if (!showCelebration) return;

    const timer = setTimeout(() => {
      dismissCelebration();
    }, 3000);

    return () => clearTimeout(timer);
  }, [showCelebration, dismissCelebration]);

  /* ── Click anywhere to dismiss ── */
  const handleClick = useCallback(() => {
    dismissCelebration();
  }, [dismissCelebration]);

  if (!showCelebration) return null;

  const wordsWritten = lastSessionStats?.wordsWritten ?? 0;
  const minutes = lastSessionStats?.minutes ?? 0;

  return (
    <>
      {/* Inline keyframes for confetti-fall animation */}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes celebration-card-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      {/* Overlay */}
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center cursor-pointer"
        onClick={handleClick}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Radial gradient glow behind card */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.08)_0%,transparent_70%)]" />

        {/* Confetti particles */}
        {confetti.map((c, i) => (
          <div
            key={i}
            className="absolute top-0 w-1.5 h-1.5 rounded-full pointer-events-none"
            style={{
              left: c.left,
              backgroundColor: c.color,
              animation: `confetti-fall ${c.duration} ${c.delay} cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            }}
          />
        ))}

        {/* Card */}
        <div
          className={cn(
            "relative w-full max-w-[400px] mx-4",
            "bg-card border border-border/40 rounded-3xl shadow-2xl",
            "flex flex-col items-center text-center p-10",
            "cursor-default",
          )}
          style={{
            animation:
              "celebration-card-in 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sparkle emoji */}
          <div className="text-4xl mb-4 select-none">{"\u2728"}</div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-foreground mb-3">
            You did it!
          </h2>

          {/* Stats */}
          <div className="flex flex-col items-center gap-1 mb-1">
            <span className="text-lg font-semibold text-foreground tabular-nums">
              {wordsWritten.toLocaleString()} words written
            </span>
            <span className="text-sm text-muted-foreground">
              in {minutes} {minutes === 1 ? "minute" : "minutes"}
            </span>
          </div>

          {/* Motivational line */}
          <p className="text-sm italic text-muted-foreground/70 mt-4 max-w-[280px] leading-relaxed">
            {motivationalLine}
          </p>
        </div>
      </div>
    </>
  );
}
