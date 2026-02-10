import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Activity, FileText, Calendar, Users, DollarSign, Loader2, Layout, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityEntry {
  id: number;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
}

const ENTITY_ICONS: Record<string, React.ElementType> = {
  document: FileText,
  schedule: Calendar,
  subscriber: Users,
  revenue: DollarSign,
  template: Layout,
};

const ACTION_COLORS: Record<string, string> = {
  created: "text-green-500",
  updated: "text-blue-500",
  deleted: "text-red-500",
  published: "text-primary",
  scheduled: "text-amber-500",
  synced: "text-cyan-500",
  restored: "text-violet-500",
  added: "text-emerald-500",
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) return date.toLocaleDateString();
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

interface ActivityFeedProps {
  limit?: number;
  compact?: boolean;
}

export function ActivityFeed({ limit = 50, compact = false }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [limit]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const result = await invoke<ActivityEntry[]>("get_recent_activity", { limit });
      setActivities(result);
    } catch {
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <Activity className="w-6 h-6 text-muted-foreground/20 mb-3" />
        <p className="text-[11px] text-muted-foreground/40 text-center">
          No activity yet. Start creating content and your activity will appear here.
        </p>
      </div>
    );
  }

  // Group activities by date
  const grouped: Record<string, ActivityEntry[]> = {};
  for (const activity of activities) {
    const dateKey = new Date(activity.createdAt).toLocaleDateString();
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(activity);
  }

  return (
    <div className={cn("space-y-4", compact && "space-y-2")}>
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          {!compact && (
            <div className="flex items-center gap-2 px-3 mb-1.5">
              <Clock className="w-2.5 h-2.5 text-muted-foreground/30" />
              <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-wider">
                {date === new Date().toLocaleDateString() ? "Today" :
                 date === new Date(Date.now() - 86400000).toLocaleDateString() ? "Yesterday" :
                 date}
              </span>
              <div className="flex-1 h-px bg-border/20" />
            </div>
          )}

          <div className="space-y-0.5">
            {items.map((activity) => {
              const Icon = ENTITY_ICONS[activity.entityType] || Activity;
              const actionColor = ACTION_COLORS[activity.action] || "text-muted-foreground";

              return (
                <div
                  key={activity.id}
                  className={cn(
                    "flex items-start gap-2.5 px-3 py-1.5 rounded-md hover:bg-accent/20 transition-colors",
                    compact && "py-1"
                  )}
                >
                  <div className="mt-0.5 w-5 h-5 rounded flex items-center justify-center bg-muted/50 shrink-0">
                    <Icon className="w-3 h-3 text-muted-foreground/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-foreground/70 leading-relaxed">
                      <span className={cn("font-medium capitalize", actionColor)}>
                        {activity.action}
                      </span>
                      {" "}
                      <span className="text-muted-foreground/60">{activity.entityType}</span>
                      {activity.details && (
                        <span className="text-muted-foreground/40"> — {activity.details}</span>
                      )}
                    </p>
                    <span className="text-[9px] text-muted-foreground/30">
                      {formatTimeAgo(activity.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
