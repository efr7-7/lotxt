import { formatNumber, formatPercentage } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  icon: React.ElementType;
  format: "number" | "percentage";
  accentColor: string;
}

export function MetricCard({ label, value, icon: Icon, format, accentColor }: Props) {
  const displayValue =
    format === "percentage" ? formatPercentage(value) : formatNumber(value);

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className="w-4 h-4" style={{ color: accentColor }} />
      </div>
      <div className="flex items-end gap-1">
        <span className="text-2xl font-bold text-foreground leading-none">
          {displayValue}
        </span>
      </div>
    </div>
  );
}
