import { useEffect } from "react";
import { useAudienceStore } from "@/stores/audience-store";
import { useAccountsStore } from "@/stores/accounts-store";
import { SubscriberProfile } from "./SubscriberProfile";
import {
  Users, RefreshCw, Search, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NEWSLETTER_PLATFORMS } from "@/lib/platforms";
import { toast } from "@/stores/toast-store";

export function AudienceTab() {
  const {
    subscribers, total, stats, segments, isLoading, isSyncing,
    selectedSubscriber, search, setSearch, setSelectedSubscriber,
    fetchSubscribers, fetchStats, fetchSegments, syncAll,
  } = useAudienceStore();
  const { accounts } = useAccountsStore();

  const newsletterAccounts = accounts.filter(
    (a) => a.isConnected && NEWSLETTER_PLATFORMS.some((p) => p.id === a.platform)
  );

  useEffect(() => {
    fetchSubscribers(1);
    fetchStats();
    fetchSegments();
  }, []);

  const handleSync = async () => {
    toast.info("Syncing subscribers…");
    await syncAll(
      newsletterAccounts.map((a) => ({
        platform: a.platform,
        accountId: a.accountId,
        publicationId: a.publications[0]?.id,
      }))
    );
    toast.success("Sync complete");
  };

  return (
    <div className="flex h-full min-h-0">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Stats bar */}
        {stats && (
          <div className="flex items-center gap-4 px-6 py-3 border-b border-border/30">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-semibold text-foreground">{stats.totalUnique.toLocaleString()}</span>
              <span className="text-[10px] text-muted-foreground">unique subscribers</span>
            </div>
            {stats.platformBreakdown.map((p) => (
              <div key={p.platform} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary/60" />
                <span className="text-[10px] text-muted-foreground capitalize">{p.platform}</span>
                <span className="text-[10px] font-medium text-foreground">{p.count}</span>
              </div>
            ))}
            <div className="flex-1" />
            <span className="text-[10px] text-muted-foreground/50">
              +{stats.newLast30d} new (30d)
            </span>
          </div>
        )}

        {/* Segments */}
        {segments.length > 0 && (
          <div className="flex items-center gap-2 px-6 py-2 border-b border-border/20">
            {segments.map((seg) => (
              <div
                key={seg.name}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 text-[10px]"
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                <span className="font-medium text-foreground">{seg.name}</span>
                <span className="text-muted-foreground">{seg.count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Search & actions */}
        <div className="flex items-center gap-2 px-6 py-2 border-b border-border/20">
          <div className="flex items-center gap-1.5 flex-1 h-7 px-2 rounded-md border border-border bg-background">
            <Search className="w-3 h-3 text-muted-foreground/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email or name…"
              className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground/30"
            />
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing || newsletterAccounts.length === 0}
            className="h-7 px-3 rounded-md text-[10px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <RefreshCw className={cn("w-3 h-3", isSyncing && "animate-spin")} />
            Sync Now
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : subscribers.length === 0 ? (
            <p className="text-xs text-muted-foreground/40 text-center py-16">
              No subscribers yet. Click "Sync Now" to import from connected platforms.
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-wider border-b border-border/20">
                  <th className="text-left px-6 py-2">Email</th>
                  <th className="text-left px-3 py-2">Platforms</th>
                  <th className="text-left px-3 py-2">Engagement</th>
                  <th className="text-left px-3 py-2">First Seen</th>
                  <th className="text-left px-3 py-2">Tags</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub) => (
                  <tr
                    key={sub.id}
                    onClick={() => setSelectedSubscriber(sub)}
                    className="border-b border-border/10 hover:bg-accent/30 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-2">
                      <p className="text-[11px] font-medium text-foreground">{sub.email}</p>
                      {sub.name && <p className="text-[9px] text-muted-foreground/50">{sub.name}</p>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        {sub.platforms.map((p) => (
                          <span key={p.platform + p.accountId} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                            {p.platform}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(sub.engagementScore * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-muted-foreground">{(sub.engagementScore * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[10px] text-muted-foreground/50">
                      {new Date(sub.firstSeenAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-0.5">
                        {sub.tags.slice(0, 3).map((t) => (
                          <span key={t} className="text-[8px] px-1 py-0.5 rounded bg-primary/10 text-primary">{t}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {total > 50 && (
          <div className="flex items-center justify-center gap-2 py-2 border-t border-border/20">
            <span className="text-[10px] text-muted-foreground">
              Showing {subscribers.length} of {total}
            </span>
          </div>
        )}
      </div>

      {/* Subscriber detail panel */}
      {selectedSubscriber && <SubscriberProfile />}
    </div>
  );
}
