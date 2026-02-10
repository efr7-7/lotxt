import { useMemo } from "react";
import { useStreakStore, type DayActivity } from "@/stores/streak-store";
import { useEditorStore } from "@/stores/editor-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Flame,
  FileText,
  Clock,
  PenLine,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Metric Card ──

function MetricCard({
  icon: Icon,
  iconColor,
  value,
  label,
  delay,
}: {
  icon: React.ElementType;
  iconColor: string;
  value: string | number;
  label: string;
  delay: number;
}) {
  return (
    <div
      className="rounded-xl border border-border/40 bg-card p-4 flex items-start gap-3"
      style={{
        animation: `slide-up 0.35s cubic-bezier(0.16,1,0.3,1) ${delay}ms both`,
      }}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
          iconColor,
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[20px] font-bold tabular-nums leading-tight">
          {value}
        </div>
        <div className="text-[11px] text-muted-foreground/50 mt-0.5">
          {label}
        </div>
      </div>
    </div>
  );
}

// ── Custom Tooltip ──

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border/40 rounded-lg shadow-lg p-2 text-[12px]">
      <p className="text-muted-foreground/50">{label}</p>
      <p className="font-semibold tabular-nums">
        {payload[0].value.toLocaleString()} words
      </p>
    </div>
  );
}

// ── Heatmap Cell ──

function getHeatmapColor(words: number): string {
  if (words === 0) return "bg-muted/20";
  if (words < 100) return "bg-primary/20";
  if (words < 500) return "bg-primary/40";
  if (words < 1000) return "bg-primary/60";
  return "bg-primary/80";
}

// ── Writing Insights ──

function WritingInsights({ week }: { week: DayActivity[] }) {
  const insights = useMemo(() => {
    const result: { emoji: string; text: string }[] = [];

    // Best day this week
    const bestDay = [...week].sort((a, b) => b.wordsWritten - a.wordsWritten)[0];
    if (bestDay && bestDay.wordsWritten > 0) {
      const dayName = new Date(bestDay.date + "T12:00:00").toLocaleDateString("en", { weekday: "long" });
      result.push({ emoji: "\u{1F3C6}", text: `Your best writing day was ${dayName} (${bestDay.wordsWritten.toLocaleString()} words)` });
    }

    // Average words per day
    const totalWords = week.reduce((sum, d) => sum + d.wordsWritten, 0);
    const activeDays = week.filter(d => d.wordsWritten > 0).length;
    if (activeDays > 0) {
      const avg = Math.round(totalWords / activeDays);
      result.push({ emoji: "\u{1F4CA}", text: `You're averaging ${avg.toLocaleString()} words per active writing day` });
    }

    // Consistency: how many days wrote this week
    if (activeDays >= 5) {
      result.push({ emoji: "\u{1F525}", text: `You wrote ${activeDays} out of 7 days this week — impressive consistency!` });
    } else if (activeDays >= 3) {
      result.push({ emoji: "\u{1F4AA}", text: `${activeDays} active writing days this week — building momentum` });
    } else if (activeDays > 0) {
      result.push({ emoji: "\u2728", text: `${activeDays} writing day${activeDays > 1 ? "s" : ""} this week — every word counts` });
    }

    return result;
  }, [week]);

  if (insights.length === 0) return null;

  return (
    <div
      className="rounded-xl border border-border/40 bg-card p-5 mt-4"
      style={{ animation: "slide-up 0.35s cubic-bezier(0.16,1,0.3,1) 180ms both" }}
    >
      <h3 className="text-[13px] font-semibold mb-3">Insights</h3>
      <div className="space-y-2.5">
        {insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="text-[14px] leading-none mt-0.5">{insight.emoji}</span>
            <p className="text-[13px] text-muted-foreground/70 leading-relaxed">{insight.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ──

export function LocalStatsOverview() {
  const streakState = useStreakStore();
  const week = useStreakStore((s) => s.getWeek());
  const today = useStreakStore((s) => s.getToday());
  const documents = useEditorStore((s) => s.documents);
  const currentDoc = useEditorStore((s) => s.currentDocument);

  const totalDocs = documents.length + 1; // +1 for currentDocument

  // Format focus minutes
  const focusFormatted = useMemo(() => {
    const total = streakState.totalFocusMinutesAllTime;
    if (total < 60) return `${total}m`;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }, [streakState.totalFocusMinutesAllTime]);

  // Words this week
  const wordsThisWeek = useMemo(
    () => week.reduce((sum, d) => sum + d.wordsWritten, 0),
    [week],
  );

  // Weekly chart data
  const chartData = useMemo(
    () =>
      week.map((day) => ({
        name: new Date(day.date + "T12:00:00").toLocaleDateString("en", {
          weekday: "short",
        }),
        words: day.wordsWritten,
      })),
    [week],
  );

  // 90-day heatmap data
  const heatmapData = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return Array.from({ length: 91 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (90 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const activity = streakState.days.find(
        (day) => day.date === dateStr,
      );
      return {
        date: dateStr,
        words: activity?.wordsWritten ?? 0,
        isToday: dateStr === todayStr,
      };
    });
  }, [streakState.days]);

  return (
    <div className="max-w-5xl mx-auto px-8 py-6 flex flex-col">
      {/* Header */}
      <div
        className="mb-6"
        style={{
          animation:
            "slide-up 0.3s cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        <h2 className="text-xl font-bold font-display">Your Writing Story</h2>
        <p className="text-[13px] text-muted-foreground/50 mt-0.5">
          Start writing to see your story unfold
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          icon={PenLine}
          iconColor="bg-primary/10 text-primary"
          value={wordsThisWeek.toLocaleString()}
          label="Words this week"
          delay={0}
        />
        <MetricCard
          icon={Flame}
          iconColor="bg-orange-400/10 text-orange-400"
          value={`${streakState.currentStreak} days`}
          label="Current streak"
          delay={40}
        />
        <MetricCard
          icon={FileText}
          iconColor="bg-blue-400/10 text-blue-400"
          value={totalDocs}
          label="Documents"
          delay={80}
        />
        <MetricCard
          icon={Clock}
          iconColor="bg-emerald-400/10 text-emerald-400"
          value={focusFormatted}
          label="Focus time"
          delay={120}
        />
      </div>

      {/* Weekly Bar Chart */}
      <div
        className="rounded-xl border border-border/40 bg-card p-5 mt-4"
        style={{
          animation:
            "slide-up 0.35s cubic-bezier(0.16,1,0.3,1) 160ms both",
        }}
      >
        <h3 className="text-[13px] font-semibold mb-3">Words Per Day</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
            />
            <Bar
              dataKey="words"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <WritingInsights week={week} />

      {/* 90-Day Heatmap */}
      <div
        className="rounded-xl border border-border/40 bg-card p-5 mt-4"
        style={{
          animation:
            "slide-up 0.35s cubic-bezier(0.16,1,0.3,1) 200ms both",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold">Writing Activity</h3>
          <span className="text-[11px] text-muted-foreground/40">
            Last 90 days
          </span>
        </div>
        <div className="grid grid-cols-[repeat(13,1fr)] gap-[3px]">
          {heatmapData.map((cell) => (
            <div
              key={cell.date}
              className={cn(
                "w-full aspect-square rounded-[3px] transition-colors",
                getHeatmapColor(cell.words),
                cell.isToday && "ring-1 ring-primary/50",
              )}
              title={`${cell.date}: ${cell.words} words`}
            />
          ))}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="text-[10px] text-muted-foreground/40">Less</span>
          <div className="w-3 h-3 rounded-[2px] bg-muted/20" />
          <div className="w-3 h-3 rounded-[2px] bg-primary/20" />
          <div className="w-3 h-3 rounded-[2px] bg-primary/40" />
          <div className="w-3 h-3 rounded-[2px] bg-primary/60" />
          <div className="w-3 h-3 rounded-[2px] bg-primary/80" />
          <span className="text-[10px] text-muted-foreground/40">More</span>
        </div>
      </div>

      {/* Connect CTA */}
      <div
        className="mt-4 rounded-xl border-dashed border-2 border-border/30 p-6 text-center"
        style={{
          animation:
            "slide-up 0.35s cubic-bezier(0.16,1,0.3,1) 240ms both",
        }}
      >
        <p className="text-[13px] font-medium text-muted-foreground/60">
          Connect a platform for deeper insights
        </p>
        <p className="text-[11px] text-muted-foreground/30 mt-1">
          See subscriber growth, engagement rates, and post performance
        </p>
        <button
          onClick={() =>
            useWorkspaceStore.getState().setActiveWorkspace("accounts")
          }
          className="mt-3 inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-[13px] font-medium hover:opacity-90 transition-opacity btn-press"
        >
          Connect Account
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
