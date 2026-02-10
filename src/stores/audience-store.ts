import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface UnifiedSubscriber {
  id: string;
  email: string;
  name: string | null;
  platforms: { platform: string; accountId: string; status: string; subscribedAt: string | null }[];
  engagementScore: number;
  totalOpens: number;
  totalClicks: number;
  firstSeenAt: string;
  lastSeenAt: string;
  tags: string[];
}

export interface AudienceStats {
  totalUnique: number;
  newLast30d: number;
  avgEngagement: number;
  platformBreakdown: { platform: string; count: number }[];
  growthData: { date: string; count: number }[];
}

export interface Segment {
  name: string;
  description: string;
  count: number;
  color: string;
}

interface AudienceState {
  subscribers: UnifiedSubscriber[];
  total: number;
  page: number;
  perPage: number;
  stats: AudienceStats | null;
  segments: Segment[];
  isLoading: boolean;
  isSyncing: boolean;
  selectedSubscriber: UnifiedSubscriber | null;
  search: string;
  tagFilter: string;

  setSearch: (q: string) => void;
  setTagFilter: (tag: string) => void;
  setSelectedSubscriber: (sub: UnifiedSubscriber | null) => void;
  fetchSubscribers: (page?: number) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchSegments: () => Promise<void>;
  syncAll: (accounts: { platform: string; accountId: string; publicationId?: string }[]) => Promise<void>;
  tagSubscribers: (ids: string[], tag: string) => Promise<void>;
  untagSubscribers: (ids: string[], tag: string) => Promise<void>;
}

export const useAudienceStore = create<AudienceState>((set, get) => ({
  subscribers: [],
  total: 0,
  page: 1,
  perPage: 50,
  stats: null,
  segments: [],
  isLoading: false,
  isSyncing: false,
  selectedSubscriber: null,
  search: "",
  tagFilter: "",

  setSearch: (q) => { set({ search: q }); get().fetchSubscribers(1); },
  setTagFilter: (tag) => { set({ tagFilter: tag }); get().fetchSubscribers(1); },
  setSelectedSubscriber: (sub) => set({ selectedSubscriber: sub }),

  fetchSubscribers: async (page) => {
    const p = page || get().page;
    set({ isLoading: true, page: p });
    try {
      const raw = await invoke<any>("get_unified_subscribers", {
        page: p,
        perPage: get().perPage,
        search: get().search || undefined,
        tag: get().tagFilter || undefined,
      });
      set({
        subscribers: raw.subscribers.map((s: any) => ({
          id: s.id,
          email: s.email,
          name: s.name,
          platforms: s.platforms.map((pl: any) => ({
            platform: pl.platform,
            accountId: pl.account_id,
            status: pl.status,
            subscribedAt: pl.subscribed_at,
          })),
          engagementScore: s.engagement_score,
          totalOpens: s.total_opens,
          totalClicks: s.total_clicks,
          firstSeenAt: s.first_seen_at,
          lastSeenAt: s.last_seen_at,
          tags: s.tags,
        })),
        total: raw.total,
      });
    } catch {
      // Ignore
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const raw = await invoke<any>("get_audience_stats");
      set({
        stats: {
          totalUnique: raw.total_unique,
          newLast30d: raw.new_last_30d,
          avgEngagement: raw.avg_engagement,
          platformBreakdown: raw.platform_breakdown.map((p: any) => ({ platform: p.platform, count: p.count })),
          growthData: raw.growth_data.map((g: any) => ({ date: g.date, count: g.count })),
        },
      });
    } catch {
      // Ignore
    }
  },

  fetchSegments: async () => {
    try {
      const raw = await invoke<any[]>("get_audience_segments");
      set({
        segments: raw.map((s) => ({
          name: s.name,
          description: s.description,
          count: s.count,
          color: s.color,
        })),
      });
    } catch {
      // Ignore
    }
  },

  syncAll: async (accounts) => {
    set({ isSyncing: true });
    for (const acc of accounts) {
      try {
        await invoke("sync_subscribers", {
          platform: acc.platform,
          accountId: acc.accountId,
          publicationId: acc.publicationId,
        });
      } catch {
        // Continue syncing other accounts
      }
    }
    set({ isSyncing: false });
    get().fetchSubscribers(1);
    get().fetchStats();
    get().fetchSegments();
  },

  tagSubscribers: async (ids, tag) => {
    await invoke("tag_subscribers", { ids, tag });
    get().fetchSubscribers();
  },

  untagSubscribers: async (ids, tag) => {
    await invoke("untag_subscribers", { ids, tag });
    get().fetchSubscribers();
  },
}));
