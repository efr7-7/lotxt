import { formatNumber, formatPercentage } from "@/lib/utils";

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface Props {
  label: string;
  value: number;
  icon: React.ElementType;
  format: "number" | "percentage" | "currency";
  accentColor: string;
}

export function MetricCard({ label, value, icon: Icon, format, accentColor }: Props) {
  const displayValue =
    format === "percentage"
      ? formatPercentage(value)
      : format === "currency"
        ? formatCurrency(value)
        : formatNumber(value);

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3 relative overflow-hidden group hover:border-border/80 transition-colors">
      {/* Subtle accent glow */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.06] blur-2xl"
        style={{ background: accentColor }}
      />

      <div className="flex items-center justify-between relative">
        <span className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-[0.05em]">{label}</span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${accentColor} 12%, transparent)` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: accentColor }} />
        </div>
      </div>
      <div className="relative">
        <span className="text-[26px] font-bold text-foreground/90 leading-none tracking-tight">
          {displayValue}
        </span>
      </div>
    </div>
  );
}
