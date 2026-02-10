import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface RevenueEntry {
  id: string;
  source: string;
  amountCents: number;
  currency: string;
  type: string;
  subscriberEmail: string | null;
  description: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  recordedAt: string;
  createdAt: string;
}

export interface RevenueStats {
  mrr: number;
  arr: number;
  total: number;
  avgPerSubscriber: number;
  monthlyBreakdown: { month: string; amount: number }[];
  sourceBreakdown: { source: string; amount: number }[];
}

interface RevenueState {
  entries: RevenueEntry[];
  stats: RevenueStats | null;
  isLoading: boolean;

  fetchEntries: (from?: string, to?: string) => Promise<void>;
  fetchStats: (from?: string, to?: string) => Promise<void>;
  addEntry: (params: {
    source: string;
    amountCents: number;
    currency?: string;
    type?: string;
    subscriberEmail?: string;
    description?: string;
    recordedAt: string;
  }) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

export const useRevenueStore = create<RevenueState>((set, get) => ({
  entries: [],
  stats: null,
  isLoading: false,

  fetchEntries: async (from, to) => {
    set({ isLoading: true });
    try {
      const raw = await invoke<any[]>("list_revenue_entries", { from, to });
      set({
        entries: raw.map((e) => ({
          id: e.id,
          source: e.source,
          amountCents: e.amount_cents,
          currency: e.currency,
          type: e.type,
          subscriberEmail: e.subscriber_email,
          description: e.description,
          periodStart: e.period_start,
          periodEnd: e.period_end,
          recordedAt: e.recorded_at,
          createdAt: e.created_at,
        })),
      });
    } catch {
      // Ignore
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStats: async (from, to) => {
    try {
      const raw = await invoke<any>("get_revenue_stats", { from, to });
      set({
        stats: {
          mrr: raw.mrr,
          arr: raw.arr,
          total: raw.total,
          avgPerSubscriber: raw.avg_per_subscriber,
          monthlyBreakdown: raw.monthly_breakdown.map((m: any) => ({ month: m.month, amount: m.amount })),
          sourceBreakdown: raw.source_breakdown.map((s: any) => ({ source: s.source, amount: s.amount })),
        },
      });
    } catch {
      // Ignore
    }
  },

  addEntry: async (params) => {
    await invoke("add_revenue_entry", params);
    get().fetchEntries();
    get().fetchStats();
  },

  deleteEntry: async (id) => {
    await invoke("delete_revenue_entry", { id });
    get().fetchEntries();
    get().fetchStats();
  },
}));
