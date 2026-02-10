import { create } from "zustand";

// ─── Pipeline Stages ───

export const SPONSOR_STAGES = [
  "prospect",
  "outreach",
  "negotiation",
  "booked",
  "live",
  "invoiced",
  "paid",
] as const;

export type SponsorStage = (typeof SPONSOR_STAGES)[number];

export const PLACEMENT_TYPES = ["primary", "secondary", "classified", "dedicated"] as const;
export type PlacementType = (typeof PLACEMENT_TYPES)[number];

// ─── Interfaces ───

export interface Sponsor {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  website: string;
  stage: SponsorStage;
  cpm: number;
  totalValue: number;
  placementDates: string[];
  placementType: PlacementType;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
}

export interface SponsorPackage {
  id: string;
  name: string;
  placementType: PlacementType;
  numberOfRuns: number;
  pricePerRun: number;
  discountPercent: number;
  totalPrice: number;
  description: string;
}

// ─── Default Packages ───

const DEFAULT_PACKAGES: SponsorPackage[] = [
  {
    id: "pkg-single-primary",
    name: "Single Primary Placement",
    placementType: "primary",
    numberOfRuns: 1,
    pricePerRun: 500,
    discountPercent: 0,
    totalPrice: 500,
    description:
      "One primary ad placement at the top of a single newsletter issue. Ideal for testing performance before committing to a longer run.",
  },
  {
    id: "pkg-3-run-primary",
    name: "3-Run Primary Bundle",
    placementType: "primary",
    numberOfRuns: 3,
    pricePerRun: 500,
    discountPercent: 10,
    totalPrice: 1350,
    description:
      "Three primary ad placements spread across consecutive issues. 10% bundle discount applied. Best for building brand recognition with repeated exposure.",
  },
  {
    id: "pkg-5-run-primary",
    name: "5-Run Primary Bundle",
    placementType: "primary",
    numberOfRuns: 5,
    pricePerRun: 500,
    discountPercent: 20,
    totalPrice: 2000,
    description:
      "Five primary ad placements for maximum reach. 20% bundle discount applied. Our best value option for long-term sponsor partners.",
  },
  {
    id: "pkg-monthly-secondary",
    name: "Monthly Secondary",
    placementType: "secondary",
    numberOfRuns: 4,
    pricePerRun: 300,
    discountPercent: 15,
    totalPrice: 1020,
    description:
      "Four secondary ad placements covering a full month of issues. 15% monthly discount applied. Great mid-funnel placement below the fold.",
  },
];

// ─── LocalStorage Helpers ───

const SPONSORS_STORAGE_KEY = "station:sponsors";
const PACKAGES_STORAGE_KEY = "station:sponsor-packages";

function loadSponsors(): Sponsor[] {
  try {
    const raw = localStorage.getItem(SPONSORS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Corrupted data — start fresh
  }
  return [];
}

function loadPackages(): SponsorPackage[] {
  try {
    const raw = localStorage.getItem(PACKAGES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Corrupted data — start with defaults
  }
  return [...DEFAULT_PACKAGES];
}

function persistSponsors(sponsors: Sponsor[]): void {
  try {
    localStorage.setItem(SPONSORS_STORAGE_KEY, JSON.stringify(sponsors));
  } catch {
    // Storage full or unavailable
  }
}

function persistPackages(packages: SponsorPackage[]): void {
  try {
    localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(packages));
  } catch {
    // Storage full or unavailable
  }
}

// ─── Store ───

interface SponsorsState {
  sponsors: Sponsor[];
  packages: SponsorPackage[];
  pipelineView: "kanban" | "list";

  // Sponsor CRUD
  addSponsor: (sponsor: Omit<Sponsor, "id" | "createdAt" | "updatedAt">) => void;
  updateSponsor: (id: string, updates: Partial<Omit<Sponsor, "id" | "createdAt">>) => void;
  moveSponsor: (id: string, newStage: SponsorStage) => void;
  deleteSponsor: (id: string) => void;

  // Package CRUD
  addPackage: (pkg: Omit<SponsorPackage, "id">) => void;
  updatePackage: (id: string, updates: Partial<Omit<SponsorPackage, "id">>) => void;
  deletePackage: (id: string) => void;

  // View
  setPipelineView: (view: "kanban" | "list") => void;

  // Queries
  getSponsorsByStage: (stage: SponsorStage) => Sponsor[];
  getPipelineValue: () => number;
  getMonthlyRevenue: (month: string) => number;
  getUpcomingPlacements: () => Sponsor[];
  getFollowUps: () => Sponsor[];
}

export const useSponsorsStore = create<SponsorsState>((set, get) => ({
  sponsors: loadSponsors(),
  packages: loadPackages(),
  pipelineView: "kanban",

  // ─── Sponsor CRUD ───

  addSponsor: (sponsor) =>
    set((state) => {
      const now = new Date().toISOString();
      const newSponsor: Sponsor = {
        ...sponsor,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      const sponsors = [...state.sponsors, newSponsor];
      persistSponsors(sponsors);
      return { sponsors };
    }),

  updateSponsor: (id, updates) =>
    set((state) => {
      const sponsors = state.sponsors.map((s) =>
        s.id === id
          ? { ...s, ...updates, updatedAt: new Date().toISOString() }
          : s,
      );
      persistSponsors(sponsors);
      return { sponsors };
    }),

  moveSponsor: (id, newStage) =>
    set((state) => {
      const sponsors = state.sponsors.map((s) =>
        s.id === id
          ? { ...s, stage: newStage, updatedAt: new Date().toISOString() }
          : s,
      );
      persistSponsors(sponsors);
      return { sponsors };
    }),

  deleteSponsor: (id) =>
    set((state) => {
      const sponsors = state.sponsors.filter((s) => s.id !== id);
      persistSponsors(sponsors);
      return { sponsors };
    }),

  // ─── Package CRUD ───

  addPackage: (pkg) =>
    set((state) => {
      const newPackage: SponsorPackage = {
        ...pkg,
        id: crypto.randomUUID(),
      };
      const packages = [...state.packages, newPackage];
      persistPackages(packages);
      return { packages };
    }),

  updatePackage: (id, updates) =>
    set((state) => {
      const packages = state.packages.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      );
      persistPackages(packages);
      return { packages };
    }),

  deletePackage: (id) =>
    set((state) => {
      const packages = state.packages.filter((p) => p.id !== id);
      persistPackages(packages);
      return { packages };
    }),

  // ─── View ───

  setPipelineView: (view) => set({ pipelineView: view }),

  // ─── Queries ───

  getSponsorsByStage: (stage) => {
    return get().sponsors.filter((s) => s.stage === stage);
  },

  getPipelineValue: () => {
    return get().sponsors.reduce((sum, s) => sum + s.totalValue, 0);
  },

  getMonthlyRevenue: (month) => {
    // month expected as "YYYY-MM" (e.g. "2026-02")
    return get()
      .sponsors.filter(
        (s) =>
          s.stage === "paid" &&
          s.updatedAt.startsWith(month),
      )
      .reduce((sum, s) => sum + s.totalValue, 0);
  },

  getUpcomingPlacements: () => {
    const now = new Date();
    const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const nowISO = now.toISOString().slice(0, 10);
    const futureISO = thirtyDaysOut.toISOString().slice(0, 10);

    return get().sponsors.filter((s) =>
      s.placementDates.some((d) => {
        const dateStr = d.slice(0, 10);
        return dateStr >= nowISO && dateStr <= futureISO;
      }),
    );
  },

  getFollowUps: () => {
    const todayISO = new Date().toISOString().slice(0, 10);

    return get().sponsors.filter((s) => {
      if (!s.nextFollowUpAt) return false;
      const followUpDate = s.nextFollowUpAt.slice(0, 10);
      return followUpDate <= todayISO;
    });
  },
}));
