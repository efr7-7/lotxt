import type { PostPerformance } from "@/stores/analytics-store";
import { formatNumber, timeAgo } from "@/lib/utils";
import { getPlatform } from "@/lib/platforms";

interface Props {
  posts: PostPerformance[];
}

export function PostsTable({ posts }: Props) {
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
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium text-foreground">Recent Posts</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                Title
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                Platform
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                Published
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                Opens
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                Clicks
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                Unsubs
              </th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => {
              const platform = getPlatform(post.platform as any);
              return (
                <tr
                  key={post.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-foreground font-medium">
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
                  <td className="px-4 py-3 text-muted-foreground">
                    {post.published_at ? timeAgo(post.published_at) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">
                    {formatNumber(post.opens)}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">
                    {formatNumber(post.clicks)}
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
    </div>
  );
}
