import { useAudienceStore } from "@/stores/audience-store";
import { X, Mail, Calendar, TrendingUp, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export function SubscriberProfile() {
  const { selectedSubscriber: sub, setSelectedSubscriber } = useAudienceStore();

  if (!sub) return null;

  const engagementPct = Math.round(sub.engagementScore * 100);

  return (
    <div className="w-[280px] border-l border-border/40 bg-card/30 flex flex-col h-full shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <h3 className="text-sm font-semibold text-foreground">Subscriber</h3>
        <button
          onClick={() => setSelectedSubscriber(null)}
          className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <p className="text-[12px] font-semibold text-foreground">{sub.email}</p>
          {sub.name && <p className="text-[10px] text-muted-foreground">{sub.name}</p>}
        </div>

        {/* Engagement ring */}
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
              <circle
                cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--primary))" strokeWidth="4"
                strokeDasharray={`${engagementPct * 1.76} 176`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-foreground">{engagementPct}%</span>
          </div>
          <p className="text-[9px] text-muted-foreground mt-1">Engagement Score</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <p className="text-sm font-semibold text-foreground">{sub.totalOpens}</p>
            <p className="text-[9px] text-muted-foreground">Opens</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <p className="text-sm font-semibold text-foreground">{sub.totalClicks}</p>
            <p className="text-[9px] text-muted-foreground">Clicks</p>
          </div>
        </div>

        {/* Platforms */}
        <div>
          <h4 className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-1.5">Platforms</h4>
          <div className="space-y-1">
            {sub.platforms.map((p) => (
              <div key={p.platform + p.accountId} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-[10px] font-medium text-foreground capitalize">{p.platform}</span>
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-full font-medium",
                  p.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                )}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <h4 className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-1.5">Tags</h4>
          {sub.tags.length === 0 ? (
            <p className="text-[10px] text-muted-foreground/30">No tags</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {sub.tags.map((t) => (
                <span key={t} className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Dates */}
        <div>
          <h4 className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-1.5">Timeline</h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[10px]">
              <Calendar className="w-3 h-3 text-muted-foreground/40" />
              <span className="text-muted-foreground">First seen:</span>
              <span className="text-foreground">{new Date(sub.firstSeenAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <TrendingUp className="w-3 h-3 text-muted-foreground/40" />
              <span className="text-muted-foreground">Last seen:</span>
              <span className="text-foreground">{new Date(sub.lastSeenAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
