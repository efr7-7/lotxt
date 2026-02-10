import { useCalendarStore, type CalendarEvent } from "@/stores/calendar-store";
import { X, Clock, ExternalLink, XCircle, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/stores/toast-store";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: "bg-muted", text: "text-muted-foreground" },
  pending: { bg: "bg-blue-500/10", text: "text-blue-600" },
  scheduled: { bg: "bg-blue-500/10", text: "text-blue-600" },
  publishing: { bg: "bg-amber-500/10", text: "text-amber-600" },
  published: { bg: "bg-emerald-500/10", text: "text-emerald-600" },
  failed: { bg: "bg-red-500/10", text: "text-red-600" },
  cancelled: { bg: "bg-muted", text: "text-muted-foreground/50" },
};

export function DayDetailPanel() {
  const { selectedDate, setSelectedDate, events, cancelPost } = useCalendarStore();

  if (!selectedDate) return null;

  const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
  const dayEvents = events.filter((e) => e.date.startsWith(dateKey));

  const handleCancel = async (id: string) => {
    try {
      await cancelPost(id);
      toast.success("Post cancelled");
    } catch {
      toast.error("Failed to cancel");
    }
  };

  return (
    <div className="w-[280px] border-l border-border/40 bg-card/30 flex flex-col h-full shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">{dayEvents.length} item{dayEvents.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setSelectedDate(null)}
          className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {dayEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground/40 text-center mt-8">Nothing scheduled</p>
        ) : (
          dayEvents.map((event) => {
            const sc = STATUS_COLORS[event.status] || STATUS_COLORS.draft;
            return (
              <div key={event.id} className="rounded-lg border border-border/40 p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-foreground truncate">{event.title || "Untitled"}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-full", sc.bg, sc.text)}>
                        {event.status}
                      </span>
                      {event.platform && (
                        <span className="text-[9px] text-muted-foreground/60">{event.platform}</span>
                      )}
                    </div>
                    {event.date && (
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground/50">
                        <Clock className="w-3 h-3" />
                        {new Date(event.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </div>
                    )}
                  </div>
                </div>
                {/* Actions for scheduled posts */}
                {(event.status === "pending" || event.status === "scheduled") && (
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/30">
                    <button
                      onClick={() => handleCancel(event.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <XCircle className="w-3 h-3" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
