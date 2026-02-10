import { useEffect, useState } from "react";
import { useAnalyticsStore } from "@/stores/analytics-store";
import { useAccountsStore } from "@/stores/accounts-store";
import { LocalStatsOverview } from "./LocalStatsOverview";
import { MetricCard } from "./MetricCard";
import { SubscriberChart } from "./SubscriberChart";
import { EngagementChart } from "./EngagementChart";
import { PostsTable } from "./PostsTable";
import { InsightCards } from "./InsightCards";
import { DateRangePicker } from "./DateRangePicker";
import { PlatformFilter } from "./PlatformFilter";
import { AudienceTab } from "./AudienceTab";
import { RevenueTab } from "./RevenueTab";
import { GrowthTab } from "./GrowthTab";
import { SponsorsTab } from "./SponsorsTab";
import { HoldCoTab } from "./HoldCoTab";
import { CreatorEquityTab } from "./CreatorEquityTab";
import {
  Users, MailOpen, MousePointerClick, TrendingUp, Loader2, BarChart3, ArrowRight,
  UserCheck, DollarSign, Rocket, Building2, Crown, Briefcase,
} from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { cn } from "@/lib/utils";

type AnalyticsTabId = "overview" | "audience" | "revenue" | "growth" | "sponsors" | "holdco" | "equity";

const TABS: { id: AnalyticsTabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "holdco", label: "HoldCo", icon: Briefcase },
  { id: "equity", label: "Creator Equity", icon: Crown },
  { id: "growth", label: "Growth", icon: Rocket },
  { id: "sponsors", label: "Sponsors", icon: Building2 },
  { id: "audience", label: "Audience", icon: UserCheck },
  { id: "revenue", label: "Revenue", icon: DollarSign },
];

export default function AnalyticsWorkspace() {
  const { data, isLoading, error, fetchAllAnalytics } = useAnalyticsStore();
  const { accounts, loadAccounts } = useAccountsStore();
  const { setActiveWorkspace } = useWorkspaceStore();
  const [activeTab, setActiveTab] = useState<AnalyticsTabId>("overview");

  const connectedAccounts = accounts.filter((a) => a.isConnected);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (connectedAccounts.length > 0) {
      fetchAllAnalytics(
        connectedAccounts.map((a) => ({
          platform: a.platform,
          accountId: a.accountId,
          publicationId: a.publications[0]?.id,
        })),
      );
    }
  }, [connectedAccounts.length]);

  // No accounts connected — show local stats + connect CTA (overview tab)
  if (connectedAccounts.length === 0 && !isLoading && activeTab === "overview") {
    return (
      <div className="h-full flex flex-col">
        {/* Tab bar */}
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 overflow-y-auto">
          <LocalStatsOverview />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-8 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-lg font-semibold text-foreground/90">Analytics</h1>
                <p className="text-[13px] text-muted-foreground/50 mt-0.5">
                  Real-time data from your connected platforms
                </p>
              </div>
              <div className="flex items-center gap-2">
                <PlatformFilter />
                <DateRangePicker />
              </div>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary/50" />
                  <span className="text-[13px] text-muted-foreground/40">
                    Fetching data from your platforms...
                  </span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/5 border border-destructive/15 text-[13px] text-destructive/80">
                {error}
              </div>
            )}

            {/* Metric cards */}
            {data && (
              <>
                <div className="grid grid-cols-4 gap-3 mb-6">
                  <MetricCard
                    label="Total Subscribers"
                    value={data.total_subscribers}
                    icon={Users}
                    format="number"
                    accentColor="hsl(var(--primary))"
                  />
                  <MetricCard
                    label="Open Rate"
                    value={data.open_rate}
                    icon={MailOpen}
                    format="percentage"
                    accentColor="hsl(var(--success))"
                  />
                  <MetricCard
                    label="Click Rate"
                    value={data.click_rate}
                    icon={MousePointerClick}
                    format="percentage"
                    accentColor="hsl(var(--info))"
                  />
                  <MetricCard
                    label="Posts Published"
                    value={data.recent_posts.length}
                    icon={TrendingUp}
                    format="number"
                    accentColor="hsl(var(--warning))"
                  />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <SubscriberChart data={data.subscriber_growth} />
                  <EngagementChart posts={data.recent_posts} />
                </div>

                {/* Insight cards */}
                <InsightCards posts={data.recent_posts} />

                {/* Posts table */}
                <div className="mt-6">
                  <PostsTable
                    posts={data.recent_posts}
                    subscriberCount={data.total_subscribers}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === "holdco" && <HoldCoTab />}
      {activeTab === "equity" && <CreatorEquityTab />}
      {activeTab === "audience" && <AudienceTab />}
      {activeTab === "revenue" && <RevenueTab />}
      {activeTab === "growth" && <GrowthTab />}
      {activeTab === "sponsors" && <SponsorsTab />}
    </div>
  );
}

/* ─── Tab Bar ─── */
function TabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: AnalyticsTabId;
  onTabChange: (tab: AnalyticsTabId) => void;
}) {
  return (
    <div className="shrink-0 border-b border-border/40 px-6 flex items-center gap-0">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 h-10 text-[12px] font-medium transition-colors",
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground/45 hover:text-foreground/70"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[2px] bg-primary rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
