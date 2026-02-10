import { create } from "zustand";

// ─── Types ───

export interface BusinessLine {
  id: string;
  name: string;
  type: "media" | "ecommerce" | "services" | "saas" | "events" | "licensing" | "other";
  color: string;
  monthlyRevenue: number;
  monthlyCosts: number;
  isActive: boolean;
  launchDate: string;
  notes: string;
}

export interface RevenueEntry {
  id: string;
  businessLineId: string;
  month: string;
  revenue: number;
  costs: number;
  subscribers?: number;
  notes: string;
}

export interface HoldCoMetrics {
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

export interface CommunityHealth {
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

// ─── localStorage Keys ───

const STORAGE_KEYS = {
  businesses: "station:holdco-businesses",
  revenue: "station:holdco-revenue",
  community: "station:holdco-community",
} as const;

// ─── Defaults ───

const DEFAULT_BUSINESS_LINES: BusinessLine[] = [
  {
    id: crypto.randomUUID(),
    name: "Newsletter",
    type: "media",
    color: "#6366f1",
    monthlyRevenue: 0,
    monthlyCosts: 0,
    isActive: true,
    launchDate: new Date().toISOString(),
    notes: "",
  },
  {
    id: crypto.randomUUID(),
    name: "Sponsorships",
    type: "media",
    color: "#f59e0b",
    monthlyRevenue: 0,
    monthlyCosts: 0,
    isActive: true,
    launchDate: new Date().toISOString(),
    notes: "",
  },
  {
    id: crypto.randomUUID(),
    name: "Digital Products",
    type: "ecommerce",
    color: "#10b981",
    monthlyRevenue: 0,
    monthlyCosts: 0,
    isActive: true,
    launchDate: new Date().toISOString(),
    notes: "",
  },
  {
    id: crypto.randomUUID(),
    name: "Consulting/Services",
    type: "services",
    color: "#ec4899",
    monthlyRevenue: 0,
    monthlyCosts: 0,
    isActive: true,
    launchDate: new Date().toISOString(),
    notes: "",
  },
];

const DEFAULT_COMMUNITY_HEALTH: CommunityHealth = {
  totalAudience: 0,
  emailSubscribers: 0,
  openRate: 0,
  clickRate: 0,
  socialFollowers: 0,
  engagementRate: 0,
  superfanCount: 0,
  npsScore: 0,
  avgRevenuePerFan: 0,
  communityPlatforms: [],
};

// ─── Persistence Helpers ───

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

// ─── Store ───

interface HoldCoState {
  businessLines: BusinessLine[];
  revenueEntries: RevenueEntry[];
  communityHealth: CommunityHealth;

  // Business line CRUD
  addBusinessLine: (line: Omit<BusinessLine, "id">) => void;
  updateBusinessLine: (id: string, updates: Partial<BusinessLine>) => void;
  removeBusinessLine: (id: string) => void;

  // Revenue entries
  addRevenueEntry: (entry: Omit<RevenueEntry, "id">) => void;
  updateRevenueEntry: (id: string, updates: Partial<RevenueEntry>) => void;

  // Community health
  updateCommunityHealth: (updates: Partial<CommunityHealth>) => void;

  // Computed
  getMetrics: () => HoldCoMetrics;
  getRevenueByMonth: () => { month: string; revenue: number; costs: number; profit: number }[];
  getRevenueByBusinessLine: () => { name: string; revenue: number; percentage: number; color: string }[];
  getValuationEstimate: () => { low: number; mid: number; high: number; method: string };
}

export const useHoldCoStore = create<HoldCoState>((set, get) => ({
  businessLines: loadFromStorage<BusinessLine[]>(STORAGE_KEYS.businesses, DEFAULT_BUSINESS_LINES),
  revenueEntries: loadFromStorage<RevenueEntry[]>(STORAGE_KEYS.revenue, []),
  communityHealth: loadFromStorage<CommunityHealth>(STORAGE_KEYS.community, DEFAULT_COMMUNITY_HEALTH),

  // ─── Business Line CRUD ───

  addBusinessLine: (line) =>
    set((state) => {
      const newLine: BusinessLine = { ...line, id: crypto.randomUUID() };
      const updated = [...state.businessLines, newLine];
      saveToStorage(STORAGE_KEYS.businesses, updated);
      return { businessLines: updated };
    }),

  updateBusinessLine: (id, updates) =>
    set((state) => {
      const updated = state.businessLines.map((bl) =>
        bl.id === id ? { ...bl, ...updates } : bl,
      );
      saveToStorage(STORAGE_KEYS.businesses, updated);
      return { businessLines: updated };
    }),

  removeBusinessLine: (id) =>
    set((state) => {
      const updated = state.businessLines.filter((bl) => bl.id !== id);
      saveToStorage(STORAGE_KEYS.businesses, updated);
      return { businessLines: updated };
    }),

  // ─── Revenue Entries ───

  addRevenueEntry: (entry) =>
    set((state) => {
      const newEntry: RevenueEntry = { ...entry, id: crypto.randomUUID() };
      const updated = [...state.revenueEntries, newEntry];
      saveToStorage(STORAGE_KEYS.revenue, updated);
      return { revenueEntries: updated };
    }),

  updateRevenueEntry: (id, updates) =>
    set((state) => {
      const updated = state.revenueEntries.map((re) =>
        re.id === id ? { ...re, ...updates } : re,
      );
      saveToStorage(STORAGE_KEYS.revenue, updated);
      return { revenueEntries: updated };
    }),

  // ─── Community Health ───

  updateCommunityHealth: (updates) =>
    set((state) => {
      const updated = { ...state.communityHealth, ...updates };
      saveToStorage(STORAGE_KEYS.community, updated);
      return { communityHealth: updated };
    }),

  // ─── Computed: Metrics ───

  getMetrics: () => {
    const { businessLines, revenueEntries, communityHealth } = get();
    const activeLines = businessLines.filter((bl) => bl.isActive);

    const totalMonthlyRevenue = activeLines.reduce((sum, bl) => sum + bl.monthlyRevenue, 0);
    const totalMonthlyCosts = activeLines.reduce((sum, bl) => sum + bl.monthlyCosts, 0);
    const monthlyProfit = totalMonthlyRevenue - totalMonthlyCosts;
    const profitMargin = totalMonthlyRevenue > 0
      ? (monthlyProfit / totalMonthlyRevenue) * 100
      : 0;
    const annualRunRate = totalMonthlyRevenue * 12;

    const totalSubscribers = communityHealth.emailSubscribers + communityHealth.socialFollowers;
    const revenuePerSubscriber = totalSubscribers > 0
      ? totalMonthlyRevenue / totalSubscribers
      : 0;

    const topLine = activeLines.reduce<BusinessLine | null>(
      (best, bl) => (!best || bl.monthlyRevenue > best.monthlyRevenue ? bl : best),
      null,
    );

    // Month-over-month growth from revenue entries
    const monthlyTotals = new Map<string, number>();
    for (const entry of revenueEntries) {
      monthlyTotals.set(entry.month, (monthlyTotals.get(entry.month) || 0) + entry.revenue);
    }
    const sortedMonths = Array.from(monthlyTotals.keys()).sort();
    let momGrowth = 0;
    if (sortedMonths.length >= 2) {
      const current = monthlyTotals.get(sortedMonths[sortedMonths.length - 1]) || 0;
      const previous = monthlyTotals.get(sortedMonths[sortedMonths.length - 2]) || 0;
      momGrowth = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    }

    return {
      totalMonthlyRevenue,
      totalMonthlyCosts,
      monthlyProfit,
      profitMargin,
      annualRunRate,
      totalSubscribers,
      revenuePerSubscriber,
      businessLineCount: activeLines.length,
      topBusinessLine: topLine?.name || "N/A",
      momGrowth,
    };
  },

  // ─── Computed: Revenue by Month ───

  getRevenueByMonth: () => {
    const { revenueEntries } = get();

    const monthMap = new Map<string, { revenue: number; costs: number }>();
    for (const entry of revenueEntries) {
      const existing = monthMap.get(entry.month) || { revenue: 0, costs: 0 };
      existing.revenue += entry.revenue;
      existing.costs += entry.costs;
      monthMap.set(entry.month, existing);
    }

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        costs: data.costs,
        profit: data.revenue - data.costs,
      }));
  },

  // ─── Computed: Revenue by Business Line ───

  getRevenueByBusinessLine: () => {
    const { businessLines } = get();
    const activeLines = businessLines.filter((bl) => bl.isActive);
    const totalRevenue = activeLines.reduce((sum, bl) => sum + bl.monthlyRevenue, 0);

    return activeLines.map((bl) => ({
      name: bl.name,
      revenue: bl.monthlyRevenue,
      percentage: totalRevenue > 0 ? (bl.monthlyRevenue / totalRevenue) * 100 : 0,
      color: bl.color,
    }));
  },

  // ─── Computed: Valuation Estimate ───

  getValuationEstimate: () => {
    const { businessLines } = get();
    const activeLines = businessLines.filter((bl) => bl.isActive);
    const totalMonthlyRevenue = activeLines.reduce((sum, bl) => sum + bl.monthlyRevenue, 0);
    const annualRunRate = totalMonthlyRevenue * 12;

    return {
      low: annualRunRate * 2,
      mid: annualRunRate * 4,
      high: annualRunRate * 8,
      method: "Revenue Multiple (Creator Media)",
    };
  },
}));
