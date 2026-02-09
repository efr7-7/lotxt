import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { PlatformId } from "@/lib/platforms";

export interface AnalyticsData {
  total_subscribers: number;
  open_rate: number;
  click_rate: number;
  subscriber_growth: { date: string; count: number }[];
  recent_posts: PostPerformance[];
}

export interface PostPerformance {
  id: string;
  title: string;
  published_at: string;
  opens: number;
  clicks: number;
  unsubscribes: number;
  platform: string;
}

interface AnalyticsState {
  data: AnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  selectedPlatform: PlatformId | "all";
  dateRange: { from: string; to: string };

  setSelectedPlatform: (p: PlatformId | "all") => void;
  setDateRange: (range: { from: string; to: string }) => void;
  fetchAnalytics: (
    platform: PlatformId,
    accountId: string,
    publicationId?: string,
  ) => Promise<void>;
  fetchAllAnalytics: (
    accounts: {
      platform: PlatformId;
      accountId: string;
      publicationId?: string;
    }[],
  ) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  data: null,
  isLoading: false,
  error: null,
  selectedPlatform: "all",
  dateRange: {
    from: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  },

  setSelectedPlatform: (p) => set({ selectedPlatform: p }),
  setDateRange: (range) => set({ dateRange: range }),

  fetchAnalytics: async (platform, accountId, publicationId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await invoke<AnalyticsData>("get_analytics", {
        platform,
        accountId,
        publicationId: publicationId || null,
      });
      set({ data: result, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  fetchAllAnalytics: async (accounts) => {
    set({ isLoading: true, error: null });
    try {
      const results = await Promise.allSettled(
        accounts.map((acc) =>
          invoke<AnalyticsData>("get_analytics", {
            platform: acc.platform,
            accountId: acc.accountId,
            publicationId: acc.publicationId || null,
          }),
        ),
      );

      // Merge all analytics
      let totalSubs = 0;
      let totalOpenRate = 0;
      let totalClickRate = 0;
      let rateCount = 0;
      const allPosts: PostPerformance[] = [];
      const allGrowth: { date: string; count: number }[] = [];

      for (const r of results) {
        if (r.status === "fulfilled") {
          totalSubs += r.value.total_subscribers;
          if (r.value.open_rate > 0) {
            totalOpenRate += r.value.open_rate;
            rateCount++;
          }
          if (r.value.click_rate > 0) {
            totalClickRate += r.value.click_rate;
          }
          allPosts.push(...r.value.recent_posts);
          allGrowth.push(...r.value.subscriber_growth);
        }
      }

      // Sort posts by date descending
      allPosts.sort(
        (a, b) =>
          new Date(b.published_at).getTime() -
          new Date(a.published_at).getTime(),
      );

      set({
        data: {
          total_subscribers: totalSubs,
          open_rate: rateCount > 0 ? totalOpenRate / rateCount : 0,
          click_rate: rateCount > 0 ? totalClickRate / rateCount : 0,
          subscriber_growth: allGrowth,
          recent_posts: allPosts,
        },
        isLoading: false,
      });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },
}));
