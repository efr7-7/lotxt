import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateInsights, type Insight } from "@/lib/analytics-insights";
import type { PostPerformance } from "@/stores/analytics-store";

interface Props {
  posts: PostPerformance[];
}

const TYPE_CONFIG: Record<Insight["type"], { icon: typeof TrendingUp; color: string; bg: string }> = {
  positive: { icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  negative: { icon: TrendingDown, color: "text-red-400", bg: "bg-red-500/10" },
  neutral: { icon: Lightbulb, color: "text-amber-400", bg: "bg-amber-500/10" },
};

export function InsightCards({ posts }: Props) {
  const insights = useMemo(() => generateInsights(posts), [posts]);

  if (insights.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
        <h3 className="text-sm font-medium text-foreground">Insights</h3>
        <span className="text-[10px] text-muted-foreground/40 ml-auto">
          Auto-generated from your data
        </span>
      </div>
      <div className="divide-y divide-border">
        {insights.map((insight, i) => {
          const config = TYPE_CONFIG[insight.type];
          const Icon = config.icon;
          return (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", config.bg)}>
                <Icon className={cn("w-3.5 h-3.5", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-foreground/80 leading-relaxed">
                  {insight.message}
                </p>
              </div>
              {insight.delta !== 0 && (
                <span className={cn(
                  "text-[11px] font-semibold tabular-nums shrink-0 mt-0.5",
                  insight.delta > 0 ? "text-emerald-400" : "text-red-400",
                )}>
                  {insight.delta > 0 ? "+" : ""}{insight.delta}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
