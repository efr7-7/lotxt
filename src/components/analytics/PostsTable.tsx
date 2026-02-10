import { useState, useMemo } from "react";
import type { PostPerformance } from "@/stores/analytics-store";
import { formatNumber, timeAgo } from "@/lib/utils";
import { getPlatform } from "@/lib/platforms";
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  posts: PostPerformance[];
  subscriberCount?: number;
}

type SortKey = "title" | "published_at" | "opens" | "clicks" | "unsubscribes" | "open_rate" | "click_rate";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

export function PostsTable({ posts, subscriberCount }: Props) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("published_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  // Compute derived metrics
  const enrichedPosts = useMemo(() => {
    const avgOpens = posts.length > 0 ? posts.reduce((s, p) => s + p.opens, 0) / posts.length : 0;
    const avgClicks = posts.length > 0 ? posts.reduce((s, p) => s + p.clicks, 0) / posts.length : 0;

    return posts.map((post) => ({
      ...post,
      open_rate: subscriberCount && subscriberCount > 0 ? (post.opens / subscriberCount) * 100 : 0,
      click_rate: post.opens > 0 ? (post.clicks / post.opens) * 100 : 0,
      opensPerformance: avgOpens > 0 ? ((post.opens - avgOpens) / avgOpens) * 100 : 0,
      clicksPerformance: avgClicks > 0 ? ((post.clicks - avgClicks) / avgClicks) * 100 : 0,
    }));
  }, [posts, subscriberCount]);

  // Filter + sort
  const filtered = useMemo(() => {
    let result = enrichedPosts;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(q));
    }

    // Sort
    result.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortKey) {
        case "title": aVal = a.title.toLowerCase(); bVal = b.title.toLowerCase(); break;
        case "published_at": aVal = a.published_at || ""; bVal = b.published_at || ""; break;
        case "opens": aVal = a.opens; bVal = b.opens; break;
        case "clicks": aVal = a.clicks; bVal = b.clicks; break;
        case "unsubscribes": aVal = a.unsubscribes; bVal = b.unsubscribes; break;
        case "open_rate": aVal = a.open_rate; bVal = b.open_rate; break;
        case "click_rate": aVal = a.click_rate; bVal = b.click_rate; break;
        default: aVal = 0; bVal = 0;
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [enrichedPosts, search, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 inline ml-0.5" />
      : <ChevronDown className="w-3 h-3 inline ml-0.5" />;
  };

  const performanceColor = (pct: number) => {
    if (pct > 15) return "text-emerald-400";
    if (pct < -15) return "text-red-400";
    return "text-muted-foreground";
  };

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No post data available yet. Publish a newsletter to see performance metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-3">
        <h3 className="text-sm font-medium text-foreground">Posts</h3>
        <span className="text-[10px] text-muted-foreground/40">
          {filtered.length} {filtered.length === 1 ? "post" : "posts"}
        </span>
        <div className="flex-1" />
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/30" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by title..."
            className="h-7 pl-7 pr-3 rounded-md bg-accent/30 border border-border/30 text-[11px] text-foreground placeholder:text-muted-foreground/25 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors w-48"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th
                onClick={() => handleSort("title")}
                className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                Title <SortIcon col="title" />
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                Platform
              </th>
              <th
                onClick={() => handleSort("published_at")}
                className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                Published <SortIcon col="published_at" />
              </th>
              <th
                onClick={() => handleSort("opens")}
                className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                Opens <SortIcon col="opens" />
              </th>
              <th
                onClick={() => handleSort("open_rate")}
                className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                Open % <SortIcon col="open_rate" />
              </th>
              <th
                onClick={() => handleSort("clicks")}
                className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                Clicks <SortIcon col="clicks" />
              </th>
              <th
                onClick={() => handleSort("click_rate")}
                className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                CTR <SortIcon col="click_rate" />
              </th>
              <th
                onClick={() => handleSort("unsubscribes")}
                className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                Unsubs <SortIcon col="unsubscribes" />
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((post) => {
              const platform = getPlatform(post.platform as any);
              return (
                <tr
                  key={post.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3 max-w-[240px]">
                    <span className="text-foreground font-medium truncate block">
                      {post.title}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: (platform?.color || "#666") + "20",
                        color: platform?.color || "#666",
                      }}
                    >
                      {platform?.name || post.platform}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-[12px]">
                    {post.published_at ? timeAgo(post.published_at) : "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn("font-medium", performanceColor(post.opensPerformance))}>
                      {formatNumber(post.opens)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[12px] text-muted-foreground">
                    {post.open_rate > 0 ? `${post.open_rate.toFixed(1)}%` : "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn("font-medium", performanceColor(post.clicksPerformance))}>
                      {formatNumber(post.clicks)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[12px] text-muted-foreground">
                    {post.click_rate > 0 ? `${post.click_rate.toFixed(1)}%` : "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatNumber(post.unsubscribes)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-2.5 border-t border-border flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground/40">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:bg-accent/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:bg-accent/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
