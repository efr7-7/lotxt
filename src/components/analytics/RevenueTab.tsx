import { useEffect, useState } from "react";
import { useRevenueStore } from "@/stores/revenue-store";
import { AddRevenueDialog } from "./AddRevenueDialog";
import { MetricCard } from "./MetricCard";
import {
  DollarSign, TrendingUp, BarChart3, Users, Plus, Loader2, Trash2,
} from "lucide-react";
import { toast } from "@/stores/toast-store";

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function RevenueTab() {
  const { entries, stats, isLoading, fetchEntries, fetchStats, deleteEntry } = useRevenueStore();
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchEntries();
    fetchStats();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry(id);
      toast.success("Entry deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-8 py-6">
        {/* Metric cards */}
        {stats && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            <MetricCard
              label="MRR"
              value={stats.mrr / 100}
              icon={DollarSign}
              format="currency"
              accentColor="hsl(var(--success))"
            />
            <MetricCard
              label="ARR"
              value={stats.arr / 100}
              icon={TrendingUp}
              format="currency"
              accentColor="hsl(var(--primary))"
            />
            <MetricCard
              label="Total Revenue"
              value={stats.total / 100}
              icon={BarChart3}
              format="currency"
              accentColor="hsl(var(--info))"
            />
            <MetricCard
              label="Avg / Subscriber"
              value={stats.avgPerSubscriber / 100}
              icon={Users}
              format="currency"
              accentColor="hsl(var(--warning))"
            />
          </div>
        )}

        {/* Revenue over time */}
        {stats && stats.monthlyBreakdown.length > 0 && (
          <div className="rounded-xl border border-border/40 bg-card/30 p-4 mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground mb-3">Monthly Revenue</h3>
            <div className="flex items-end gap-1 h-32">
              {stats.monthlyBreakdown.map((m) => {
                const maxAmt = Math.max(...stats.monthlyBreakdown.map((x) => x.amount), 1);
                const height = (m.amount / maxAmt) * 100;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[8px] text-muted-foreground/50">{formatCurrency(m.amount)}</span>
                    <div
                      className="w-full bg-primary/20 rounded-t"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    >
                      <div className="w-full h-full bg-primary/60 rounded-t" />
                    </div>
                    <span className="text-[8px] text-muted-foreground/40">{m.month.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Source breakdown */}
        {stats && stats.sourceBreakdown.length > 0 && (
          <div className="rounded-xl border border-border/40 bg-card/30 p-4 mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground mb-3">By Source</h3>
            <div className="space-y-2">
              {stats.sourceBreakdown.map((s) => {
                const maxAmt = Math.max(...stats.sourceBreakdown.map((x) => x.amount), 1);
                const width = (s.amount / maxAmt) * 100;
                return (
                  <div key={s.source} className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground w-20 capitalize">{s.source}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary/60 rounded-full" style={{ width: `${width}%` }} />
                    </div>
                    <span className="text-[10px] font-medium text-foreground w-20 text-right">{formatCurrency(s.amount)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add button + entries table */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground">Revenue Entries</h3>
          <button
            onClick={() => setShowAddDialog(true)}
            className="h-7 px-3 rounded-md bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3 h-3" />
            Add Revenue
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-xs text-muted-foreground/40 text-center py-16">
            No revenue entries yet. Click "Add Revenue" to get started.
          </p>
        ) : (
          <div className="rounded-xl border border-border/40 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-wider bg-muted/30">
                  <th className="text-left px-4 py-2">Date</th>
                  <th className="text-left px-3 py-2">Source</th>
                  <th className="text-right px-3 py-2">Amount</th>
                  <th className="text-left px-3 py-2">Type</th>
                  <th className="text-left px-3 py-2">Description</th>
                  <th className="text-right px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-t border-border/10 hover:bg-accent/20">
                    <td className="px-4 py-2 text-[10px] text-muted-foreground">{new Date(e.recordedAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-[10px] font-medium text-foreground capitalize">{e.source}</td>
                    <td className="px-3 py-2 text-[10px] font-semibold text-foreground text-right">{formatCurrency(e.amountCents)}</td>
                    <td className="px-3 py-2 text-[10px] text-muted-foreground capitalize">{e.type}</td>
                    <td className="px-3 py-2 text-[10px] text-muted-foreground/60 truncate max-w-[200px]">{e.description || "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showAddDialog && <AddRevenueDialog onClose={() => setShowAddDialog(false)} />}
    </div>
  );
}
