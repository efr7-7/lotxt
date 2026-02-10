import { useState, useMemo, useCallback, type DragEvent } from "react";
import {
  useSponsorsStore,
  SPONSOR_STAGES,
  PLACEMENT_TYPES,
  type Sponsor,
  type SponsorStage,
  type PlacementType,
} from "@/stores/sponsors-store";
import { useAnalyticsStore } from "@/stores/analytics-store";
import { cn } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  DollarSign,
  Users,
  Calendar,
  Mail,
  Globe,
  Tag,
  GripVertical,
  ArrowRight,
  AlertCircle,
  Copy,
  FileText,
  ChevronDown,
  LayoutGrid,
  LayoutList,
  Building2,
} from "lucide-react";

// ─── Constants ───

const STAGE_META: Record<SponsorStage, { label: string; color: string; bg: string; border: string; text: string }> = {
  prospect: { label: "Prospect", color: "bg-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20", text: "text-gray-500" },
  outreach: { label: "Outreach", color: "bg-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-500" },
  negotiation: { label: "Negotiation", color: "bg-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-500" },
  booked: { label: "Booked", color: "bg-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-500" },
  live: { label: "Live", color: "bg-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-500" },
  invoiced: { label: "Invoiced", color: "bg-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-500" },
  paid: { label: "Paid", color: "bg-green-400", bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-500" },
};

const PLACEMENT_LABELS: Record<PlacementType, string> = {
  primary: "Primary",
  secondary: "Secondary",
  classified: "Classified",
  dedicated: "Dedicated",
};

type SortKey = "companyName" | "contactName" | "stage" | "totalValue" | "placementType" | "nextFollowUpAt" | "placementDates";
type SortDir = "asc" | "desc";

// ─── Helpers ───

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).toISOString().slice(0, 10) <= new Date().toISOString().slice(0, 10);
}

// ─── Main Component ───

export function SponsorsTab() {
  const {
    sponsors,
    packages,
    pipelineView,
    setPipelineView,
    addSponsor,
    updateSponsor,
    moveSponsor,
    deleteSponsor,
    getSponsorsByStage,
    getPipelineValue,
    getFollowUps,
  } = useSponsorsStore();

  const [showDialog, setShowDialog] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("companyName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [dragOverStage, setDragOverStage] = useState<SponsorStage | null>(null);
  const [copiedRateCard, setCopiedRateCard] = useState(false);

  const followUps = getFollowUps();
  const pipelineValue = getPipelineValue();
  const activeDeals = sponsors.filter((s) => !["paid", "prospect"].includes(s.stage)).length;
  const monthlyRecurring = sponsors
    .filter((s) => s.stage === "live" || s.stage === "booked")
    .reduce((sum, s) => sum + s.totalValue, 0);

  // ─── Sort for list view ───

  const sortedSponsors = useMemo(() => {
    const arr = [...sponsors];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "companyName":
          cmp = a.companyName.localeCompare(b.companyName);
          break;
        case "contactName":
          cmp = a.contactName.localeCompare(b.contactName);
          break;
        case "stage":
          cmp = SPONSOR_STAGES.indexOf(a.stage) - SPONSOR_STAGES.indexOf(b.stage);
          break;
        case "totalValue":
          cmp = a.totalValue - b.totalValue;
          break;
        case "placementType":
          cmp = a.placementType.localeCompare(b.placementType);
          break;
        case "nextFollowUpAt":
          cmp = (a.nextFollowUpAt || "").localeCompare(b.nextFollowUpAt || "");
          break;
        case "placementDates":
          cmp = (a.placementDates[0] || "").localeCompare(b.placementDates[0] || "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [sponsors, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // ─── Drag and drop ───

  const handleDragStart = useCallback((e: DragEvent, sponsorId: string) => {
    e.dataTransfer.setData("text/plain", sponsorId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: DragEvent, stage: SponsorStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverStage(null);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent, stage: SponsorStage) => {
      e.preventDefault();
      const sponsorId = e.dataTransfer.getData("text/plain");
      if (sponsorId) {
        moveSponsor(sponsorId, stage);
      }
      setDragOverStage(null);
    },
    [moveSponsor],
  );

  // ─── Open dialog ───

  const openAddDialog = () => {
    setEditingSponsor(null);
    setShowDialog(true);
  };

  const openEditDialog = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setShowDialog(true);
  };

  // ─── Rate card ───

  const analyticsData = useAnalyticsStore((s) => s.data);
  const subscriberCount = analyticsData?.total_subscribers ?? 0;
  const openRate = analyticsData?.open_rate ?? 0;

  const primaryCpm = subscriberCount > 0 ? Math.round((50 / 1000) * subscriberCount) : 50;
  const secondaryCpm = subscriberCount > 0 ? Math.round((30 / 1000) * subscriberCount) : 30;
  const classifiedCpm = subscriberCount > 0 ? Math.round((15 / 1000) * subscriberCount) : 15;

  const rateCardText = useMemo(() => {
    const lines = [
      "=== RATE CARD ===",
      "",
      `Subscribers: ${subscriberCount > 0 ? subscriberCount.toLocaleString() : "N/A"}`,
      `Open Rate: ${openRate > 0 ? `${openRate.toFixed(1)}%` : "N/A"}`,
      "",
      "Pricing:",
      `  Primary Placement:    ${formatCurrency(primaryCpm)} / issue`,
      `  Secondary Placement:  ${formatCurrency(secondaryCpm)} / issue`,
      `  Classified Ad:        ${formatCurrency(classifiedCpm)} / issue`,
      "",
      "Packages:",
    ];

    for (const pkg of packages) {
      lines.push(`  ${pkg.name}: ${formatCurrency(pkg.totalPrice)} (${pkg.numberOfRuns} run${pkg.numberOfRuns !== 1 ? "s" : ""}${pkg.discountPercent > 0 ? `, ${pkg.discountPercent}% discount` : ""})`);
      lines.push(`    ${pkg.description}`);
    }

    lines.push("");
    lines.push("For inquiries, reach out directly.");
    return lines.join("\n");
  }, [subscriberCount, openRate, primaryCpm, secondaryCpm, classifiedCpm, packages]);

  const copyRateCard = () => {
    navigator.clipboard.writeText(rateCardText).then(() => {
      setCopiedRateCard(true);
      setTimeout(() => setCopiedRateCard(false), 2000);
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-8 py-6">
        {/* Follow-up alerts */}
        {followUps.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-1">
                {followUps.length} sponsor{followUps.length !== 1 ? "s" : ""} need{followUps.length === 1 ? "s" : ""} follow-up
              </p>
              <div className="flex flex-wrap gap-1.5">
                {followUps.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => openEditDialog(s)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-[10px] font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-colors"
                  >
                    <Building2 className="w-2.5 h-2.5" />
                    {s.companyName}
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-foreground/90">Sponsor Pipeline</h1>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-[11px] text-muted-foreground/50">
                Pipeline: <span className="font-semibold text-foreground/70">{formatCurrency(pipelineValue)}</span>
              </span>
              <span className="text-[11px] text-muted-foreground/50">
                Active deals: <span className="font-semibold text-foreground/70">{activeDeals}</span>
              </span>
              <span className="text-[11px] text-muted-foreground/50">
                Monthly sponsor revenue: <span className="font-semibold text-foreground/70">{formatCurrency(monthlyRecurring)}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPipelineView(pipelineView === "kanban" ? "list" : "kanban")}
              className="h-7 px-3 rounded-md border border-border bg-background text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              {pipelineView === "kanban" ? (
                <>
                  <LayoutList className="w-3 h-3" />
                  List View
                </>
              ) : (
                <>
                  <LayoutGrid className="w-3 h-3" />
                  Kanban View
                </>
              )}
            </button>
            <button
              onClick={openAddDialog}
              className="h-7 px-3 rounded-md bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3" />
              Add Sponsor
            </button>
          </div>
        </div>

        {/* Kanban View */}
        {pipelineView === "kanban" && (
          <div className="flex gap-2.5 overflow-x-auto pb-4 -mx-2 px-2">
            {SPONSOR_STAGES.map((stage) => {
              const meta = STAGE_META[stage];
              const stageSponsors = getSponsorsByStage(stage);
              const stageValue = stageSponsors.reduce((sum, s) => sum + s.totalValue, 0);

              return (
                <div
                  key={stage}
                  className={cn(
                    "flex-shrink-0 w-[200px] flex flex-col rounded-xl border transition-colors",
                    dragOverStage === stage
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/40 bg-card/30",
                  )}
                  onDragOver={(e) => handleDragOver(e, stage)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage)}
                >
                  {/* Column header */}
                  <div className="p-3 border-b border-border/30">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn("w-2 h-2 rounded-full", meta.color)} />
                      <span className="text-[11px] font-semibold text-foreground/80">{meta.label}</span>
                      <span className="ml-auto text-[10px] font-medium text-muted-foreground/50 bg-muted/60 px-1.5 py-0.5 rounded">
                        {stageSponsors.length}
                      </span>
                    </div>
                    {stageValue > 0 && (
                      <span className="text-[10px] text-muted-foreground/40">{formatCurrency(stageValue)}</span>
                    )}
                  </div>

                  {/* Cards */}
                  <div className="flex-1 p-2 space-y-1.5 min-h-[100px] overflow-y-auto max-h-[calc(100vh-380px)]">
                    {stageSponsors.length === 0 && (
                      <div className="flex items-center justify-center py-6">
                        <span className="text-[10px] text-muted-foreground/30">No sponsors</span>
                      </div>
                    )}
                    {stageSponsors.map((sponsor) => (
                      <div
                        key={sponsor.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, sponsor.id)}
                        onClick={() => openEditDialog(sponsor)}
                        className="group rounded-lg border border-border/30 bg-background/80 hover:border-border/60 p-2.5 cursor-pointer transition-all hover:shadow-[var(--shadow-sm)]"
                      >
                        <div className="flex items-start gap-1.5">
                          <GripVertical className="w-3 h-3 text-muted-foreground/20 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-foreground/90 truncate">{sponsor.companyName}</p>
                            <p className="text-[9px] text-muted-foreground/50 truncate">{sponsor.contactName}</p>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-foreground/80">{formatCurrency(sponsor.totalValue)}</span>
                          <span className={cn("text-[8px] font-medium px-1.5 py-0.5 rounded", meta.bg, meta.text)}>
                            {PLACEMENT_LABELS[sponsor.placementType] || sponsor.placementType}
                          </span>
                        </div>

                        {sponsor.nextFollowUpAt && (
                          <div className={cn(
                            "mt-1.5 flex items-center gap-1 text-[9px]",
                            isOverdue(sponsor.nextFollowUpAt) ? "text-amber-500" : "text-muted-foreground/40"
                          )}>
                            <Calendar className="w-2.5 h-2.5" />
                            Follow-up: {formatDate(sponsor.nextFollowUpAt)}
                          </div>
                        )}

                        {sponsor.placementDates.length > 0 && (
                          <div className="mt-1 flex items-center gap-1 text-[9px] text-muted-foreground/40">
                            <Calendar className="w-2.5 h-2.5" />
                            {sponsor.placementDates.slice(0, 2).map((d) => formatDate(d)).join(", ")}
                            {sponsor.placementDates.length > 2 && ` +${sponsor.placementDates.length - 2}`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {pipelineView === "list" && (
          <div className="rounded-xl border border-border/40 overflow-hidden">
            {sponsors.length === 0 ? (
              <p className="text-xs text-muted-foreground/40 text-center py-16">
                No sponsors yet. Click "Add Sponsor" to get started.
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-wider bg-muted/30">
                    <SortableHeader label="Company" sortKey="companyName" currentKey={sortKey} dir={sortDir} onClick={toggleSort} className="pl-4" />
                    <SortableHeader label="Contact" sortKey="contactName" currentKey={sortKey} dir={sortDir} onClick={toggleSort} />
                    <SortableHeader label="Stage" sortKey="stage" currentKey={sortKey} dir={sortDir} onClick={toggleSort} />
                    <SortableHeader label="Value" sortKey="totalValue" currentKey={sortKey} dir={sortDir} onClick={toggleSort} className="text-right" />
                    <SortableHeader label="Type" sortKey="placementType" currentKey={sortKey} dir={sortDir} onClick={toggleSort} />
                    <SortableHeader label="Next Follow-up" sortKey="nextFollowUpAt" currentKey={sortKey} dir={sortDir} onClick={toggleSort} />
                    <SortableHeader label="Placements" sortKey="placementDates" currentKey={sortKey} dir={sortDir} onClick={toggleSort} />
                    <th className="text-right px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSponsors.map((sponsor) => {
                    const meta = STAGE_META[sponsor.stage];
                    return (
                      <tr key={sponsor.id} className="border-t border-border/10 hover:bg-accent/20 transition-colors">
                        <td className="px-4 py-2">
                          <p className="text-[11px] font-medium text-foreground">{sponsor.companyName}</p>
                        </td>
                        <td className="px-3 py-2">
                          <p className="text-[10px] text-muted-foreground">{sponsor.contactName}</p>
                          <p className="text-[9px] text-muted-foreground/40">{sponsor.contactEmail}</p>
                        </td>
                        <td className="px-3 py-2">
                          <span className={cn("inline-flex items-center gap-1.5 text-[9px] font-medium px-2 py-0.5 rounded", meta.bg, meta.text)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", meta.color)} />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="text-[11px] font-semibold text-foreground">{formatCurrency(sponsor.totalValue)}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-[10px] text-muted-foreground capitalize">{PLACEMENT_LABELS[sponsor.placementType] || sponsor.placementType}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={cn(
                            "text-[10px]",
                            sponsor.nextFollowUpAt && isOverdue(sponsor.nextFollowUpAt)
                              ? "text-amber-500 font-medium"
                              : "text-muted-foreground/50"
                          )}>
                            {formatDate(sponsor.nextFollowUpAt)}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-[10px] text-muted-foreground/50">
                            {sponsor.placementDates.length > 0
                              ? sponsor.placementDates.slice(0, 2).map((d) => formatDate(d)).join(", ")
                              : "\u2014"}
                            {sponsor.placementDates.length > 2 && ` +${sponsor.placementDates.length - 2}`}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditDialog(sponsor)}
                              className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/30 hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteSponsor(sponsor.id)}
                              className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Rate Card Section */}
        <div className="mt-8 rounded-xl border border-border/40 bg-card/30 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-muted-foreground/50" />
              <h3 className="text-xs font-semibold text-foreground/80">Rate Card</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={copyRateCard}
                className="h-6 px-2.5 rounded-md border border-border bg-background text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
              >
                {copiedRateCard ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copiedRateCard ? "Copied" : "Copy Rate Card"}
              </button>
              <button className="h-6 px-2.5 rounded-md border border-border bg-background text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Export PDF
              </button>
            </div>
          </div>

          <div className="p-4">
            {/* Newsletter stats */}
            <div className="flex items-center gap-6 mb-4">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary/60" />
                <span className="text-[10px] text-muted-foreground/50">Subscribers:</span>
                <span className="text-[11px] font-semibold text-foreground/80">
                  {subscriberCount > 0 ? subscriberCount.toLocaleString() : "Not connected"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary/60" />
                <span className="text-[10px] text-muted-foreground/50">Open Rate:</span>
                <span className="text-[11px] font-semibold text-foreground/80">
                  {openRate > 0 ? `${openRate.toFixed(1)}%` : "N/A"}
                </span>
              </div>
            </div>

            {/* CPM Pricing tiers */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg border border-border/30 bg-background/50 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[10px] font-semibold text-foreground/80">Primary</span>
                </div>
                <span className="text-lg font-bold text-foreground/90">{formatCurrency(primaryCpm)}</span>
                <span className="text-[9px] text-muted-foreground/40 ml-1">/ issue</span>
              </div>
              <div className="rounded-lg border border-border/30 bg-background/50 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-[10px] font-semibold text-foreground/80">Secondary</span>
                </div>
                <span className="text-lg font-bold text-foreground/90">{formatCurrency(secondaryCpm)}</span>
                <span className="text-[9px] text-muted-foreground/40 ml-1">/ issue</span>
              </div>
              <div className="rounded-lg border border-border/30 bg-background/50 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-[10px] font-semibold text-foreground/80">Classified</span>
                </div>
                <span className="text-lg font-bold text-foreground/90">{formatCurrency(classifiedCpm)}</span>
                <span className="text-[9px] text-muted-foreground/40 ml-1">/ issue</span>
              </div>
            </div>

            {/* Packages */}
            {packages.length > 0 && (
              <div>
                <h4 className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-2">Packages</h4>
                <div className="space-y-1.5">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="flex items-center justify-between rounded-lg border border-border/20 bg-background/30 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-foreground/80">{pkg.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">{pkg.placementType}</span>
                          {pkg.discountPercent > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-medium">
                              {pkg.discountPercent}% off
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-muted-foreground/40 mt-0.5 truncate">{pkg.description}</p>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <span className="text-[12px] font-bold text-foreground/80">{formatCurrency(pkg.totalPrice)}</span>
                        <span className="text-[9px] text-muted-foreground/40 ml-1">
                          ({pkg.numberOfRuns} run{pkg.numberOfRuns !== 1 ? "s" : ""})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog */}
      {showDialog && (
        <SponsorDialog
          sponsor={editingSponsor}
          onClose={() => {
            setShowDialog(false);
            setEditingSponsor(null);
          }}
          onSave={(data) => {
            if (editingSponsor) {
              updateSponsor(editingSponsor.id, data);
            } else {
              addSponsor(data);
            }
            setShowDialog(false);
            setEditingSponsor(null);
          }}
          onDelete={
            editingSponsor
              ? () => {
                  deleteSponsor(editingSponsor.id);
                  setShowDialog(false);
                  setEditingSponsor(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

// ─── Sortable Table Header ───

function SortableHeader({
  label,
  sortKey,
  currentKey,
  dir,
  onClick,
  className,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  dir: SortDir;
  onClick: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = currentKey === sortKey;
  return (
    <th
      onClick={() => onClick(sortKey)}
      className={cn(
        "text-left px-3 py-2 cursor-pointer select-none hover:text-muted-foreground/80 transition-colors",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && (
          <ChevronDown className={cn("w-2.5 h-2.5 transition-transform", dir === "asc" ? "rotate-0" : "rotate-180")} />
        )}
      </span>
    </th>
  );
}

// ─── Add / Edit Sponsor Dialog ───

interface SponsorDialogProps {
  sponsor: Sponsor | null;
  onClose: () => void;
  onSave: (data: Omit<Sponsor, "id" | "createdAt" | "updatedAt">) => void;
  onDelete?: () => void;
}

function SponsorDialog({ sponsor, onClose, onSave, onDelete }: SponsorDialogProps) {
  const [companyName, setCompanyName] = useState(sponsor?.companyName ?? "");
  const [contactName, setContactName] = useState(sponsor?.contactName ?? "");
  const [contactEmail, setContactEmail] = useState(sponsor?.contactEmail ?? "");
  const [website, setWebsite] = useState(sponsor?.website ?? "");
  const [stage, setStage] = useState<SponsorStage>(sponsor?.stage ?? "prospect");
  const [placementType, setPlacementType] = useState<PlacementType>(sponsor?.placementType ?? "primary");
  const [cpm, setCpm] = useState(sponsor?.cpm?.toString() ?? "");
  const [totalValue, setTotalValue] = useState(sponsor?.totalValue?.toString() ?? "");
  const [placementDatesStr, setPlacementDatesStr] = useState(sponsor?.placementDates?.join(", ") ?? "");
  const [notes, setNotes] = useState(sponsor?.notes ?? "");
  const [tagsStr, setTagsStr] = useState(sponsor?.tags?.join(", ") ?? "");
  const [nextFollowUpAt, setNextFollowUpAt] = useState(sponsor?.nextFollowUpAt?.slice(0, 10) ?? "");
  const [lastContactedAt, setLastContactedAt] = useState(sponsor?.lastContactedAt?.slice(0, 10) ?? "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = () => {
    if (!companyName.trim()) return;

    const parsedDates = placementDatesStr
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d.length > 0 && !isNaN(Date.parse(d)));

    const parsedTags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onSave({
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      website: website.trim(),
      stage,
      placementType,
      cpm: parseFloat(cpm) || 0,
      totalValue: parseFloat(totalValue) || 0,
      placementDates: parsedDates,
      notes: notes.trim(),
      tags: parsedTags,
      nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : null,
      lastContactedAt: lastContactedAt ? new Date(lastContactedAt).toISOString() : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-popover border border-border rounded-xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              {sponsor ? "Edit Sponsor" : "Add Sponsor"}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {onDelete && !showDeleteConfirm && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            {showDeleteConfirm && (
              <div className="flex items-center gap-1 mr-2">
                <span className="text-[10px] text-destructive font-medium">Delete?</span>
                <button
                  onClick={() => onDelete?.()}
                  className="h-5 w-5 rounded flex items-center justify-center bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:bg-muted"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Row: Company + Contact */}
          <div className="grid grid-cols-2 gap-3">
            <FieldInput label="Company Name" icon={Building2} value={companyName} onChange={setCompanyName} placeholder="Acme Inc." required />
            <FieldInput label="Contact Name" icon={Users} value={contactName} onChange={setContactName} placeholder="Jane Doe" />
          </div>

          {/* Row: Email + Website */}
          <div className="grid grid-cols-2 gap-3">
            <FieldInput label="Contact Email" icon={Mail} value={contactEmail} onChange={setContactEmail} placeholder="jane@acme.com" type="email" />
            <FieldInput label="Website" icon={Globe} value={website} onChange={setWebsite} placeholder="https://acme.com" />
          </div>

          {/* Row: Stage + Placement Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Stage</label>
              <div className="relative">
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as SponsorStage)}
                  className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring appearance-none pr-7"
                >
                  {SPONSOR_STAGES.map((s) => (
                    <option key={s} value={s}>{STAGE_META[s].label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/40 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Placement Type</label>
              <div className="relative">
                <select
                  value={placementType}
                  onChange={(e) => setPlacementType(e.target.value as PlacementType)}
                  className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring appearance-none pr-7"
                >
                  {PLACEMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{PLACEMENT_LABELS[t] || t}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/40 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row: CPM + Total Value */}
          <div className="grid grid-cols-2 gap-3">
            <FieldInput label="CPM ($)" icon={DollarSign} value={cpm} onChange={setCpm} placeholder="50" type="number" />
            <FieldInput label="Total Value ($)" icon={DollarSign} value={totalValue} onChange={setTotalValue} placeholder="2000" type="number" />
          </div>

          {/* Placement Dates */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Placement Dates
            </label>
            <input
              value={placementDatesStr}
              onChange={(e) => setPlacementDatesStr(e.target.value)}
              placeholder="2026-03-01, 2026-03-15, 2026-04-01"
              className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="text-[9px] text-muted-foreground/30 mt-0.5 block">Comma-separated dates (YYYY-MM-DD)</span>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Discussed pricing, awaiting approval from marketing team..."
              rows={3}
              className="w-full px-2.5 py-2 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              Tags
            </label>
            <input
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="saas, b2b, recurring"
              className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="text-[9px] text-muted-foreground/30 mt-0.5 block">Comma-separated</span>
          </div>

          {/* Row: Follow-up + Last Contacted */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Next Follow-up
              </label>
              <input
                type="date"
                value={nextFollowUpAt}
                onChange={(e) => setNextFollowUpAt(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Last Contacted
              </label>
              <input
                type="date"
                value={lastContactedAt}
                onChange={(e) => setLastContactedAt(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border shrink-0">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 h-9 rounded-md border border-border bg-background text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!companyName.trim()}
              className="flex-1 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {sponsor ? "Save Changes" : "Add Sponsor"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Field Input Helper ───

function FieldInput({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] font-medium text-muted-foreground mb-1 flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}
