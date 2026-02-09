import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Props {
  data: { date: string; count: number }[];
}

export function SubscriberChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-foreground mb-4">Subscriber Growth</h3>
        <div className="h-[240px] flex items-center justify-center">
          <p className="text-xs text-muted-foreground">
            Subscriber growth data will appear once platforms report historical data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-foreground mb-4">Subscriber Growth</h3>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14.9%)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "hsl(0 0% 55%)", fontSize: 11 }}
              axisLine={{ stroke: "hsl(0 0% 14.9%)" }}
              tickLine={false}
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
            <Line
              type="monotone"
              dataKey="count"
              stroke="hsl(238 84% 67%)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: "hsl(238 84% 67%)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
