import { useState, useMemo } from "react";
import {
  useGrowthStore,
  type GrowthChannel,
  type ChannelType,
  type ChannelStats,
} from "@/stores/growth-store";
import {
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Target,
  Zap,
  X,
  Check,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Formatting Helpers ─── */

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function fmtCPA(spend: number, subscribers: number, type: ChannelType): string {
  if (type === "organic" && spend === 0) return "Free";
  if (subscribers <= 0) return "\u2014";
  return fmtCurrency(spend / subscribers);
}

function fmtROI(roi: number): string {
  if (!isFinite(roi)) return "\u221E";
  return `${roi.toFixed(1)}%`;
}

/* ─── Type Badge Colors ─── */

const TYPE_COLORS: Record<ChannelType, { bg: string; text: string }> = {
  paid: { bg: "bg-red-500/10", text: "text-red-400" },
  organic: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  referral: { bg: "bg-violet-500/10", text: "text-violet-400" },
};

/* ─── Default Colors for New Channels ─── */

const CHANNEL_COLORS = [
  "#1877F2",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
  "#6366F1",
  "#14B8A6",
];

/* ─── Sort Types ─── */

type SortKey =
  | "name"
  | "type"
  | "totalSpend"
  | "totalSubscribers"
  | "cpa"
  | "avgOpenRate"
  | "avgCTR"
  | "customersConverted"
  | "roi"
  | "ltv";
type SortDir = "asc" | "desc";

/* ─── Empty Channel Form Data ─── */

interface ChannelFormData {
  name: string;
  type: ChannelType;
  color: string;
  totalSpend: string;
  subscribersGained: string;
  avgOpenRate: string;
  avgCTR: string;
  customersConverted: string;
  revenue: string;
  notes: string;
  isActive: boolean;
}

const EMPTY_FORM: ChannelFormData = {
  name: "",
  type: "paid",
  color: CHANNEL_COLORS[0],
  totalSpend: "",
  subscribersGained: "",
  avgOpenRate: "",
  avgCTR: "",
  customersConverted: "",
  revenue: "",
  notes: "",
  isActive: true,
};

function channelToForm(ch: GrowthChannel): ChannelFormData {
  return {
    name: ch.name,
    type: ch.type,
    color: ch.color,
    totalSpend: ch.totalSpend > 0 ? ch.totalSpend.toString() : "",
    subscribersGained: ch.subscribersGained > 0 ? ch.subscribersGained.toString() : "",
    avgOpenRate: ch.avgOpenRate > 0 ? ch.avgOpenRate.toString() : "",
    avgCTR: ch.avgCTR > 0 ? ch.avgCTR.toString() : "",
    customersConverted: ch.customersConverted > 0 ? ch.customersConverted.toString() : "",
    revenue: "",
    notes: ch.notes,
    isActive: ch.isActive,
  };
}

/* ─── Insight Generation ─── */

interface GrowthInsight {
  message: string;
  type: "positive" | "neutral" | "actionable";
  icon: typeof TrendingUp;
}

function generateGrowthInsights(stats: ChannelStats[]): GrowthInsight[] {
  const insights: GrowthInsight[] = [];
  const active = stats.filter((s) => s.totalSubscribers > 0 || s.totalSpend > 0);
  if (active.length === 0) return insights;

  // Best CPA channel (lowest non-zero CPA among paid)
  const paidWithSubs = active.filter((s) => s.cpa > 0 && s.type === "paid");
  if (paidWithSubs.length > 0) {
    const bestCPA = paidWithSubs.reduce((best, s) => (s.cpa < best.cpa ? s : best));
    insights.push({
      message: `Your best CPA channel is ${bestCPA.channelName} at ${fmtCurrency(bestCPA.cpa)}/subscriber`,
      type: "positive",
      icon: DollarSign,
    });
  }

  // Organic vs Paid open rate comparison
  const organicWithRates = active.filter((s) => s.type === "organic" && s.avgOpenRate > 0);
  const paidWithRates = active.filter((s) => s.type === "paid" && s.avgOpenRate > 0);
  if (organicWithRates.length > 0 && paidWithRates.length > 0) {
    const avgOrganic = organicWithRates.reduce((s, c) => s + c.avgOpenRate, 0) / organicWithRates.length;
    const avgPaid = paidWithRates.reduce((s, c) => s + c.avgOpenRate, 0) / paidWithRates.length;
    if (avgOrganic > avgPaid) {
      const pctDiff = (((avgOrganic - avgPaid) / avgPaid) * 100).toFixed(0);
      insights.push({
        message: `Organic channels generate ${pctDiff}% higher open rates than paid`,
        type: "neutral",
        icon: BarChart3,
      });
    } else if (avgPaid > avgOrganic) {
      const pctDiff = (((avgPaid - avgOrganic) / avgOrganic) * 100).toFixed(0);
      insights.push({
        message: `Paid channels generate ${pctDiff}% higher open rates than organic`,
        type: "neutral",
        icon: BarChart3,
      });
    }
  }

  // Best ROI channel (suggest increasing budget)
  const withROI = active.filter((s) => s.roi > 0 && isFinite(s.roi) && s.type === "paid");
  if (withROI.length > 0) {
    const bestROI = withROI.reduce((best, s) => (s.roi > best.roi ? s : best));
    insights.push({
      message: `Consider increasing budget for ${bestROI.channelName} \u2014 best ROI at ${bestROI.roi.toFixed(1)}x`,
      type: "actionable",
      icon: Target,
    });
  }

  // Highest LTV
  const withLTV = active.filter((s) => s.ltv > 0);
  if (withLTV.length > 0) {
    const bestLTV = withLTV.reduce((best, s) => (s.ltv > best.ltv ? s : best));
    insights.push({
      message: `${bestLTV.channelName} has the highest LTV at $${bestLTV.ltv.toFixed(2)} per subscriber`,
      type: "positive",
      icon: TrendingUp,
    });
  }

  // Most subscribers from a single channel
  const topSubs = active.reduce((best, s) =>
    s.totalSubscribers > best.totalSubscribers ? s : best,
  );
  if (topSubs.totalSubscribers > 0) {
    const totalSubs = active.reduce((sum, s) => sum + s.totalSubscribers, 0);
    const pctShare = ((topSubs.totalSubscribers / totalSubs) * 100).toFixed(0);
    insights.push({
      message: `${topSubs.channelName} drives ${pctShare}% of total subscribers (${fmtNumber(topSubs.totalSubscribers)})`,
      type: "neutral",
      icon: Users,
    });
  }

  // Referral efficiency
  const referralChannels = active.filter((s) => s.type === "referral" && s.totalSubscribers > 0);
  if (referralChannels.length > 0) {
    const totalRefSubs = referralChannels.reduce((s, c) => s + c.totalSubscribers, 0);
    const totalRefSpend = referralChannels.reduce((s, c) => s + c.totalSpend, 0);
    if (totalRefSpend === 0 && totalRefSubs > 0) {
      insights.push({
        message: `Referral channels brought in ${fmtNumber(totalRefSubs)} subscribers at zero cost`,
        type: "positive",
        icon: Zap,
      });
    }
  }

  return insights;
}

/* ─── Insight Config ─── */

const INSIGHT_CONFIG: Record<
  GrowthInsight["type"],
  { color: string; bg: string }
> = {
  positive: { color: "text-emerald-400", bg: "bg-emerald-500/10" },
  neutral: { color: "text-amber-400", bg: "bg-amber-500/10" },
  actionable: { color: "text-blue-400", bg: "bg-blue-500/10" },
};

/* ═══════════════════════════════════════════
   GrowthTab Component
   ═══════════════════════════════════════════ */

export function GrowthTab() {
  const {
    channels,
    addChannel,
    updateChannel,
    removeChannel,
    getTotalSpend,
    getTotalSubscribers,
    getAvgCPA,
    getAllChannelStats,
  } = useGrowthStore();

  const [dialogMode, setDialogMode] = useState<"closed" | "add" | "edit">("closed");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ChannelFormData>(EMPTY_FORM);

  const [sortKey, setSortKey] = useState<SortKey>("totalSubscribers");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  /* ─── Computed ─── */

  const totalSpend = getTotalSpend();
  const totalSubscribers = getTotalSubscribers();
  const avgCPA = getAvgCPA();

  const allStats = useMemo(() => getAllChannelStats(), [channels]);

  const sortedStats = useMemo(() => {
    const sorted = [...allStats];
    sorted.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (sortKey) {
        case "name":
          aVal = a.channelName.toLowerCase();
          bVal = b.channelName.toLowerCase();
          break;
        case "type":
          aVal = a.type;
          bVal = b.type;
          break;
        case "totalSpend":
          aVal = a.totalSpend;
          bVal = b.totalSpend;
          break;
        case "totalSubscribers":
          aVal = a.totalSubscribers;
          bVal = b.totalSubscribers;
          break;
        case "cpa":
          aVal = a.cpa;
          bVal = b.cpa;
          break;
        case "avgOpenRate":
          aVal = a.avgOpenRate;
          bVal = b.avgOpenRate;
          break;
        case "avgCTR":
          aVal = a.avgCTR;
          bVal = b.avgCTR;
          break;
        case "customersConverted":
          aVal = a.customersConverted;
          bVal = b.customersConverted;
          break;
        case "roi":
          aVal = isFinite(a.roi) ? a.roi : -Infinity;
          bVal = isFinite(b.roi) ? b.roi : -Infinity;
          break;
        case "ltv":
          aVal = a.ltv;
          bVal = b.ltv;
          break;
        default:
          aVal = 0;
          bVal = 0;
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [allStats, sortKey, sortDir]);

  const insights = useMemo(() => generateGrowthInsights(allStats), [allStats]);

  // The max subscribers across channels, used for sparkline bars
  const maxSubscribers = useMemo(
    () => Math.max(...allStats.map((s) => s.totalSubscribers), 1),
    [allStats],
  );

  /* ─── Handlers ─── */

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, color: CHANNEL_COLORS[channels.length % CHANNEL_COLORS.length] });
    setEditingId(null);
    setDialogMode("add");
  };

  const openEdit = (ch: GrowthChannel) => {
    setForm(channelToForm(ch));
    setEditingId(ch.id);
    setDialogMode("edit");
  };

  const closeDialog = () => {
    setDialogMode("closed");
    setEditingId(null);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;

    const data = {
      name: form.name.trim(),
      type: form.type,
      color: form.color,
      totalSpend: parseFloat(form.totalSpend) || 0,
      subscribersGained: parseInt(form.subscribersGained, 10) || 0,
      avgOpenRate: parseFloat(form.avgOpenRate) || 0,
      avgCTR: parseFloat(form.avgCTR) || 0,
      customersConverted: parseInt(form.customersConverted, 10) || 0,
      isActive: form.isActive,
      notes: form.notes,
    };

    if (dialogMode === "add") {
      addChannel(data);
    } else if (dialogMode === "edit" && editingId) {
      updateChannel(editingId, data);
    }

    closeDialog();
  };

  const handleDelete = (id: string) => {
    removeChannel(id);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const updateForm = (updates: Partial<ChannelFormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  /* ─── Render ─── */

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-8 py-6">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-foreground/90">Growth Channels</h1>
            <p className="text-[13px] text-muted-foreground/50 mt-0.5">
              Track acquisition sources and compare performance
            </p>
          </div>
          <button
            onClick={openAdd}
            className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Channel
          </button>
        </div>

        {/* ─── Summary Metrics ─── */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <SummaryCard
            label="Total Subscribers"
            value={fmtNumber(totalSubscribers)}
            icon={Users}
            accentColor="hsl(var(--primary))"
          />
          <SummaryCard
            label="Total Spend"
            value={fmtCurrency(totalSpend)}
            icon={DollarSign}
            accentColor="hsl(var(--warning))"
          />
          <SummaryCard
            label="Avg CPA"
            value={totalSubscribers > 0 ? fmtCurrency(avgCPA) : "\u2014"}
            icon={Target}
            accentColor="hsl(var(--info))"
          />
        </div>

        {/* ─── Channel Cards Grid ─── */}
        {channels.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {channels.map((ch) => {
              const stat = allStats.find((s) => s.channelId === ch.id);
              const cpa = stat ? stat.cpa : 0;
              const ltv = stat ? stat.ltv : 0;
              const barWidth = stat
                ? Math.max((stat.totalSubscribers / maxSubscribers) * 100, 2)
                : 2;

              return (
                <div
                  key={ch.id}
                  className="group rounded-xl border border-border/50 bg-card p-4 relative overflow-hidden hover:border-border/80 transition-colors"
                >
                  {/* Accent glow */}
                  <div
                    className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.06] blur-2xl"
                    style={{ background: ch.color }}
                  />

                  {/* Top row: name + type badge */}
                  <div className="flex items-center justify-between mb-3 relative">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: ch.color }}
                      />
                      <span className="text-[13px] font-semibold text-foreground truncate">
                        {ch.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
                          TYPE_COLORS[ch.type].bg,
                          TYPE_COLORS[ch.type].text,
                        )}
                      >
                        {ch.type}
                      </span>
                      {/* Hover actions */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(ch)}
                          className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(ch.id)}
                          className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-[11px] mb-3">
                    <div>
                      <span className="text-muted-foreground/50 block">Spend</span>
                      <span className="font-semibold text-foreground">
                        {ch.totalSpend > 0 ? fmtCurrency(ch.totalSpend) : "\u2014"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/50 block">Subscribers</span>
                      <span className="font-semibold text-foreground">
                        {ch.subscribersGained > 0 ? fmtNumber(ch.subscribersGained) : "\u2014"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/50 block">CPA</span>
                      <span className="font-semibold text-foreground">
                        {fmtCPA(ch.totalSpend, ch.subscribersGained, ch.type)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/50 block">Open Rate</span>
                      <span className="font-semibold text-foreground">
                        {ch.avgOpenRate > 0 ? fmtPct(ch.avgOpenRate) : "\u2014"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/50 block">CTR</span>
                      <span className="font-semibold text-foreground">
                        {ch.avgCTR > 0 ? fmtPct(ch.avgCTR) : "\u2014"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/50 block">Customers</span>
                      <span className="font-semibold text-foreground">
                        {ch.customersConverted > 0 ? fmtNumber(ch.customersConverted) : "\u2014"}
                      </span>
                    </div>
                  </div>

                  {/* LTV line (only if customers > 0) */}
                  {ch.customersConverted > 0 && ltv > 0 && (
                    <div className="text-[10px] text-muted-foreground/60 mb-2">
                      LTV: <span className="font-semibold text-foreground">${ltv.toFixed(2)}</span>/subscriber
                    </div>
                  )}

                  {/* Performance sparkline bar */}
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: ch.color,
                        opacity: 0.7,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-border/40 bg-card/30 p-12 text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-5 h-5 text-primary/60" />
            </div>
            <h3 className="text-sm font-semibold text-foreground/80 mb-1">No channels yet</h3>
            <p className="text-[12px] text-muted-foreground/40 mb-4 max-w-[280px] mx-auto">
              Add your first growth channel to start tracking acquisition performance
            </p>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Channel
            </button>
          </div>
        )}

        {/* ─── Performance Comparison Table ─── */}
        {allStats.length > 0 && (
          <div className="rounded-xl border border-border/40 overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/50" />
              <h3 className="text-sm font-medium text-foreground">Channel Comparison</h3>
              <span className="text-[10px] text-muted-foreground/40">
                {allStats.length} {allStats.length === 1 ? "channel" : "channels"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/30">
                    <SortHeader
                      label="Channel"
                      sortKey="name"
                      currentKey={sortKey}
                      currentDir={sortDir}
                      onSort={handleSort}
                      align="left"
                    />
                    <SortHeader
                      label="Type"
                      sortKey="type"
                      currentKey={sortKey}
                      currentDir={sortDir}
                      onSort={handleSort}
                      align="left"
                    />
                    <SortHeader
                      label="Spend"
                      sortKey="totalSpend"
                      currentKey={sortKey}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="Subs"
                      sortKey="totalSubscribers"
                      currentKey={sortKey}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="CPA"
                      sortKey="cpa"
                      currentKey={sortKey}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="Open Rate"
                      sortKey="avgOpenRate"
                      currentKey={sortKey}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="CTR"
                      sortKey="avgCTR"
                      currentKey={sortKey}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="Customers"
                      sortKey="customersConverted"
                      currentKey={sortKey}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="LTV"
                      sortKey="ltv"
                      currentKey={sortKey}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="ROI"
                      sortKey="roi"
                      currentKey={sortKey}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                  </tr>
                </thead>
                <tbody>
                  {sortedStats.map((stat) => {
                    const ch = channels.find((c) => c.id === stat.channelId);
                    return (
                      <tr
                        key={stat.channelId}
                        className="border-b border-border/10 last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-2.5 text-left">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: stat.color }}
                            />
                            <span className="font-medium text-foreground truncate max-w-[140px]">
                              {stat.channelName}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-left">
                          <span
                            className={cn(
                              "text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
                              TYPE_COLORS[stat.type].bg,
                              TYPE_COLORS[stat.type].text,
                            )}
                          >
                            {stat.type}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-foreground">
                          {stat.totalSpend > 0 ? fmtCurrency(stat.totalSpend) : "\u2014"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-foreground">
                          {stat.totalSubscribers > 0 ? fmtNumber(stat.totalSubscribers) : "\u2014"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-foreground">
                          {fmtCPA(stat.totalSpend, stat.totalSubscribers, stat.type)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground">
                          {stat.avgOpenRate > 0 ? fmtPct(stat.avgOpenRate) : "\u2014"}
                        </td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground">
                          {stat.avgCTR > 0 ? fmtPct(stat.avgCTR) : "\u2014"}
                        </td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground">
                          {stat.customersConverted > 0 ? fmtNumber(stat.customersConverted) : "\u2014"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-foreground">
                          {stat.ltv > 0 ? `$${stat.ltv.toFixed(2)}` : "\u2014"}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span
                            className={cn(
                              "font-semibold",
                              stat.roi > 0 && isFinite(stat.roi)
                                ? "text-emerald-400"
                                : stat.roi < 0
                                  ? "text-red-400"
                                  : "text-muted-foreground",
                            )}
                          >
                            {stat.totalSpend > 0 ? fmtROI(stat.roi) : "\u2014"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Quick Insights ─── */}
        {insights.length > 0 && (
          <div className="rounded-xl border border-border/40 bg-card overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <h3 className="text-sm font-medium text-foreground">Quick Insights</h3>
              <span className="text-[10px] text-muted-foreground/40 ml-auto">
                Auto-generated from your channel data
              </span>
            </div>
            <div className="divide-y divide-border/30">
              {insights.map((insight, i) => {
                const config = INSIGHT_CONFIG[insight.type];
                const Icon = insight.icon;
                return (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                        config.bg,
                      )}
                    >
                      <Icon className={cn("w-3.5 h-3.5", config.color)} />
                    </div>
                    <p className="text-[13px] text-foreground/80 leading-relaxed flex-1 min-w-0">
                      {insight.message}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Add / Edit Channel Dialog ─── */}
      {dialogMode !== "closed" && (
        <ChannelDialog
          mode={dialogMode}
          form={form}
          onUpdate={updateForm}
          onSave={handleSave}
          onClose={closeDialog}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════ */

/* ─── Summary Card ─── */

function SummaryCard({
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
    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3 relative overflow-hidden group hover:border-border/80 transition-colors">
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.06] blur-2xl"
        style={{ background: accentColor }}
      />
      <div className="flex items-center justify-between relative">
        <span className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-[0.05em]">
          {label}
        </span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${accentColor} 12%, transparent)` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: accentColor }} />
        </div>
      </div>
      <div className="relative">
        <span className="text-[26px] font-bold text-foreground/90 leading-none tracking-tight">
          {value}
        </span>
      </div>
    </div>
  );
}

/* ─── Sortable Table Header ─── */

function SortHeader({
  label,
  sortKey: key,
  currentKey,
  currentDir,
  onSort,
  align = "right",
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const isActive = currentKey === key;
  return (
    <th
      onClick={() => onSort(key)}
      className={cn(
        "px-3 py-2.5 text-[9px] font-semibold uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none whitespace-nowrap",
        align === "left" ? "text-left px-4" : "text-right",
        isActive ? "text-foreground" : "text-muted-foreground/50",
      )}
    >
      {label}
      {isActive && (
        <span className="ml-0.5 inline-block">
          {currentDir === "asc" ? "\u25B2" : "\u25BC"}
        </span>
      )}
    </th>
  );
}

/* ─── Add/Edit Channel Dialog ─── */

function ChannelDialog({
  mode,
  form,
  onUpdate,
  onSave,
  onClose,
}: {
  mode: "add" | "edit";
  form: ChannelFormData;
  onUpdate: (updates: Partial<ChannelFormData>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-popover border border-border rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              {mode === "add" ? "Add Channel" : "Edit Channel"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form body */}
        <div className="p-4 space-y-3 max-h-[65vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              Channel Name
            </label>
            <input
              value={form.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="e.g. Meta Ads, Organic Twitter"
              className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              Type
            </label>
            <div className="flex gap-1">
              {(["paid", "organic", "referral"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onUpdate({ type: t })}
                  className={cn(
                    "flex-1 h-7 rounded-md text-[10px] font-medium transition-colors capitalize",
                    form.type === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              Color
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {CHANNEL_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => onUpdate({ color: c })}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 transition-all",
                    form.color === c
                      ? "border-foreground scale-110"
                      : "border-transparent hover:border-muted-foreground/30",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Spend + Subscribers row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                Total Spend ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.totalSpend}
                onChange={(e) => onUpdate({ totalSpend: e.target.value })}
                placeholder="0.00"
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                Subscribers Gained
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={form.subscribersGained}
                onChange={(e) => onUpdate({ subscribersGained: e.target.value })}
                placeholder="0"
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Open Rate + CTR row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                Avg Open Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={form.avgOpenRate}
                onChange={(e) => onUpdate({ avgOpenRate: e.target.value })}
                placeholder="0.0"
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                Avg CTR (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={form.avgCTR}
                onChange={(e) => onUpdate({ avgCTR: e.target.value })}
                placeholder="0.0"
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Customers Converted */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              Customers Converted
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={form.customersConverted}
              onChange={(e) => onUpdate({ customersConverted: e.target.value })}
              placeholder="0"
              className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              Notes (optional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Campaign details, audience targeting, etc."
              rows={2}
              className="w-full px-2.5 py-2 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-9 rounded-md bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!form.name.trim()}
            className="flex-1 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            {mode === "add" ? "Add Channel" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
