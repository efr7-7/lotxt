import { create } from "zustand";

// ─── Types ───

export type ChannelType = "paid" | "organic" | "referral";

export interface GrowthChannel {
  id: string;
  name: string;
  type: ChannelType;
  color: string;
  totalSpend: number;
  subscribersGained: number;
  avgOpenRate: number;
  avgCTR: number;
  customersConverted: number;
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelEntry {
  id: string;
  channelId: string;
  date: string; // YYYY-MM-DD
  spend: number;
  subscribersGained: number;
  notes: string;
}

export interface ChannelStats {
  channelId: string;
  channelName: string;
  type: ChannelType;
  color: string;
  totalSpend: number;
  totalSubscribers: number;
  cpa: number;
  ltv: number;
  roi: number;
  avgOpenRate: number;
  avgCTR: number;
  customersConverted: number;
  entryCount: number;
}

export interface MonthlyBreakdown {
  month: string; // YYYY-MM
  spend: number;
  subscribersGained: number;
  cpa: number;
}

// ─── Default Channels ───

const DEFAULT_CHANNELS: Omit<GrowthChannel, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Meta Ads",
    type: "paid",
    color: "#1877F2",
    totalSpend: 0,
    subscribersGained: 0,
    avgOpenRate: 0,
    avgCTR: 0,
    customersConverted: 0,
    isActive: true,
    notes: "",
  },
  {
    name: "Twitter/X Ads",
    type: "paid",
    color: "#000000",
    totalSpend: 0,
    subscribersGained: 0,
    avgOpenRate: 0,
    avgCTR: 0,
    customersConverted: 0,
    isActive: true,
    notes: "",
  },
  {
    name: "Organic Twitter",
    type: "organic",
    color: "#1DA1F2",
    totalSpend: 0,
    subscribersGained: 0,
    avgOpenRate: 0,
    avgCTR: 0,
    customersConverted: 0,
    isActive: true,
    notes: "",
  },
  {
    name: "LinkedIn Organic",
    type: "organic",
    color: "#0A66C2",
    totalSpend: 0,
    subscribersGained: 0,
    avgOpenRate: 0,
    avgCTR: 0,
    customersConverted: 0,
    isActive: true,
    notes: "",
  },
  {
    name: "Cross-Promotions",
    type: "organic",
    color: "#8B5CF6",
    totalSpend: 0,
    subscribersGained: 0,
    avgOpenRate: 0,
    avgCTR: 0,
    customersConverted: 0,
    isActive: true,
    notes: "",
  },
  {
    name: "Referral Program",
    type: "referral",
    color: "#10B981",
    totalSpend: 0,
    subscribersGained: 0,
    avgOpenRate: 0,
    avgCTR: 0,
    customersConverted: 0,
    isActive: true,
    notes: "",
  },
  {
    name: "beehiiv Boosts",
    type: "paid",
    color: "#F59E0B",
    totalSpend: 0,
    subscribersGained: 0,
    avgOpenRate: 0,
    avgCTR: 0,
    customersConverted: 0,
    isActive: true,
    notes: "",
  },
  {
    name: "Direct/Other",
    type: "organic",
    color: "#6B7280",
    totalSpend: 0,
    subscribersGained: 0,
    avgOpenRate: 0,
    avgCTR: 0,
    customersConverted: 0,
    isActive: true,
    notes: "",
  },
];

// ─── Persistence Helpers ───

const CHANNELS_KEY = "station:growth-channels";
const ENTRIES_KEY = "station:growth-entries";

function loadChannels(): GrowthChannel[] {
  try {
    const raw = localStorage.getItem(CHANNELS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore parse errors
  }
  // Seed with default channels on first load
  const now = new Date().toISOString();
  return DEFAULT_CHANNELS.map((ch) => ({
    ...ch,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }));
}

function loadEntries(): ChannelEntry[] {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return [];
}

function persistChannels(channels: GrowthChannel[]) {
  try {
    localStorage.setItem(CHANNELS_KEY, JSON.stringify(channels));
  } catch {
    // storage full / unavailable
  }
}

function persistEntries(entries: ChannelEntry[]) {
  try {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  } catch {
    // storage full / unavailable
  }
}

// ─── Computation Helpers ───

function computeCPA(totalSpend: number, subscribers: number): number {
  if (subscribers <= 0) return 0;
  return totalSpend / subscribers;
}

function computeLTV(customersConverted: number, totalSpend: number, subscribers: number): number {
  // LTV approximation: revenue per subscriber based on customer conversion ratio
  // If no customers converted yet, LTV is 0
  if (subscribers <= 0 || customersConverted <= 0) return 0;
  // Estimate: average revenue per customer * conversion rate
  // Without explicit revenue data, we use a ratio-based proxy:
  // LTV = (customersConverted / subscribers) * average spend to acquire them inverted
  // Simple model: LTV = customersConverted * (totalSpend / subscribers) when spend > 0
  // This gives "value generated per subscriber" relative to acquisition cost
  const cpa = computeCPA(totalSpend, subscribers);
  const conversionRate = customersConverted / subscribers;
  if (cpa <= 0) return conversionRate * 100; // organic: base value from conversion rate
  return (conversionRate * 100) / cpa; // higher conversion + lower CPA = higher LTV ratio
}

function computeROI(ltv: number, cpa: number): number {
  if (cpa <= 0) return ltv > 0 ? Infinity : 0;
  return ((ltv - cpa) / cpa) * 100;
}

// ─── Store Interface ───

interface GrowthState {
  channels: GrowthChannel[];
  entries: ChannelEntry[];

  // Channel CRUD
  addChannel: (channel: Omit<GrowthChannel, "id" | "createdAt" | "updatedAt">) => string;
  updateChannel: (id: string, updates: Partial<Omit<GrowthChannel, "id" | "createdAt">>) => void;
  removeChannel: (id: string) => void;

  // Entry CRUD
  addEntry: (entry: Omit<ChannelEntry, "id">) => string;
  removeEntry: (id: string) => void;

  // Computed stats
  getChannelStats: (channelId: string) => ChannelStats | null;
  getAllChannelStats: () => ChannelStats[];
  getMonthlyBreakdown: (channelId: string) => MonthlyBreakdown[];
  getTotalSpend: () => number;
  getTotalSubscribers: () => number;
  getAvgCPA: () => number;
}

// ─── Store ───

export const useGrowthStore = create<GrowthState>((set, get) => ({
  channels: loadChannels(),
  entries: loadEntries(),

  // ─── Channel CRUD ───

  addChannel: (channel) => {
    const now = new Date().toISOString();
    const newChannel: GrowthChannel = {
      ...channel,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    set((state) => {
      const channels = [...state.channels, newChannel];
      persistChannels(channels);
      return { channels };
    });
    return newChannel.id;
  },

  updateChannel: (id, updates) => {
    set((state) => {
      const channels = state.channels.map((ch) =>
        ch.id === id
          ? { ...ch, ...updates, updatedAt: new Date().toISOString() }
          : ch,
      );
      persistChannels(channels);
      return { channels };
    });
  },

  removeChannel: (id) => {
    set((state) => {
      const channels = state.channels.filter((ch) => ch.id !== id);
      const entries = state.entries.filter((e) => e.channelId !== id);
      persistChannels(channels);
      persistEntries(entries);
      return { channels, entries };
    });
  },

  // ─── Entry CRUD ───

  addEntry: (entry) => {
    const newEntry: ChannelEntry = {
      ...entry,
      id: crypto.randomUUID(),
    };
    set((state) => {
      const entries = [...state.entries, newEntry];
      persistEntries(entries);

      // Also update the parent channel's running totals
      const channels = state.channels.map((ch) => {
        if (ch.id !== entry.channelId) return ch;
        return {
          ...ch,
          totalSpend: ch.totalSpend + entry.spend,
          subscribersGained: ch.subscribersGained + entry.subscribersGained,
          updatedAt: new Date().toISOString(),
        };
      });
      persistChannels(channels);

      return { entries, channels };
    });
    return newEntry.id;
  },

  removeEntry: (id) => {
    set((state) => {
      const entry = state.entries.find((e) => e.id === id);
      const entries = state.entries.filter((e) => e.id !== id);
      persistEntries(entries);

      // Subtract from parent channel totals
      let channels = state.channels;
      if (entry) {
        channels = state.channels.map((ch) => {
          if (ch.id !== entry.channelId) return ch;
          return {
            ...ch,
            totalSpend: Math.max(0, ch.totalSpend - entry.spend),
            subscribersGained: Math.max(0, ch.subscribersGained - entry.subscribersGained),
            updatedAt: new Date().toISOString(),
          };
        });
        persistChannels(channels);
      }

      return { entries, channels };
    });
  },

  // ─── Computed Stats ───

  getChannelStats: (channelId) => {
    const state = get();
    const channel = state.channels.find((ch) => ch.id === channelId);
    if (!channel) return null;

    const channelEntries = state.entries.filter((e) => e.channelId === channelId);
    const totalSpend = channelEntries.reduce((sum, e) => sum + e.spend, 0) || channel.totalSpend;
    const totalSubscribers =
      channelEntries.reduce((sum, e) => sum + e.subscribersGained, 0) || channel.subscribersGained;

    const cpa = computeCPA(totalSpend, totalSubscribers);
    const ltv = computeLTV(channel.customersConverted, totalSpend, totalSubscribers);
    const roi = computeROI(ltv, cpa);

    return {
      channelId: channel.id,
      channelName: channel.name,
      type: channel.type,
      color: channel.color,
      totalSpend,
      totalSubscribers,
      cpa,
      ltv,
      roi,
      avgOpenRate: channel.avgOpenRate,
      avgCTR: channel.avgCTR,
      customersConverted: channel.customersConverted,
      entryCount: channelEntries.length,
    };
  },

  getAllChannelStats: () => {
    const state = get();
    const stats: ChannelStats[] = [];
    for (const channel of state.channels) {
      const s = get().getChannelStats(channel.id);
      if (s) stats.push(s);
    }
    return stats;
  },

  getMonthlyBreakdown: (channelId) => {
    const state = get();
    const channelEntries = state.entries.filter((e) => e.channelId === channelId);

    // Group by YYYY-MM
    const monthMap = new Map<string, { spend: number; subscribersGained: number }>();

    for (const entry of channelEntries) {
      const month = entry.date.slice(0, 7); // "YYYY-MM"
      const existing = monthMap.get(month) || { spend: 0, subscribersGained: 0 };
      existing.spend += entry.spend;
      existing.subscribersGained += entry.subscribersGained;
      monthMap.set(month, existing);
    }

    // Sort by month ascending and compute CPA per month
    const months = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        spend: data.spend,
        subscribersGained: data.subscribersGained,
        cpa: computeCPA(data.spend, data.subscribersGained),
      }));

    return months;
  },

  getTotalSpend: () => {
    const state = get();
    return state.channels.reduce((sum, ch) => sum + ch.totalSpend, 0);
  },

  getTotalSubscribers: () => {
    const state = get();
    return state.channels.reduce((sum, ch) => sum + ch.subscribersGained, 0);
  },

  getAvgCPA: () => {
    const state = get();
    const totalSpend = state.channels.reduce((sum, ch) => sum + ch.totalSpend, 0);
    const totalSubs = state.channels.reduce((sum, ch) => sum + ch.subscribersGained, 0);
    return computeCPA(totalSpend, totalSubs);
  },
}));
