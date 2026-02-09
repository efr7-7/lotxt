import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { PostPerformance } from "@/stores/analytics-store";

interface Props {
  posts: PostPerformance[];
}

export function EngagementChart({ posts }: Props) {
  // Prepare chart data from real posts — last 10 posts
  const chartData = posts.slice(0, 10).map((p) => ({
    name: p.title.length > 20 ? p.title.slice(0, 20) + "…" : p.title,
    opens: p.opens,
    clicks: p.clicks,
  }));

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-foreground mb-4">Post Engagement</h3>
        <div className="h-[240px] flex items-center justify-center">
          <p className="text-xs text-muted-foreground">
            Engagement data will appear once you have published posts with analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-foreground mb-4">Post Engagement</h3>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14.9%)" />
            <XAxis
              dataKey="name"
              tick={{ fill: "hsl(0 0% 55%)", fontSize: 10 }}
              axisLine={{ stroke: "hsl(0 0% 14.9%)" }}
              tickLine={false}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fill: "hsl(0 0% 55%)", fontSize: 11 }}
              axisLine={{ stroke: "hsl(0 0% 14.9%)" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0 0% 5.5%)",
                border: "1px solid hsl(0 0% 14.9%)",
                borderRadius: "8px",
                color: "hsl(0 0% 98%)",
                fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "hsl(0 0% 55%)" }}
            />
            <Bar dataKey="opens" name="Opens" fill="hsl(238 84% 67%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="clicks" name="Clicks" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
