import { useEffect } from "react";
import { useAnalyticsStore } from "@/stores/analytics-store";
import { useAccountsStore } from "@/stores/accounts-store";
import { MetricCard } from "./MetricCard";
import { SubscriberChart } from "./SubscriberChart";
import { EngagementChart } from "./EngagementChart";
import { PostsTable } from "./PostsTable";
import { DateRangePicker } from "./DateRangePicker";
import { PlatformFilter } from "./PlatformFilter";
import { Users, MailOpen, MousePointerClick, TrendingUp, Loader2, AlertCircle } from "lucide-react";

export default function AnalyticsWorkspace() {
  const { data, isLoading, error, fetchAllAnalytics } = useAnalyticsStore();
  const { accounts, loadAccounts } = useAccountsStore();

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

  // No accounts connected — show empty state
  if (connectedAccounts.length === 0 && !isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            No Accounts Connected
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Connect a Beehiiv, Substack, or Kit account to see your real analytics data here.
          </p>
          <p className="text-xs text-muted-foreground">
            Go to <strong>Accounts</strong> (Ctrl+4) to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">
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
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">
              Fetching data from your platforms...
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Metric cards */}
        {data && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-6">
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
            <div className="grid grid-cols-2 gap-4 mb-6">
              <SubscriberChart data={data.subscriber_growth} />
              <EngagementChart posts={data.recent_posts} />
            </div>

            {/* Posts table */}
            <PostsTable posts={data.recent_posts} />
          </>
        )}
      </div>
    </div>
  );
}
