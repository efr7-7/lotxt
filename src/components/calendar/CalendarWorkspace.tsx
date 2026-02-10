import { useEffect, useState, useMemo } from "react";
import { useCalendarStore } from "@/stores/calendar-store";
import { CalendarGrid } from "./CalendarGrid";
import { DayDetailPanel } from "./DayDetailPanel";
import { ScheduleDialog } from "./ScheduleDialog";
import {
  ChevronLeft, ChevronRight, CalendarDays, Plus, Loader2,
  LayoutGrid, Columns3, Clock, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CalendarWorkspace() {
  const { currentDate, viewMode, selectedDate, isLoading, navigate, setViewMode, fetchEvents, events } = useCalendarStore();
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => {
    fetchEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Stats as compact badges
  const stats = useMemo(() => {
    const scheduled = events.filter((e) => e.status === "pending" || e.status === "scheduled").length;
    const published = events.filter((e) => e.status === "published").length;
    const drafts = events.filter((e) => e.status === "draft").length;
    return { scheduled, published, drafts, total: events.length };
  }, [events]);

  return (
    <div className="h-full flex flex-col">
      {/* Header - compact, full width */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 shrink-0">
        {/* Left: Title + Navigation */}
        <div className="flex items-center gap-3">
          <CalendarDays className="w-4.5 h-4.5 text-primary/70" />
          <h1 className="text-[15px] font-semibold text-foreground tracking-tight">
            {MONTHS[month]} {year}
          </h1>

          <div className="flex items-center gap-0.5 ml-1">
            <button
              onClick={() => navigate(-1)}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate(0)}
              className="h-7 px-2.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigate(1)}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground ml-1" />}

          {/* Compact stat badges */}
          <div className="flex items-center gap-2 ml-3 pl-3 border-l border-border/30">
            {stats.scheduled > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                <Clock className="w-3 h-3" />
                <span className="text-[10px] font-semibold tabular-nums">{stats.scheduled}</span>
                <span className="text-[10px] font-medium opacity-70">scheduled</span>
              </div>
            )}
            {stats.published > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="w-3 h-3" />
                <span className="text-[10px] font-semibold tabular-nums">{stats.published}</span>
                <span className="text-[10px] font-medium opacity-70">published</span>
              </div>
            )}
            {stats.drafts > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                <span className="text-[10px] font-semibold tabular-nums">{stats.drafts}</span>
                <span className="text-[10px] font-medium opacity-70">drafts</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: View toggle + Schedule button */}
        <div className="flex items-center gap-2.5">
          {/* View toggle */}
          <div className="flex items-center bg-muted/60 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("month")}
              className={cn(
                "h-7 px-2.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5",
                viewMode === "month"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Month
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={cn(
                "h-7 px-2.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5",
                viewMode === "week"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Columns3 className="w-3.5 h-3.5" />
              Week
            </button>
          </div>

          <button
            onClick={() => setShowSchedule(true)}
            className="h-8 px-3.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Schedule
          </button>
        </div>
      </div>

      {/* Content area - calendar fills the space */}
      <div className="flex-1 flex min-h-0">
        <CalendarGrid />
        {selectedDate && <DayDetailPanel />}
      </div>

      {/* Schedule dialog */}
      {showSchedule && <ScheduleDialog onClose={() => setShowSchedule(false)} />}
    </div>
  );
}
