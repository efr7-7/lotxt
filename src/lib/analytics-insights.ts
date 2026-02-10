/**
 * Auto-generated analytics insights from post performance data.
 * No AI calls needed — simple statistical analysis on the data.
 */

import type { PostPerformance } from "@/stores/analytics-store";

export interface Insight {
  type: "positive" | "negative" | "neutral";
  message: string;
  metric: string;
  delta: number;
}

interface AnalyticsData {
  total_subscribers: number;
  open_rate: number;
  click_rate: number;
}

/**
 * Generate actionable insights from analytics data.
 */
export function generateInsights(
  posts: PostPerformance[],
  stats?: AnalyticsData | null,
): Insight[] {
  const insights: Insight[] = [];

  if (posts.length < 2) return insights;

  // ─── Day-of-week analysis ───
  const dayPerformance = new Map<string, { opens: number; count: number }>();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  for (const post of posts) {
    if (!post.published_at) continue;
    const day = days[new Date(post.published_at).getDay()];
    const existing = dayPerformance.get(day) || { opens: 0, count: 0 };
    existing.opens += post.opens;
    existing.count += 1;
    dayPerformance.set(day, existing);
  }

  if (dayPerformance.size >= 2) {
    let bestDay = "";
    let bestAvg = 0;
    for (const [day, data] of dayPerformance) {
      const avg = data.count > 0 ? data.opens / data.count : 0;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestDay = day;
      }
    }

    const overallAvg = posts.reduce((s, p) => s + p.opens, 0) / posts.length;
    const delta = overallAvg > 0 ? ((bestAvg - overallAvg) / overallAvg) * 100 : 0;

    if (bestDay && delta > 10) {
      insights.push({
        type: "positive",
        message: `${bestDay} posts get ${Math.round(delta)}% more opens than average`,
        metric: "day_of_week",
        delta: Math.round(delta),
      });
    }
  }

  // ─── Title length correlation ───
  const shortTitle = posts.filter((p) => p.title.length <= 50);
  const longTitle = posts.filter((p) => p.title.length > 50);

  if (shortTitle.length >= 2 && longTitle.length >= 2) {
    const shortAvg = shortTitle.reduce((s, p) => s + p.opens, 0) / shortTitle.length;
    const longAvg = longTitle.reduce((s, p) => s + p.opens, 0) / longTitle.length;

    if (shortAvg > longAvg * 1.1) {
      const delta = longAvg > 0 ? ((shortAvg - longAvg) / longAvg) * 100 : 0;
      insights.push({
        type: "positive",
        message: `Shorter titles (under 50 chars) get ${Math.round(delta)}% more opens`,
        metric: "title_length",
        delta: Math.round(delta),
      });
    } else if (longAvg > shortAvg * 1.1) {
      const delta = shortAvg > 0 ? ((longAvg - shortAvg) / shortAvg) * 100 : 0;
      insights.push({
        type: "neutral",
        message: `Longer titles perform ${Math.round(delta)}% better for your audience`,
        metric: "title_length",
        delta: Math.round(delta),
      });
    }
  }

  // ─── Trend detection (recent vs older) ───
  if (posts.length >= 4) {
    const sorted = [...posts].sort(
      (a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime(),
    );
    const half = Math.floor(sorted.length / 2);
    const recent = sorted.slice(0, half);
    const older = sorted.slice(half);

    const recentAvg = recent.reduce((s, p) => s + p.opens, 0) / recent.length;
    const olderAvg = older.reduce((s, p) => s + p.opens, 0) / older.length;
    const delta = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

    if (Math.abs(delta) > 5) {
      insights.push({
        type: delta > 0 ? "positive" : "negative",
        message: delta > 0
          ? `Your open rate has improved ${Math.round(delta)}% recently`
          : `Opens have dropped ${Math.round(Math.abs(delta))}% in recent posts`,
        metric: "trend",
        delta: Math.round(delta),
      });
    }
  }

  // ─── Click-to-open ratio ───
  const totalOpens = posts.reduce((s, p) => s + p.opens, 0);
  const totalClicks = posts.reduce((s, p) => s + p.clicks, 0);
  if (totalOpens > 0) {
    const ctr = (totalClicks / totalOpens) * 100;
    if (ctr > 5) {
      insights.push({
        type: "positive",
        message: `Great click rate! ${ctr.toFixed(1)}% of openers click through`,
        metric: "click_rate",
        delta: ctr,
      });
    } else if (ctr < 2 && totalClicks > 0) {
      insights.push({
        type: "negative",
        message: `Low click rate (${ctr.toFixed(1)}%). Try stronger CTAs or more links`,
        metric: "click_rate",
        delta: ctr,
      });
    }
  }

  // ─── Unsubscribe alert ───
  if (posts.length >= 3) {
    const recentPosts = [...posts]
      .sort((a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime())
      .slice(0, 3);
    const recentUnsubs = recentPosts.reduce((s, p) => s + p.unsubscribes, 0);
    const avgUnsubs = posts.reduce((s, p) => s + p.unsubscribes, 0) / posts.length;

    if (recentUnsubs / 3 > avgUnsubs * 1.5 && recentUnsubs > 0) {
      insights.push({
        type: "negative",
        message: "Unsubscribes are higher than usual in recent posts",
        metric: "unsubscribes",
        delta: -Math.round(((recentUnsubs / 3 - avgUnsubs) / Math.max(1, avgUnsubs)) * 100),
      });
    }
  }

  return insights;
}

/**
 * Find the best performing post.
 */
export function getTopPost(posts: PostPerformance[]): PostPerformance | null {
  if (posts.length === 0) return null;
  return posts.reduce((best, post) => (post.opens > best.opens ? post : best), posts[0]);
}

/**
 * Get top N posts sorted by opens.
 */
export function getLeaderboard(posts: PostPerformance[], limit = 5): PostPerformance[] {
  return [...posts].sort((a, b) => b.opens - a.opens).slice(0, limit);
}
