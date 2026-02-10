import { useMemo, useState } from "react";
import { useHoldCoStore } from "@/stores/holdco-store";
import { useGrowthStore } from "@/stores/growth-store";
import { useSponsorsStore } from "@/stores/sponsors-store";
import {
  Shield,
  Target,
  TrendingUp,
  Users,
  Heart,
  DollarSign,
  CheckCircle2,
  XCircle,
  Sparkles,
  Crown,
  Lightbulb,
  BarChart3,
  Building2,
  Briefcase,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Formatting Helpers ─── */

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

/* ─── Score Color Helpers ─── */

function getScoreColor(score: number): string {
  if (score >= 81) return "#34d399"; // emerald-400
  if (score >= 61) return "#22c55e"; // green-500
  if (score >= 31) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

function getScoreLabel(score: number): string {
  if (score >= 81) return "Exceptional";
  if (score >= 61) return "Strong";
  if (score >= 31) return "Developing";
  return "Early Stage";
}

function getScoreText(score: number): string {
  if (score >= 81) return "text-emerald-400";
  if (score >= 61) return "text-green-400";
  if (score >= 31) return "text-amber-400";
  return "text-red-400";
}

/* ─── Moat Strength Labels ─── */

type MoatStrength = "Weak" | "Growing" | "Strong" | "Exceptional";

function getMoatStrength(score: number): MoatStrength {
  if (score >= 80) return "Exceptional";
  if (score >= 55) return "Strong";
  if (score >= 30) return "Growing";
  return "Weak";
}

function getMoatColor(strength: MoatStrength): { bg: string; text: string; border: string } {
  switch (strength) {
    case "Exceptional":
      return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" };
    case "Strong":
      return { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" };
    case "Growing":
      return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" };
    case "Weak":
      return { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" };
  }
}

/* ─── Score Computation ─── */

interface ScoreFactor {
  label: string;
  weight: number;
  score: number; // 0-100
  icon: React.ElementType;
  detail: string;
}

interface ChecklistItem {
  label: string;
  met: boolean;
  currentValue: string;
  threshold: string;
}

interface MoatCard {
  label: string;
  icon: React.ElementType;
  strength: MoatStrength;
  score: number;
  metrics: { label: string; value: string }[];
}

interface EquityTip {
  text: string;
  icon: React.ElementType;
  priority: number;
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/* ─── Component ─── */

export function CreatorEquityTab() {
  const { businessLines, communityHealth, getMetrics } = useHoldCoStore();
  const { channels, getTotalSubscribers: getGrowthSubs } = useGrowthStore();
  const { sponsors, getPipelineValue } = useSponsorsStore();

  const [nicheAuthority, setNicheAuthority] = useState(false);

  const metrics = useMemo(() => getMetrics(), [businessLines, communityHealth]);
  const pipelineValue = useMemo(() => getPipelineValue(), [sponsors]);
  const growthSubs = useMemo(() => getGrowthSubs(), [channels]);
  const activeChannels = useMemo(() => channels.filter((ch) => ch.isActive), [channels]);
  const activeSponsors = useMemo(
    () => sponsors.filter((s) => s.stage === "booked" || s.stage === "live" || s.stage === "invoiced" || s.stage === "paid"),
    [sponsors],
  );
  const activeRevLines = useMemo(
    () => businessLines.filter((bl) => bl.isActive && bl.monthlyRevenue > 0),
    [businessLines],
  );

  // ─── Factor: Community Depth (25%) ───
  const communityDepthScore = useMemo(() => {
    let score = 0;
    // Engagement rate: 0-3% => 0-33, 3-6% => 33-66, 6%+ => 66-100
    const engRate = communityHealth.engagementRate;
    if (engRate >= 6) score += 35;
    else if (engRate >= 3) score += 20 + ((engRate - 3) / 3) * 15;
    else score += (engRate / 3) * 20;

    // NPS: 0-30 => 0-33, 30-60 => 33-66, 60-100 => 66-100
    const nps = communityHealth.npsScore;
    if (nps >= 60) score += 35;
    else if (nps >= 30) score += 20 + ((nps - 30) / 30) * 15;
    else score += (nps / 30) * 20;

    // Superfan ratio: superfans / totalAudience
    const totalAudience = communityHealth.totalAudience;
    const superfanRatio = totalAudience > 0
      ? (communityHealth.superfanCount / totalAudience) * 100
      : 0;
    if (superfanRatio >= 5) score += 30;
    else if (superfanRatio >= 2) score += 15 + ((superfanRatio - 2) / 3) * 15;
    else score += (superfanRatio / 2) * 15;

    return clampScore(score);
  }, [communityHealth]);

  // ─── Factor: Revenue Diversification (25%) ───
  const revDiversificationScore = useMemo(() => {
    const lineCount = activeRevLines.length;

    let score = 0;

    // Number of active revenue lines (max 50 pts)
    if (lineCount >= 4) score += 50;
    else if (lineCount >= 3) score += 40;
    else if (lineCount >= 2) score += 28;
    else if (lineCount >= 1) score += 15;

    // Revenue spread (Herfindahl-Hirschman style) — lower concentration = higher score (max 50 pts)
    const totalRev = activeRevLines.reduce((s, bl) => s + bl.monthlyRevenue, 0);
    if (totalRev > 0 && lineCount > 1) {
      const shares = activeRevLines.map((bl) => bl.monthlyRevenue / totalRev);
      const hhi = shares.reduce((s, sh) => s + sh * sh, 0);
      // HHI: 1/lineCount (perfectly even) to 1 (monopoly)
      // Normalize: score = (1 - hhi) / (1 - 1/lineCount) * 50
      const minHHI = 1 / lineCount;
      const diversificationRatio = (1 - hhi) / (1 - minHHI);
      score += diversificationRatio * 50;
    } else if (lineCount === 1) {
      score += 5; // Some credit for having revenue at all
    }

    return clampScore(score);
  }, [activeRevLines]);

  // ─── Factor: Growth Trajectory (20%) ───
  const growthTrajectoryScore = useMemo(() => {
    let score = 0;

    // MoM growth (max 50 pts)
    const mom = metrics.momGrowth;
    if (mom >= 20) score += 50;
    else if (mom >= 10) score += 35 + ((mom - 10) / 10) * 15;
    else if (mom >= 5) score += 20 + ((mom - 5) / 5) * 15;
    else if (mom > 0) score += (mom / 5) * 20;

    // Subscriber growth from growth channels (max 50 pts)
    if (growthSubs >= 10000) score += 50;
    else if (growthSubs >= 5000) score += 35 + ((growthSubs - 5000) / 5000) * 15;
    else if (growthSubs >= 1000) score += 18 + ((growthSubs - 1000) / 4000) * 17;
    else if (growthSubs > 0) score += (growthSubs / 1000) * 18;

    return clampScore(score);
  }, [metrics, growthSubs]);

  // ─── Factor: Monetization Efficiency (15%) ───
  const monetizationScore = useMemo(() => {
    let score = 0;

    // Revenue per subscriber (max 50 pts)
    const rps = metrics.revenuePerSubscriber;
    if (rps >= 5) score += 50;
    else if (rps >= 2) score += 25 + ((rps - 2) / 3) * 25;
    else if (rps >= 0.5) score += 10 + ((rps - 0.5) / 1.5) * 15;
    else if (rps > 0) score += (rps / 0.5) * 10;

    // Profit margin (max 50 pts)
    const margin = metrics.profitMargin;
    if (margin >= 70) score += 50;
    else if (margin >= 50) score += 35 + ((margin - 50) / 20) * 15;
    else if (margin >= 20) score += 15 + ((margin - 20) / 30) * 20;
    else if (margin > 0) score += (margin / 20) * 15;

    return clampScore(score);
  }, [metrics]);

  // ─── Factor: Business Operations (15%) ───
  const operationsScore = useMemo(() => {
    let score = 0;

    // Has sponsor pipeline (33 pts)
    if (sponsors.length > 0) score += 33;

    // Tracks growth channels with data (33 pts)
    const hasGrowthData = activeChannels.some(
      (ch) => ch.subscribersGained > 0 || ch.totalSpend > 0,
    );
    if (hasGrowthData) score += 33;

    // Uses analytics — has community health data (34 pts)
    const hasAnalytics =
      communityHealth.totalAudience > 0 ||
      communityHealth.emailSubscribers > 0 ||
      communityHealth.engagementRate > 0;
    if (hasAnalytics) score += 34;

    return clampScore(score);
  }, [sponsors, activeChannels, communityHealth]);

  // ─── Composite Score ───
  const factors: ScoreFactor[] = useMemo(
    () => [
      {
        label: "Community Depth",
        weight: 25,
        score: communityDepthScore,
        icon: Heart,
        detail: `${fmtPct(communityHealth.engagementRate)} engagement, ${communityHealth.npsScore} NPS`,
      },
      {
        label: "Revenue Diversification",
        weight: 25,
        score: revDiversificationScore,
        icon: BarChart3,
        detail: `${metrics.businessLineCount} active lines, ${fmtCurrency(metrics.annualRunRate)} ARR`,
      },
      {
        label: "Growth Trajectory",
        weight: 20,
        score: growthTrajectoryScore,
        icon: TrendingUp,
        detail: `${fmtPct(metrics.momGrowth)} MoM, ${fmtNumber(growthSubs)} subs from channels`,
      },
      {
        label: "Monetization Efficiency",
        weight: 15,
        score: monetizationScore,
        icon: DollarSign,
        detail: `$${metrics.revenuePerSubscriber.toFixed(2)}/sub, ${fmtPct(metrics.profitMargin)} margin`,
      },
      {
        label: "Business Operations",
        weight: 15,
        score: operationsScore,
        icon: Briefcase,
        detail: `${sponsors.length} sponsors, ${activeChannels.length} channels tracked`,
      },
    ],
    [
      communityDepthScore,
      revDiversificationScore,
      growthTrajectoryScore,
      monetizationScore,
      operationsScore,
      communityHealth,
      metrics,
      growthSubs,
      sponsors,
      activeChannels,
    ],
  );

  const compositeScore = useMemo(
    () =>
      clampScore(
        factors.reduce((sum, f) => sum + (f.score * f.weight) / 100, 0),
      ),
    [factors],
  );

  // ─── Investor Readiness Checklist ───
  const checklist: ChecklistItem[] = useMemo(
    () => [
      {
        label: "200K+ total audience",
        met: communityHealth.totalAudience >= 200_000,
        currentValue: fmtNumber(communityHealth.totalAudience),
        threshold: "200K",
      },
      {
        label: "$500K+ annual revenue",
        met: metrics.annualRunRate >= 500_000,
        currentValue: fmtCurrency(metrics.annualRunRate),
        threshold: "$500K",
      },
      {
        label: "2+ active business lines",
        met: activeRevLines.length >= 2,
        currentValue: `${activeRevLines.length}`,
        threshold: "2",
      },
      {
        label: "Niche authority",
        met: nicheAuthority,
        currentValue: nicheAuthority ? "Yes" : "No",
        threshold: "Self-reported",
      },
      {
        label: "Community engagement > 3%",
        met: communityHealth.engagementRate > 3,
        currentValue: fmtPct(communityHealth.engagementRate),
        threshold: "3%",
      },
      {
        label: "Revenue growing MoM",
        met: metrics.momGrowth > 0,
        currentValue: fmtPct(metrics.momGrowth),
        threshold: "> 0%",
      },
      {
        label: "Sponsor/brand partnerships active",
        met: activeSponsors.length > 0,
        currentValue: `${activeSponsors.length} active`,
        threshold: "1+",
      },
      {
        label: "Email list > 10K",
        met: communityHealth.emailSubscribers > 10_000,
        currentValue: fmtNumber(communityHealth.emailSubscribers),
        threshold: "10K",
      },
    ],
    [communityHealth, metrics, activeRevLines, nicheAuthority, activeSponsors],
  );

  const criteriaMet = checklist.filter((c) => c.met).length;

  // ─── Moat Analysis ───
  const moats: MoatCard[] = useMemo(() => {
    // Audience moat
    const audienceScore = (() => {
      let s = 0;
      if (communityHealth.totalAudience >= 500_000) s += 50;
      else if (communityHealth.totalAudience >= 100_000) s += 30;
      else if (communityHealth.totalAudience >= 10_000) s += 15;
      else if (communityHealth.totalAudience > 0) s += 5;

      if (communityHealth.engagementRate >= 5) s += 50;
      else if (communityHealth.engagementRate >= 3) s += 30;
      else if (communityHealth.engagementRate >= 1) s += 15;
      return clampScore(s);
    })();

    // Revenue moat
    const revenueScore = (() => {
      let s = 0;
      const activeCount = activeRevLines.length;
      if (activeCount >= 4) s += 50;
      else if (activeCount >= 3) s += 35;
      else if (activeCount >= 2) s += 20;
      else if (activeCount >= 1) s += 8;

      if (metrics.profitMargin >= 60) s += 50;
      else if (metrics.profitMargin >= 40) s += 35;
      else if (metrics.profitMargin >= 20) s += 18;
      else if (metrics.profitMargin > 0) s += 5;
      return clampScore(s);
    })();

    // Community moat
    const communityScore = (() => {
      let s = 0;
      if (communityHealth.superfanCount >= 1000) s += 35;
      else if (communityHealth.superfanCount >= 100) s += 20;
      else if (communityHealth.superfanCount > 0) s += 8;

      if (communityHealth.npsScore >= 70) s += 35;
      else if (communityHealth.npsScore >= 40) s += 20;
      else if (communityHealth.npsScore > 0) s += 8;

      if (communityHealth.communityPlatforms.length >= 3) s += 30;
      else if (communityHealth.communityPlatforms.length >= 2) s += 18;
      else if (communityHealth.communityPlatforms.length >= 1) s += 8;
      return clampScore(s);
    })();

    // Brand moat
    const brandScore = (() => {
      let s = 0;
      if (activeSponsors.length >= 5) s += 50;
      else if (activeSponsors.length >= 3) s += 35;
      else if (activeSponsors.length >= 1) s += 18;

      if (pipelineValue >= 50_000) s += 50;
      else if (pipelineValue >= 20_000) s += 35;
      else if (pipelineValue >= 5_000) s += 18;
      else if (pipelineValue > 0) s += 5;
      return clampScore(s);
    })();

    return [
      {
        label: "Audience Moat",
        icon: Users,
        strength: getMoatStrength(audienceScore),
        score: audienceScore,
        metrics: [
          { label: "Total Audience", value: fmtNumber(communityHealth.totalAudience) },
          { label: "Engagement", value: fmtPct(communityHealth.engagementRate) },
          { label: "Email Subs", value: fmtNumber(communityHealth.emailSubscribers) },
        ],
      },
      {
        label: "Revenue Moat",
        icon: DollarSign,
        strength: getMoatStrength(revenueScore),
        score: revenueScore,
        metrics: [
          { label: "Business Lines", value: `${activeRevLines.length}` },
          { label: "Profit Margin", value: fmtPct(metrics.profitMargin) },
          { label: "Annual Run Rate", value: fmtCurrency(metrics.annualRunRate) },
        ],
      },
      {
        label: "Community Moat",
        icon: Heart,
        strength: getMoatStrength(communityScore),
        score: communityScore,
        metrics: [
          { label: "Superfans", value: fmtNumber(communityHealth.superfanCount) },
          { label: "NPS Score", value: `${communityHealth.npsScore}` },
          { label: "Platforms", value: `${communityHealth.communityPlatforms.length}` },
        ],
      },
      {
        label: "Brand Moat",
        icon: Crown,
        strength: getMoatStrength(brandScore),
        score: brandScore,
        metrics: [
          { label: "Active Sponsors", value: `${activeSponsors.length}` },
          { label: "Pipeline Value", value: fmtCurrency(pipelineValue) },
          { label: "Total Sponsors", value: `${sponsors.length}` },
        ],
      },
    ];
  }, [communityHealth, activeRevLines, metrics, activeSponsors, pipelineValue, sponsors]);

  // ─── Equity Growth Tips ───
  const tips: EquityTip[] = useMemo(() => {
    const all: EquityTip[] = [];

    if (communityHealth.emailSubscribers < 10_000) {
      all.push({
        text: "Grow your email list to unlock newsletter monetization. Email subscribers are your most valuable asset.",
        icon: Target,
        priority: 10,
      });
    }

    if (activeRevLines.length < 2) {
      all.push({
        text: "Add a second revenue stream to diversify income. Investors value creators who aren't dependent on a single source.",
        icon: BarChart3,
        priority: 9,
      });
    }

    if (communityHealth.engagementRate > 5) {
      all.push({
        text: "Your engagement rate is exceptional \u2014 consider launching a paid community or membership product.",
        icon: Sparkles,
        priority: 7,
      });
    } else if (communityHealth.engagementRate < 3 && communityHealth.totalAudience > 0) {
      all.push({
        text: "Focus on engagement before growth. Reply to comments, run polls, and create interactive content.",
        icon: Heart,
        priority: 8,
      });
    }

    if (metrics.annualRunRate < 500_000 && metrics.annualRunRate > 0) {
      all.push({
        text: `You're at ${fmtCurrency(metrics.annualRunRate)} ARR \u2014 reaching $500K unlocks serious investor interest.`,
        icon: DollarSign,
        priority: 9,
      });
    }

    if (sponsors.length === 0) {
      all.push({
        text: "Start building a sponsor pipeline. Even a few brand partnerships signal market validation to investors.",
        icon: Building2,
        priority: 6,
      });
    }

    if (communityHealth.totalAudience < 200_000 && communityHealth.totalAudience > 0) {
      all.push({
        text: "Scale your audience across platforms. Cross-promote content and leverage collaborations to reach 200K+.",
        icon: Users,
        priority: 7,
      });
    }

    if (metrics.momGrowth <= 0 && metrics.totalMonthlyRevenue > 0) {
      all.push({
        text: "Revenue is flat or declining \u2014 investigate churn, experiment with pricing, or invest in acquisition.",
        icon: TrendingUp,
        priority: 10,
      });
    }

    if (metrics.profitMargin < 30 && metrics.totalMonthlyRevenue > 0) {
      all.push({
        text: "Improve profit margins by reducing costs or raising prices. Healthy margins signal a sustainable business.",
        icon: ArrowUpRight,
        priority: 5,
      });
    }

    // Sort by priority descending, return top 3
    return all.sort((a, b) => b.priority - a.priority).slice(0, 3);
  }, [communityHealth, activeRevLines, metrics, sponsors]);

  // ─── Render ───
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-8 py-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-primary" />
            <h1 className="text-lg font-semibold text-foreground/90">
              Creator Equity
            </h1>
          </div>
          <p className="text-[12px] text-muted-foreground/50 leading-relaxed max-w-[520px]">
            Understand and grow your enterprise value. How would an investor
            evaluate your creator business right now?
          </p>
        </div>

        {/* ────────────────────────────────────────── */}
        {/* 1. Creator Score Card (Hero)               */}
        {/* ────────────────────────────────────────── */}
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="flex items-start gap-8">
            {/* Circular score */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className="relative w-28 h-28 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(${getScoreColor(compositeScore)} ${compositeScore * 3.6}deg, hsl(var(--muted) / 0.2) 0deg)`,
                }}
              >
                <div className="w-[92px] h-[92px] rounded-full bg-card flex flex-col items-center justify-center">
                  <div className="flex items-center gap-0.5">
                    <span
                      className="text-[28px] font-bold leading-none tracking-tight"
                      style={{ color: getScoreColor(compositeScore) }}
                    >
                      {compositeScore}
                    </span>
                    {compositeScore >= 81 && (
                      <Sparkles
                        className="w-4 h-4 text-emerald-400"
                        strokeWidth={2.5}
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 mt-0.5">
                    / 100
                  </span>
                </div>
              </div>
              <span
                className={cn(
                  "text-[11px] font-semibold mt-2",
                  getScoreText(compositeScore),
                )}
              >
                {getScoreLabel(compositeScore)}
              </span>
            </div>

            {/* Factor bars */}
            <div className="flex-1 space-y-3 pt-1">
              <h3 className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-3">
                Score Breakdown
              </h3>
              {factors.map((factor) => {
                const Icon = factor.icon;
                return (
                  <div key={factor.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3 h-3 text-muted-foreground/50" />
                        <span className="text-[11px] font-medium text-foreground/80">
                          {factor.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground/30">
                          ({factor.weight}%)
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-[11px] font-bold",
                          getScoreText(factor.score),
                        )}
                      >
                        {factor.score}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${factor.score}%`,
                          backgroundColor: getScoreColor(factor.score),
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground/40">
                      {factor.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ────────────────────────────────────────── */}
        {/* 2. Investor Readiness Checklist             */}
        {/* ────────────────────────────────────────── */}
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-primary" />
              <h3 className="text-[13px] font-semibold text-foreground/90">
                Investor Readiness
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground/50">
              Based on creator venture criteria
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-foreground/80">
                {criteriaMet}/8 criteria met
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-full",
                  criteriaMet >= 7
                    ? "bg-emerald-500/10 text-emerald-400"
                    : criteriaMet >= 5
                      ? "bg-green-500/10 text-green-400"
                      : criteriaMet >= 3
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-red-500/10 text-red-400",
                )}
              >
                {criteriaMet >= 7
                  ? "Investor Ready"
                  : criteriaMet >= 5
                    ? "Getting Close"
                    : criteriaMet >= 3
                      ? "In Progress"
                      : "Early Stage"}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(criteriaMet / 8) * 100}%`,
                  backgroundColor:
                    criteriaMet >= 7
                      ? "#34d399"
                      : criteriaMet >= 5
                        ? "#22c55e"
                        : criteriaMet >= 3
                          ? "#f59e0b"
                          : "#ef4444",
                }}
              />
            </div>
          </div>

          {/* Checklist items */}
          <div className="space-y-1">
            {checklist.map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  item.met
                    ? "bg-emerald-500/[0.04]"
                    : "bg-transparent hover:bg-muted/20",
                )}
              >
                {/* Special case: niche authority toggle */}
                {item.label === "Niche authority" ? (
                  <button
                    onClick={() => setNicheAuthority(!nicheAuthority)}
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors",
                      nicheAuthority
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-muted/50 text-muted-foreground/30",
                    )}
                  >
                    {nicheAuthority ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                  </button>
                ) : item.met ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400/60 shrink-0" />
                )}

                <span
                  className={cn(
                    "text-[12px] flex-1",
                    item.met
                      ? "text-foreground/80"
                      : "text-muted-foreground/60",
                  )}
                >
                  {item.label}
                  {item.label === "Niche authority" && (
                    <span className="text-[10px] text-muted-foreground/30 ml-1">
                      (click to toggle)
                    </span>
                  )}
                </span>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      item.met ? "text-emerald-400" : "text-muted-foreground/50",
                    )}
                  >
                    {item.currentValue}
                  </span>
                  <span className="text-[10px] text-muted-foreground/25">
                    / {item.threshold}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ────────────────────────────────────────── */}
        {/* 3. "Your Moat" Analysis                    */}
        {/* ────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-3.5 h-3.5 text-primary" />
            <h3 className="text-[13px] font-semibold text-foreground/90">
              Your Moat
            </h3>
            <span className="text-[11px] text-muted-foreground/40 ml-1">
              Competitive advantages that protect your business
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {moats.map((moat) => {
              const Icon = moat.icon;
              const colors = getMoatColor(moat.strength);
              return (
                <div
                  key={moat.label}
                  className={cn(
                    "rounded-xl border bg-card p-4 space-y-3 transition-colors",
                    colors.border,
                  )}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center",
                          colors.bg,
                        )}
                      >
                        <Icon className={cn("w-3.5 h-3.5", colors.text)} />
                      </div>
                      <span className="text-[12px] font-semibold text-foreground/80">
                        {moat.label}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        colors.bg,
                        colors.text,
                      )}
                    >
                      {moat.strength}
                    </span>
                  </div>

                  {/* Strength bar */}
                  <div className="h-1 rounded-full bg-muted/30 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${moat.score}%`,
                        backgroundColor: getScoreColor(moat.score),
                      }}
                    />
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2">
                    {moat.metrics.map((m) => (
                      <div key={m.label}>
                        <p className="text-[10px] text-muted-foreground/40">
                          {m.label}
                        </p>
                        <p className="text-[12px] font-semibold text-foreground/80">
                          {m.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ────────────────────────────────────────── */}
        {/* 4. Equity Growth Tips                      */}
        {/* ────────────────────────────────────────── */}
        {tips.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <h3 className="text-[13px] font-semibold text-foreground/90">
                Growth Tips
              </h3>
              <span className="text-[11px] text-muted-foreground/40 ml-1">
                Highest-impact actions to increase your equity score
              </span>
            </div>

            <div className="space-y-2">
              {tips.map((tip, idx) => {
                const Icon = tip.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-border/40 bg-card/60 px-4 py-3"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-foreground/80 leading-relaxed">
                        {tip.text}
                      </p>
                    </div>
                    <ArrowUpRight className="w-3 h-3 text-muted-foreground/25 shrink-0 mt-1" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state for tips */}
        {tips.length === 0 && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5 text-center">
            <Sparkles className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <p className="text-[12px] text-emerald-400/80 font-medium">
              Outstanding! You're hitting all the key benchmarks.
            </p>
            <p className="text-[11px] text-muted-foreground/40 mt-1">
              Keep executing and your creator equity will continue to compound.
            </p>
          </div>
        )}

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>
    </div>
  );
}
