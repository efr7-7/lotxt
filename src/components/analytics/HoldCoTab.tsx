import { useState, useMemo } from "react";
import { useHoldCoStore } from "@/stores/holdco-store";
import type { BusinessLine, RevenueEntry } from "@/stores/holdco-store";
import {
  DollarSign,
  TrendingUp,
  Building2,
  Users,
  Heart,
  Target,
  Briefcase,
  Plus,
  Pencil,
  BarChart3,
  Crown,
  Sparkles,
  X,
  Check,
  Info,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Formatting Helpers ─── */

const currencyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const currencyFmtFull = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmtCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 10_000) return `$${(n / 1_000).toFixed(1)}K`;
  return currencyFmt.format(n);
}

function fmtCurrencyFull(n: number): string {
  return currencyFmtFull.format(n);
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

/* ─── Color Helpers ─── */

function marginColor(margin: number): string {
  if (margin > 10) return "text-emerald-400";
  if (margin > 0) return "text-amber-400";
  return "text-red-400";
}

function marginBg(margin: number): string {
  if (margin > 10) return "bg-emerald-500/8";
  if (margin > 0) return "bg-amber-500/8";
  return "bg-red-500/8";
}

function marginAccent(margin: number): string {
  if (margin > 10) return "hsl(var(--success))";
  if (margin > 0) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
}

function npsColor(nps: number): string {
  if (nps >= 50) return "text-emerald-400";
  if (nps >= 0) return "text-amber-400";
  return "text-red-400";
}

function npsBg(nps: number): string {
  if (nps >= 50) return "bg-emerald-500/10";
  if (nps >= 0) return "bg-amber-500/10";
  return "bg-red-500/10";
}

/* ─── Constants ─── */

const BUSINESS_TYPES = [
  "media",
  "ecommerce",
  "services",
  "saas",
  "events",
  "licensing",
  "other",
] as const;

type BusinessType = (typeof BUSINESS_TYPES)[number];

const TYPE_COLORS: Record<BusinessType, { bg: string; text: string }> = {
  media: { bg: "bg-violet-500/10", text: "text-violet-400" },
  ecommerce: { bg: "bg-amber-500/10", text: "text-amber-400" },
  services: { bg: "bg-blue-500/10", text: "text-blue-400" },
  saas: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  events: { bg: "bg-pink-500/10", text: "text-pink-400" },
  licensing: { bg: "bg-cyan-500/10", text: "text-cyan-400" },
  other: { bg: "bg-gray-500/10", text: "text-gray-400" },
};

const COLOR_PALETTE = [
  "#6366F1",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
  "#14B8A6",
  "#1877F2",
  "#84CC16",
  "#A855F7",
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HoldCoTab — Main Export
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function HoldCoTab() {
  const store = useHoldCoStore();
  const {
    businessLines,
    communityHealth,
    addBusinessLine,
    updateBusinessLine,
    removeBusinessLine,
    addRevenueEntry,
    updateRevenueEntry,
    updateCommunityHealth,
  } = store;

  const metrics = useMemo(() => store.getMetrics(), [businessLines]);
  const revenueByBL = useMemo(() => store.getRevenueByBusinessLine(), [businessLines]);
  const valuation = useMemo(() => store.getValuationEstimate(), [businessLines]);

  const [showAddBL, setShowAddBL] = useState(false);
  const [editingBL, setEditingBL] = useState<BusinessLine | null>(null);
  const [showAddRevenue, setShowAddRevenue] = useState(false);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-8 py-6 space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center">
                <Crown className="w-4 h-4 text-primary/70" />
              </div>
              <div>
                <h1 className="text-[16px] font-semibold text-foreground/90">
                  Holding Company
                </h1>
                <p className="text-[11px] text-muted-foreground/50">
                  Your entire business at a glance
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddRevenue(true)}
              className="h-7 px-3 rounded-lg bg-accent/50 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <BarChart3 className="w-3 h-3" />
              Log Revenue
            </button>
            <button
              onClick={() => setShowAddBL(true)}
              className="h-7 px-3 rounded-lg bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3" />
              Add Business Line
            </button>
          </div>
        </div>

        {/* ── 1. Hero Stats Row ── */}
        <HeroStatsRow metrics={metrics} />

        {/* ── 2. Valuation Band ── */}
        <ValuationBand valuation={valuation} />

        {/* ── 3. Business Lines Grid ── */}
        <BusinessLinesGrid
          businessLines={businessLines}
          onEdit={(bl) => setEditingBL(bl)}
          onToggleActive={(bl) =>
            updateBusinessLine(bl.id, { isActive: !bl.isActive })
          }
          onRemove={(id) => removeBusinessLine(id)}
          onAdd={() => setShowAddBL(true)}
        />

        {/* ── 4. Revenue Breakdown ── */}
        <RevenueBreakdown data={revenueByBL} />

        {/* ── 5. Community Health ── */}
        <CommunityHealthSection health={communityHealth} />
      </div>

      {/* ── 6. Add/Edit Business Line Dialog ── */}
      {(showAddBL || editingBL) && (
        <BusinessLineDialog
          initial={editingBL}
          onClose={() => {
            setShowAddBL(false);
            setEditingBL(null);
          }}
          onSave={(data) => {
            if (editingBL) {
              updateBusinessLine(editingBL.id, data);
            } else {
              addBusinessLine({
                name: data.name ?? "Untitled",
                type: (data.type as BusinessLine["type"]) ?? "other",
                color: data.color ?? "#6366f1",
                monthlyRevenue: data.monthlyRevenue ?? 0,
                monthlyCosts: data.monthlyCosts ?? 0,
                isActive: data.isActive ?? true,
                launchDate: data.launchDate ?? new Date().toISOString(),
                notes: data.notes ?? "",
              });
            }
            setShowAddBL(false);
            setEditingBL(null);
          }}
        />
      )}

      {/* ── 7. Add Revenue Entry Dialog ── */}
      {showAddRevenue && (
        <RevenueEntryDialog
          businessLines={businessLines}
          onClose={() => setShowAddRevenue(false)}
          onSave={(data) => {
            addRevenueEntry(data);
            setShowAddRevenue(false);
          }}
        />
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Section 1 — Hero Stats Row
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

interface HoldCoMetrics {
  totalMonthlyRevenue: number;
  totalMonthlyCosts: number;
  monthlyProfit: number;
  profitMargin: number;
  annualRunRate: number;
  totalSubscribers: number;
  revenuePerSubscriber: number;
  businessLineCount: number;
  topBusinessLine: string;
  momGrowth: number;
}

function HeroStatsRow({ metrics }: { metrics: HoldCoMetrics }) {
  const cards = [
    {
      label: "Total MRR",
      value: fmtCurrency(metrics.totalMonthlyRevenue),
      icon: DollarSign,
      accent: "hsl(var(--success))",
    },
    {
      label: "Monthly Profit",
      value: fmtCurrency(metrics.monthlyProfit),
      icon: TrendingUp,
      accent: marginAccent(metrics.profitMargin),
    },
    {
      label: "Profit Margin",
      value: fmtPct(metrics.profitMargin),
      icon: Percent,
      accent: marginAccent(metrics.profitMargin),
    },
    {
      label: "Annual Run Rate",
      value: fmtCurrency(metrics.annualRunRate),
      icon: BarChart3,
      accent: "hsl(var(--primary))",
    },
    {
      label: "Rev / Subscriber",
      value: fmtCurrencyFull(metrics.revenuePerSubscriber),
      icon: Users,
      accent: "hsl(var(--info))",
    },
    {
      label: "MoM Growth",
      value: fmtPct(metrics.momGrowth),
      icon: metrics.momGrowth > 0
        ? ArrowUpRight
        : metrics.momGrowth < 0
          ? ArrowDownRight
          : Minus,
      accent: marginAccent(metrics.momGrowth),
    },
  ];

  return (
    <div className="grid grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-xl border border-border/50 bg-card p-3.5 relative overflow-hidden group hover:border-border/80 transition-colors"
          >
            {/* Accent glow */}
            <div
              className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-[0.06] blur-2xl"
              style={{ background: card.accent }}
            />
            <div className="flex items-center justify-between relative mb-2">
              <span className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-[0.04em]">
                {card.label}
              </span>
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{
                  background: `color-mix(in srgb, ${card.accent} 12%, transparent)`,
                }}
              >
                <Icon
                  className="w-3 h-3"
                  style={{ color: card.accent }}
                />
              </div>
            </div>
            <span className="text-[20px] font-bold text-foreground/90 leading-none tracking-tight relative">
              {card.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Section 2 — Valuation Band
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

interface ValuationEstimate {
  low: number;
  mid: number;
  high: number;
  method: string;
}

function ValuationBand({ valuation }: { valuation: ValuationEstimate }) {
  const range = valuation.high - valuation.low;
  const midPct = range > 0 ? ((valuation.mid - valuation.low) / range) * 100 : 50;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/60 via-primary/60 to-violet-500/60" />

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/15 to-violet-500/15 border border-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary/70" />
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-foreground/90">
              Estimated Valuation Range
            </h2>
            <p className="text-[11px] text-muted-foreground/40">
              {valuation.method} &middot; Based on annual run rate
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[22px] font-bold text-foreground/90 tracking-tight">
            {fmtCurrency(valuation.mid)}
          </span>
          <p className="text-[10px] text-muted-foreground/40 mt-0.5">
            midpoint estimate
          </p>
        </div>
      </div>

      {/* Visual Range Bar */}
      <div className="relative mt-2">
        {/* Labels */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-muted-foreground/60">
            {fmtCurrency(valuation.low)}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground/60">
            {fmtCurrency(valuation.high)}
          </span>
        </div>

        {/* Bar Track */}
        <div className="h-3 rounded-full bg-muted/60 relative overflow-hidden">
          {/* Gradient Fill */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/30 via-primary/40 to-violet-500/30" />

          {/* Mid Marker */}
          <div
            className="absolute top-0 bottom-0 w-[3px] bg-foreground/80 rounded-full"
            style={{ left: `${midPct}%`, transform: "translateX(-50%)" }}
          />
        </div>

        {/* Mid label */}
        <div
          className="relative mt-1"
          style={{ paddingLeft: `${midPct}%` }}
        >
          <span
            className="text-[10px] font-semibold text-foreground/70 -translate-x-1/2 inline-block"
          >
            {fmtCurrency(valuation.mid)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Section 3 — Business Lines Grid
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

interface BusinessLinesGridProps {
  businessLines: BusinessLine[];
  onEdit: (bl: BusinessLine) => void;
  onToggleActive: (bl: BusinessLine) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}

function BusinessLinesGrid({
  businessLines,
  onEdit,
  onToggleActive,
  onRemove,
  onAdd,
}: BusinessLinesGridProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[16px] font-semibold text-foreground/90 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-muted-foreground/50" />
          Business Lines
        </h2>
        <span className="text-[11px] text-muted-foreground/40">
          {businessLines.filter((b) => b.isActive).length} active &middot;{" "}
          {businessLines.length} total
        </span>
      </div>

      {businessLines.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/50 py-12 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-muted-foreground/30" />
          </div>
          <p className="text-[12px] text-muted-foreground/40">
            No business lines yet. Add your first revenue stream.
          </p>
          <button
            onClick={onAdd}
            className="h-7 px-3 rounded-lg bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5 mt-1"
          >
            <Plus className="w-3 h-3" />
            Add Business Line
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {businessLines.map((bl) => {
            const revenue = bl.monthlyRevenue ?? 0;
            const costs = bl.monthlyCosts ?? 0;
            const profit = revenue - costs;
            const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
            const typeStyle = TYPE_COLORS[(bl.type as BusinessType) ?? "other"] ?? TYPE_COLORS.other;

            return (
              <div
                key={bl.id}
                className={cn(
                  "rounded-xl border border-border/50 bg-card p-4 relative overflow-hidden transition-all",
                  !bl.isActive && "opacity-50"
                )}
              >
                {/* Top color bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ backgroundColor: bl.color ?? "#6366F1" }}
                />

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: bl.color ?? "#6366F1" }}
                    />
                    <div>
                      <h3 className="text-[13px] font-semibold text-foreground/90 leading-tight">
                        {bl.name}
                      </h3>
                      <span
                        className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded-md mt-1 inline-block capitalize",
                          typeStyle.bg,
                          typeStyle.text
                        )}
                      >
                        {bl.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Active Toggle */}
                    <button
                      onClick={() => onToggleActive(bl)}
                      className={cn(
                        "h-6 px-2 rounded-md text-[10px] font-medium transition-colors",
                        bl.isActive
                          ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          : "bg-muted text-muted-foreground/50 hover:bg-muted/80"
                      )}
                    >
                      {bl.isActive ? "Active" : "Inactive"}
                    </button>
                    {/* Edit */}
                    <button
                      onClick={() => onEdit(bl)}
                      className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground/40 block mb-0.5">
                      Revenue
                    </span>
                    <span className="text-[13px] font-semibold text-foreground/80">
                      {fmtCurrency(revenue)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground/40 block mb-0.5">
                      Costs
                    </span>
                    <span className="text-[13px] font-semibold text-foreground/60">
                      {fmtCurrency(costs)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground/40 block mb-0.5">
                      Profit
                    </span>
                    <span
                      className={cn(
                        "text-[13px] font-semibold",
                        marginColor(margin)
                      )}
                    >
                      {fmtCurrency(profit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground/40 block mb-0.5">
                      Margin
                    </span>
                    <span
                      className={cn(
                        "text-[13px] font-semibold",
                        marginColor(margin)
                      )}
                    >
                      {fmtPct(margin)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Section 4 — Revenue Breakdown (stacked bar)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

interface RevenueBreakdownItem {
  name: string;
  revenue: number;
  percentage: number;
  color: string;
}

function RevenueBreakdown({ data }: { data: RevenueBreakdownItem[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) return null;

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold text-foreground/90 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-muted-foreground/50" />
          Revenue Breakdown
        </h2>
        <span className="text-[11px] text-muted-foreground/40">
          Total: {fmtCurrency(totalRevenue)}/mo
        </span>
      </div>

      {/* Stacked Horizontal Bar */}
      <div className="h-8 rounded-lg overflow-hidden flex mb-4 bg-muted/30">
        {data.map((item, idx) => (
          <div
            key={item.name}
            className="relative h-full transition-opacity duration-150"
            style={{
              width: `${Math.max(item.percentage, 1)}%`,
              backgroundColor: item.color,
              opacity: hoveredIdx !== null && hoveredIdx !== idx ? 0.4 : 1,
            }}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* Tooltip on hover */}
            {hoveredIdx === idx && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-popover border border-border shadow-lg whitespace-nowrap z-10">
                <span className="text-[11px] font-semibold text-foreground">
                  {item.name}
                </span>
                <span className="text-[10px] text-muted-foreground ml-2">
                  {fmtCurrency(item.revenue)} ({fmtPct(item.percentage)})
                </span>
              </div>
            )}

            {/* Show percentage if segment is wide enough */}
            {item.percentage >= 8 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-semibold text-white/90 drop-shadow-sm">
                  {Math.round(item.percentage)}%
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[11px] text-foreground/70 font-medium">
              {item.name}
            </span>
            <span className="text-[11px] text-muted-foreground/50">
              {fmtCurrency(item.revenue)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Section 5 — Community Health
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

interface CommunityHealth {
  totalAudience: number;
  emailSubscribers: number;
  openRate: number;
  clickRate: number;
  socialFollowers: number;
  engagementRate: number;
  superfanCount: number;
  npsScore: number;
  avgRevenuePerFan: number;
  communityPlatforms: { name: string; followers: number; engagement: number }[];
}

function CommunityHealthSection({ health }: { health: CommunityHealth }) {
  const [showSuperfanTip, setShowSuperfanTip] = useState(false);

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500/15 to-red-500/10 border border-pink-500/10 flex items-center justify-center">
          <Heart className="w-4 h-4 text-pink-400/70" />
        </div>
        <div>
          <h2 className="text-[16px] font-semibold text-foreground/90">
            Community Health
          </h2>
          <p className="text-[11px] text-muted-foreground/40">
            Audience strength and engagement signals
          </p>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        <CommunityMetric
          label="Total Audience"
          value={fmtNumber(health.totalAudience)}
          icon={Users}
          accentColor="hsl(var(--primary))"
        />
        <CommunityMetric
          label="Email Subscribers"
          value={fmtNumber(health.emailSubscribers)}
          icon={Target}
          accentColor="hsl(var(--info))"
        />
        <CommunityMetric
          label="Open Rate"
          value={fmtPct(health.openRate)}
          icon={TrendingUp}
          accentColor="hsl(var(--success))"
        />
        <CommunityMetric
          label="Click Rate"
          value={fmtPct(health.clickRate)}
          icon={Target}
          accentColor="hsl(var(--warning))"
        />
        <CommunityMetric
          label="Engagement"
          value={fmtPct(health.engagementRate)}
          icon={Heart}
          accentColor="hsl(152 69% 40%)"
        />
      </div>

      {/* Superfan + NPS + Revenue per Fan */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {/* Superfan */}
        <div className="rounded-lg border border-border/40 bg-muted/20 p-3.5 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-[0.04em]">
              Superfans
            </span>
            <div className="relative">
              <button
                onMouseEnter={() => setShowSuperfanTip(true)}
                onMouseLeave={() => setShowSuperfanTip(false)}
                className="w-4 h-4 rounded-full flex items-center justify-center text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
              >
                <Info className="w-3 h-3" />
              </button>
              {showSuperfanTip && (
                <div className="absolute right-0 bottom-full mb-2 w-52 p-2.5 rounded-lg bg-popover border border-border shadow-lg z-10">
                  <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                    Your white-hot core — the fans who'd buy anything you launch. Typically the top 1-5% of your audience by engagement.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[22px] font-bold text-foreground/90 leading-none tracking-tight">
              {fmtNumber(health.superfanCount)}
            </span>
            <Crown className="w-4 h-4 text-amber-400/70" />
          </div>
        </div>

        {/* NPS Score */}
        <div className="rounded-lg border border-border/40 bg-muted/20 p-3.5">
          <span className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-[0.04em] block mb-2">
            NPS Score
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "text-[22px] font-bold leading-none tracking-tight",
                npsColor(health.npsScore)
              )}
            >
              {health.npsScore > 0 ? "+" : ""}
              {health.npsScore}
            </span>
            <span
              className={cn(
                "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                npsBg(health.npsScore),
                npsColor(health.npsScore)
              )}
            >
              {health.npsScore >= 50
                ? "Excellent"
                : health.npsScore >= 0
                  ? "Good"
                  : "Needs Work"}
            </span>
          </div>
        </div>

        {/* Revenue per Fan */}
        <div className="rounded-lg border border-border/40 bg-muted/20 p-3.5">
          <span className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-[0.04em] block mb-2">
            Revenue / Fan
          </span>
          <span className="text-[22px] font-bold text-foreground/90 leading-none tracking-tight">
            {fmtCurrencyFull(health.avgRevenuePerFan)}
          </span>
        </div>
      </div>

      {/* Platform Breakdown */}
      {health.communityPlatforms.length > 0 && (
        <div>
          <h3 className="text-[12px] font-semibold text-muted-foreground/60 mb-2.5">
            Platform Breakdown
          </h3>
          <div className="space-y-1.5">
            {health.communityPlatforms.map((platform) => (
              <div
                key={platform.name}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <span className="text-[12px] font-medium text-foreground/80 w-28 truncate">
                  {platform.name}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/50"
                    style={{
                      width: `${Math.min(
                        (platform.followers / Math.max(health.totalAudience, 1)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground/60 w-16 text-right">
                  {fmtNumber(platform.followers)}
                </span>
                <span className="text-[11px] text-muted-foreground/40 w-14 text-right">
                  {fmtPct(platform.engagement)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CommunityMetric({
  label,
  value,
  icon: Icon,
  accentColor,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accentColor: string;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 p-3 relative overflow-hidden">
      <div
        className="absolute -top-4 -right-4 w-14 h-14 rounded-full opacity-[0.05] blur-xl"
        style={{ background: accentColor }}
      />
      <div className="flex items-center justify-between mb-1.5 relative">
        <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-[0.04em]">
          {label}
        </span>
        <Icon className="w-3 h-3" style={{ color: accentColor, opacity: 0.6 }} />
      </div>
      <span className="text-[16px] font-bold text-foreground/90 leading-none tracking-tight relative">
        {value}
      </span>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Section 6 — Business Line Dialog (Add / Edit)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

interface BusinessLineDialogProps {
  initial: BusinessLine | null;
  onClose: () => void;
  onSave: (data: Partial<BusinessLine>) => void;
}

function BusinessLineDialog({ initial, onClose, onSave }: BusinessLineDialogProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<string>(initial?.type ?? "media");
  const [color, setColor] = useState(initial?.color ?? COLOR_PALETTE[0]);
  const [monthlyRevenue, setMonthlyRevenue] = useState(
    initial?.monthlyRevenue?.toString() ?? ""
  );
  const [monthlyCosts, setMonthlyCosts] = useState(
    initial?.monthlyCosts?.toString() ?? ""
  );
  const [launchDate, setLaunchDate] = useState(initial?.launchDate ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const isEditing = initial !== null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      type: type as BusinessLine["type"],
      color,
      monthlyRevenue: parseFloat(monthlyRevenue) || 0,
      monthlyCosts: parseFloat(monthlyCosts) || 0,
      launchDate: launchDate || undefined,
      notes: notes || undefined,
      isActive: initial?.isActive ?? true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-popover border border-border rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-[13px] font-semibold text-foreground">
              {isEditing ? "Edit Business Line" : "Add Business Line"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fields */}
        <div className="p-4 space-y-3">
          {/* Name */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Newsletter, Course, Merch Shop..."
              className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/25"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring capitalize"
            >
              {BUSINESS_TYPES.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Color Palette */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1.5 block">
              Color
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-6 h-6 rounded-md transition-all border-2",
                    color === c
                      ? "border-foreground/60 scale-110"
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Revenue & Costs (inline) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                Monthly Revenue ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={monthlyRevenue}
                onChange={(e) => setMonthlyRevenue(e.target.value)}
                placeholder="0.00"
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/25"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                Monthly Costs ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={monthlyCosts}
                onChange={(e) => setMonthlyCosts(e.target.value)}
                placeholder="0.00"
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/25"
              />
            </div>
          </div>

          {/* Launch Date */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              Launch Date
            </label>
            <input
              type="date"
              value={launchDate}
              onChange={(e) => setLaunchDate(e.target.value)}
              className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Strategy notes, goals, etc."
              rows={2}
              className="w-full px-2.5 py-2 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/25 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-8 rounded-lg border border-border text-[12px] font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <Check className="w-3 h-3" />
            {isEditing ? "Save Changes" : "Add Business Line"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Section 7 — Revenue Entry Dialog
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

interface RevenueEntryDialogProps {
  businessLines: BusinessLine[];
  onClose: () => void;
  onSave: (data: Omit<RevenueEntry, "id">) => void;
}

function RevenueEntryDialog({
  businessLines,
  onClose,
  onSave,
}: RevenueEntryDialogProps) {
  const [businessLineId, setBusinessLineId] = useState(
    businessLines[0]?.id ?? ""
  );
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [revenue, setRevenue] = useState("");
  const [costs, setCosts] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!businessLineId || !month) return;
    const revenueNum = parseFloat(revenue) || 0;
    const costsNum = parseFloat(costs) || 0;
    if (revenueNum <= 0 && costsNum <= 0) return;

    onSave({
      businessLineId,
      month,
      revenue: revenueNum,
      costs: costsNum,
      notes: notes || undefined,
    } as Omit<RevenueEntry, "id">);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-popover border border-border rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-[13px] font-semibold text-foreground">
              Log Revenue Entry
            </h2>
          </div>
          <button
            onClick={onClose}
            className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fields */}
        <div className="p-4 space-y-3">
          {/* Business Line */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              Business Line
            </label>
            {businessLines.length === 0 ? (
              <p className="text-[11px] text-muted-foreground/40 py-2">
                Add a business line first
              </p>
            ) : (
              <select
                value={businessLineId}
                onChange={(e) => setBusinessLineId(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
              >
                {businessLines.map((bl) => (
                  <option key={bl.id} value={bl.id}>
                    {bl.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Month */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              Month
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Revenue & Costs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                Revenue ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                placeholder="0.00"
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/25"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                Costs ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={costs}
                onChange={(e) => setCosts(e.target.value)}
                placeholder="0.00"
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/25"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              Notes (optional)
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Launched new tier"
              className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/25"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-8 rounded-lg border border-border text-[12px] font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!businessLineId || !month}
            className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <Check className="w-3 h-3" />
            Log Entry
          </button>
        </div>
      </div>
    </div>
  );
}
