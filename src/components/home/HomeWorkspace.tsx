import { useMemo, useState, useEffect, useCallback } from "react";
import {
  FileText,
  Paintbrush,
  CalendarDays,
  Sparkles,
  Flame,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  Import,
  Zap,
  Target,
  Trophy,
  BarChart3,
  Pin,
  Search,
  Crown,
  Briefcase,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useEditorStore } from "@/stores/editor-store";
import { useFocusStore } from "@/stores/focus-store";

// ── Streak persistence ──

const STREAK_STORAGE_KEY = "station:streak-data";

interface StreakData {
  dailyLog: Record<string, boolean>; // "YYYY-MM-DD" -> true
  currentStreak: number;
  lastActiveDate: string | null;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { dailyLog: {}, currentStreak: 0, lastActiveDate: null };
}

function saveStreak(data: StreakData) {
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function recordTodayActivity(): StreakData {
  const data = loadStreak();
  const today = todayKey();
  const yesterday = yesterdayKey();

  if (data.dailyLog[today]) return data; // already recorded

  data.dailyLog[today] = true;

  if (data.lastActiveDate === yesterday) {
    data.currentStreak += 1;
  } else if (data.lastActiveDate !== today) {
    data.currentStreak = 1;
  }

  data.lastActiveDate = today;
  saveStreak(data);
  return data;
}

function getWeekDots(): boolean[] {
  const data = loadStreak();
  const dots: boolean[] = [];
  const now = new Date();

  // Start from Monday of current week
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    dots.push(!!data.dailyLog[key]);
  }
  return dots;
}

// ── Motivational quotes ──

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Create something today even if it isn't perfect.", author: "Unknown" },
  { text: "Consistency is the mother of mastery.", author: "Robin Sharma" },
  { text: "Write drunk, edit sober. Ship consistently.", author: "Station Proverb" },
  { text: "Every expert was once a beginner.", author: "Helen Hayes" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Unknown" },
];

// ── Time-aware greeting ──

function getGreeting(): { greeting: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 12) return { greeting: "Good morning", emoji: "sunrise" };
  if (h < 17) return { greeting: "Good afternoon", emoji: "sun" };
  return { greeting: "Good evening", emoji: "moon" };
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ── Relative time for recent documents ──

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Status badge colours ──

function statusStyle(status: string): string {
  switch (status) {
    case "published":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "scheduled":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "review":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

// ────────────────────────────────────────────
// HomeWorkspace
// ────────────────────────────────────────────

export default function HomeWorkspace() {
  const { setActiveWorkspace } = useWorkspaceStore();
  const {
    documents,
    currentDocument,
    createNewDocument,
    loadDocument,
    setShowImportDialog,
  } = useEditorStore();
  const { totalDeepWorkMinutes, completedPomodoros } = useFocusStore();

  // Record activity on mount
  const [streakData, setStreakData] = useState<StreakData>(loadStreak);
  const [weekDots, setWeekDots] = useState<boolean[]>(getWeekDots);

  useEffect(() => {
    const updated = recordTodayActivity();
    setStreakData(updated);
    setWeekDots(getWeekDots());
  }, []);

  // Rotating quote
  const quote = useMemo(
    () => QUOTES[Math.floor(Math.random() * QUOTES.length)],
    [],
  );

  // All documents: stored + current
  const allDocuments = useMemo(() => {
    const stored = documents ?? [];
    // Make sure current doc is included
    const ids = new Set(stored.map((d) => d.id));
    if (currentDocument && !ids.has(currentDocument.id)) {
      return [currentDocument, ...stored];
    }
    return stored;
  }, [documents, currentDocument]);

  // Stats
  const totalDocs = allDocuments.length;
  const totalWords = allDocuments.reduce((sum, d) => sum + (d.wordCount ?? 0), 0);

  const focusHours = Math.floor(totalDeepWorkMinutes / 60);
  const focusMins = Math.round(totalDeepWorkMinutes % 60);
  const focusDisplay =
    focusHours > 0 ? `${focusHours}h ${focusMins}m` : `${focusMins}m`;

  // Recent docs sorted by updatedAt
  const recentDocs = useMemo(() => {
    return [...allDocuments]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [allDocuments]);

  // Greeting
  const { greeting } = getGreeting();
  const dateStr = formatDate();

  // Navigation helpers
  const goToEditor = useCallback(() => setActiveWorkspace("editor"), [setActiveWorkspace]);

  const handleNewDraft = useCallback(() => {
    createNewDocument();
    setActiveWorkspace("editor");
  }, [createNewDocument, setActiveWorkspace]);

  const handleDesign = useCallback(() => {
    setActiveWorkspace("canvas");
  }, [setActiveWorkspace]);

  const handleImport = useCallback(() => {
    setShowImportDialog(true);
    setActiveWorkspace("editor");
  }, [setShowImportDialog, setActiveWorkspace]);

  const handleDistribute = useCallback(() => {
    setActiveWorkspace("distribute");
  }, [setActiveWorkspace]);

  const handleOpenDoc = useCallback(
    (id: string) => {
      loadDocument(id);
      setActiveWorkspace("editor");
    },
    [loadDocument, setActiveWorkspace],
  );

  // ── Day labels for week dots ──
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="h-full w-full overflow-y-auto scroll-fade">
      <div className="max-w-4xl mx-auto px-8 py-8 flex flex-col gap-8">

        {/* ─── 1. Greeting Header ─── */}
        <header className="flex flex-col gap-1.5" style={{ animation: "slide-up 0.3s cubic-bezier(0.16,1,0.3,1) both" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/60 mb-1">
            {dateStr}
          </p>
          <h1 className="text-[28px] font-bold tracking-tight text-foreground">
            {greeting}
          </h1>
          <p className="text-[15px] text-muted-foreground/70">
            Ready to create something great?
          </p>
        </header>

        {/* ─── 2. Write · Grow · Sell Pillars ─── */}
        <section className="flex flex-col gap-3" style={{ animation: "slide-up 0.35s cubic-bezier(0.16,1,0.3,1) 0.05s both" }}>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Write · Grow · Sell
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* WRITE pillar */}
            <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/8 to-purple-500/3 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-violet-500" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-500/80">Write</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Documents</span>
                    <span className="text-[14px] font-bold text-foreground tabular-nums">{totalDocs}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Words Written</span>
                    <span className="text-[14px] font-bold text-foreground tabular-nums">{totalWords.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Focus Time</span>
                    <span className="text-[14px] font-bold text-foreground tabular-nums">{focusDisplay}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Pomodoros</span>
                    <span className="text-[14px] font-bold text-foreground tabular-nums">{completedPomodoros}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* GROW pillar */}
            <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 to-cyan-500/3 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-500/80">Grow</span>
                </div>
                <div className="space-y-2">
                  {(() => {
                    // Try to load growth channel data from localStorage
                    let totalSubs = 0;
                    let totalSpend = 0;
                    let bestChannel = "—";
                    try {
                      const raw = localStorage.getItem("station:growth-channels");
                      if (raw) {
                        const channels = JSON.parse(raw);
                        for (const ch of channels) {
                          totalSubs += ch.subscribersGained || 0;
                          totalSpend += ch.totalSpend || 0;
                        }
                        const sorted = [...channels].sort((a: any, b: any) => (b.subscribersGained || 0) - (a.subscribersGained || 0));
                        if (sorted[0]) bestChannel = sorted[0].name;
                      }
                    } catch {}
                    const avgCpa = totalSubs > 0 ? (totalSpend / totalSubs) : 0;

                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">Subscribers</span>
                          <span className="text-[14px] font-bold text-foreground tabular-nums">{totalSubs > 0 ? totalSubs.toLocaleString() : "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">Total Spend</span>
                          <span className="text-[14px] font-bold text-foreground tabular-nums">{totalSpend > 0 ? `$${totalSpend.toLocaleString()}` : "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">Avg CPA</span>
                          <span className="text-[14px] font-bold text-foreground tabular-nums">{avgCpa > 0 ? `$${avgCpa.toFixed(2)}` : "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">Best Channel</span>
                          <span className="text-[12px] font-semibold text-foreground truncate max-w-[100px]">{bestChannel}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <button
                  onClick={() => setActiveWorkspace("analytics")}
                  className="mt-3 w-full h-7 rounded-lg bg-blue-500/8 text-blue-600 dark:text-blue-400 text-[11px] font-medium hover:bg-blue-500/15 transition-colors flex items-center justify-center gap-1"
                >
                  <TrendingUp className="w-3 h-3" /> Track Growth
                </button>
              </div>
            </div>

            {/* SELL pillar */}
            <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 to-green-500/3 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500/80">Sell</span>
                </div>
                <div className="space-y-2">
                  {(() => {
                    // Try to load sponsor pipeline data from localStorage
                    let pipelineValue = 0;
                    let activeDeals = 0;
                    let paidThisMonth = 0;
                    try {
                      const raw = localStorage.getItem("station:sponsors");
                      if (raw) {
                        const sponsors = JSON.parse(raw);
                        for (const s of sponsors) {
                          if (s.stage !== "paid") {
                            pipelineValue += s.totalValue || 0;
                            activeDeals++;
                          } else {
                            paidThisMonth += s.totalValue || 0;
                          }
                        }
                      }
                    } catch {}

                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">Pipeline Value</span>
                          <span className="text-[14px] font-bold text-foreground tabular-nums">{pipelineValue > 0 ? `$${pipelineValue.toLocaleString()}` : "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">Active Deals</span>
                          <span className="text-[14px] font-bold text-foreground tabular-nums">{activeDeals > 0 ? activeDeals : "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">Revenue (Paid)</span>
                          <span className="text-[14px] font-bold text-foreground tabular-nums">{paidThisMonth > 0 ? `$${paidThisMonth.toLocaleString()}` : "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">Sponsors</span>
                          <span className="text-[14px] font-bold text-foreground tabular-nums">{activeDeals > 0 ? activeDeals : "—"}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <button
                  onClick={() => setActiveWorkspace("analytics")}
                  className="mt-3 w-full h-7 rounded-lg bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/15 transition-colors flex items-center justify-center gap-1"
                >
                  <BarChart3 className="w-3 h-3" /> Manage Sponsors
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 2.5. Creator HQ — Holding Company Snapshot ─── */}
        {(() => {
          // Load holdco business lines for valuation overview
          let totalMRR = 0;
          let totalCosts = 0;
          let businessCount = 0;
          try {
            const raw = localStorage.getItem("station:holdco-businesses");
            if (raw) {
              const lines = JSON.parse(raw);
              for (const l of lines) {
                if (l.isActive) {
                  totalMRR += l.monthlyRevenue || 0;
                  totalCosts += l.monthlyCosts || 0;
                  businessCount++;
                }
              }
            }
          } catch {}
          const annualRR = totalMRR * 12;
          const valLow = annualRR * 2;
          const valMid = annualRR * 4;
          const valHigh = annualRR * 8;

          if (businessCount === 0 && totalMRR === 0) return null;

          const fmt = (n: number) => {
            if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
            if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
            return `$${n.toLocaleString()}`;
          };

          return (
            <section className="flex flex-col gap-3">
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                Creator HQ
              </h2>
              <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-card p-5 shadow-[var(--shadow-sm)]">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/3 pointer-events-none" />
                <div className="relative flex flex-col md:flex-row md:items-center gap-5">
                  {/* Valuation */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium">Est. Valuation</p>
                      <p className="text-[22px] font-bold text-foreground leading-none tabular-nums">
                        {fmt(valMid)}
                      </p>
                      <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                        Range: {fmt(valLow)} – {fmt(valHigh)}
                      </p>
                    </div>
                  </div>
                  <div className="hidden md:block w-px h-12 bg-border" />
                  {/* Key metrics */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-[16px] font-bold text-foreground tabular-nums">{fmt(totalMRR)}</p>
                      <p className="text-[10px] text-muted-foreground/50">Monthly Revenue</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[16px] font-bold text-foreground tabular-nums">{fmt(totalMRR - totalCosts)}</p>
                      <p className="text-[10px] text-muted-foreground/50">Monthly Profit</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[16px] font-bold text-foreground tabular-nums">{businessCount}</p>
                      <p className="text-[10px] text-muted-foreground/50">Business Lines</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[16px] font-bold text-foreground tabular-nums">{fmt(annualRR)}</p>
                      <p className="text-[10px] text-muted-foreground/50">Annual Run Rate</p>
                    </div>
                  </div>
                  <div className="flex-1" />
                  <button
                    onClick={() => setActiveWorkspace("analytics")}
                    className="h-8 px-4 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-semibold hover:bg-amber-500/20 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Crown className="w-3 h-3" /> View HoldCo Dashboard
                  </button>
                </div>
              </div>
            </section>
          );
        })()}

        {/* ─── 3. Quick Actions ─── */}
        <section className="flex flex-col gap-3" style={{ animation: "slide-up 0.35s cubic-bezier(0.16,1,0.3,1) 0.15s both" }}>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Jump In
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ActionCard
              icon={Plus}
              title="New Draft"
              description="Start writing"
              onClick={handleNewDraft}
            />
            <ActionCard
              icon={Paintbrush}
              title="Design"
              description="Open canvas"
              onClick={handleDesign}
            />
            <ActionCard
              icon={Import}
              title="Import"
              description="Bring content in"
              onClick={handleImport}
            />
            <ActionCard
              icon={Zap}
              title="Distribute"
              description="Share everywhere"
              onClick={handleDistribute}
            />
          </div>
        </section>

        {/* ─── 3.5. Pinned Documents ─── */}
        {(() => {
          // Load pinned IDs from localStorage
          let pinnedIds: Set<string>;
          try {
            const raw = localStorage.getItem("station:doc-pins");
            pinnedIds = raw ? new Set(JSON.parse(raw)) : new Set();
          } catch {
            pinnedIds = new Set();
          }
          const pinnedDocs = allDocuments.filter((d) => pinnedIds.has(d.id));

          if (pinnedDocs.length === 0) return null;

          return (
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5" />
                  Pinned
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pinnedDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleOpenDoc(doc.id)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors text-left group"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/12 flex items-center justify-center">
                      <Pin className="w-4 h-4 text-primary/60 fill-primary/20" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {doc.title || "Untitled"}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {doc.wordCount.toLocaleString()} words · {relativeTime(doc.updatedAt)}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            </section>
          );
        })()}

        {/* ─── 4. Recent Documents ─── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Recent Work
            </h2>
            {allDocuments.length > 0 && (
              <button
                onClick={goToEditor}
                className="flex items-center gap-1 text-[12px] font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {recentDocs.length > 0 ? (
            <div className="bg-card border border-border rounded-xl shadow-[var(--shadow-sm)] divide-y divide-border overflow-hidden">
              {recentDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleOpenDoc(doc.id)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {doc.title || "Untitled"}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      {doc.wordCount.toLocaleString()} words
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex-shrink-0 text-[11px] font-medium px-2.5 py-0.5 rounded-full capitalize",
                      statusStyle(doc.status),
                    )}
                  >
                    {doc.status}
                  </span>
                  <span className="flex-shrink-0 text-[12px] text-muted-foreground/60 tabular-nums">
                    {relativeTime(doc.updatedAt)}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl shadow-[var(--shadow-sm)] p-10 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary/50" />
              </div>
              <p className="text-[14px] font-medium text-foreground mb-1">
                No documents yet
              </p>
              <p className="text-[13px] text-muted-foreground mb-5">
                Your recent work will appear here once you start writing.
              </p>
              <button
                onClick={handleNewDraft}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors shadow-[var(--shadow-sm)]"
              >
                <Plus className="w-4 h-4" />
                Create your first draft
              </button>
            </div>
          )}
        </section>

        {/* ─── 5. Creative Streak / Journey ─── */}
        <section className="flex flex-col gap-3 pb-4">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Your Journey
          </h2>
          <div className="bg-card border border-border rounded-xl shadow-[var(--shadow-sm)] p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Streak counter */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/15 to-red-500/10 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-[24px] font-bold text-foreground leading-none tabular-nums">
                    {streakData.currentStreak}
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    day streak
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-12 bg-border" />

              {/* Week dots */}
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                  This Week
                </p>
                <div className="flex items-center gap-2">
                  {weekDots.map((active, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                          active
                            ? "bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.3)]"
                            : "bg-muted/60 border border-border",
                        )}
                      >
                        {active && (
                          <span className="text-[10px] font-bold text-primary-foreground">
                            {dayLabels[i]}
                          </span>
                        )}
                        {!active && (
                          <span className="text-[10px] font-medium text-muted-foreground/40">
                            {dayLabels[i]}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Trophy badge */}
              {streakData.currentStreak >= 7 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    On fire!
                  </span>
                </div>
              )}
            </div>

            {/* Motivational quote */}
            <div className="mt-6 pt-5 border-t border-border">
              <blockquote className="text-[14px] text-muted-foreground italic leading-relaxed">
                &ldquo;{quote.text}&rdquo;
              </blockquote>
              <p className="text-[12px] text-muted-foreground/50 mt-1.5">
                &mdash; {quote.author}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────

function StatCard({
  icon: Icon,
  value,
  label,
  gradient,
  iconColor,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  gradient: string;
  iconColor: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card p-5",
        "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow",
      )}
    >
      {/* Subtle gradient overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-100 pointer-events-none",
          gradient,
        )}
      />
      <div className="relative flex flex-col gap-3">
        <div className={cn("w-9 h-9 rounded-lg bg-background/80 flex items-center justify-center shadow-[var(--shadow-xs)]")}>
          <Icon className={cn("w-[18px] h-[18px]", iconColor)} />
        </div>
        <div>
          <p className="text-[22px] font-bold text-foreground leading-none tabular-nums">
            {value}
          </p>
          <p className="text-[12px] text-muted-foreground mt-1">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-start gap-3 rounded-2xl border border-border/60 bg-card p-5",
        "shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-md)]",
        "hover:border-primary/30 active:scale-[0.97]",
        "transition-all duration-200 text-left overflow-hidden",
      )}
      style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      {/* Subtle hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/3 group-hover:to-primary/8 transition-all duration-300 pointer-events-none" />
      <div className="relative w-10 h-10 rounded-xl bg-primary/8 group-hover:bg-primary/15 flex items-center justify-center transition-all duration-200 group-hover:shadow-[0_0_12px_hsl(var(--primary)/0.15)]">
        <Icon className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors duration-200" />
      </div>
      <div className="relative">
        <p className="text-[14px] font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
          {title}
        </p>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          {description}
        </p>
      </div>
    </button>
  );
}
