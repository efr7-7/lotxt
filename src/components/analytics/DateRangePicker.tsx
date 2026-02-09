import { useState } from "react";
import { useAnalyticsStore } from "@/stores/analytics-store";
import { Calendar } from "lucide-react";

const PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "1y", days: 365 },
];

export function DateRangePicker() {
  const { dateRange, setDateRange } = useAnalyticsStore();
  const [isOpen, setIsOpen] = useState(false);

  const selectPreset = (days: number) => {
    const to = new Date().toISOString().split("T")[0];
    const from = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
    setDateRange({ from, to });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Calendar className="w-3.5 h-3.5" />
        {dateRange.from} — {dateRange.to}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-xl p-2 flex gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => selectPreset(p.days)}
                className="px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
