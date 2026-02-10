import { useEffect, useState, useMemo } from "react";
import { useCalendarStore } from "@/stores/calendar-store";
import { CalendarGrid } from "./CalendarGrid";
import { DayDetailPanel } from "./DayDetailPanel";
import { ScheduleDialog } from "./ScheduleDialog";
import {
  ChevronLeft, ChevronRight, CalendarDays, Plus, Loader2,
  LayoutGrid, Columns3, Clock, Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

export default function CalendarWorkspace() {
  const { currentDate, viewMode, selectedDate, isLoading, navigate, setViewMode, fetchEvents, events, setSelectedDate } = useCalendarStore();
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => {
    fetchEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  // Stats for the sidebar
  const stats = useMemo(() => {
    const scheduled = events.filter((e) => e.status === "pending" || e.status === "scheduled").length;
    const published = events.filter((e) => e.status === "published").length;
    const failed = events.filter((e) => e.status === "failed").length;
    return { scheduled, published, failed, total: events.length };
  }, [events]);

  // Mini calendar dates for sidebar
  const miniCalDates = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dates: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) dates.push(null);
    for (let d = 1; d <= daysInMonth; d++) dates.push(d);
    while (dates.length % 7 !== 0) dates.push(null);
    return dates;
  }, [year, month]);

  // Events indexed by day for mini-cal dots
  const eventDays = useMemo(() => {
    const set = new Set<number>();
    events.forEach((e) => {
      const d = new Date(e.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        set.add(d.getDate());
      }
    });
    return set;
  }, [events, year, month]);

  return (
    <div className="h-full flex">
      {/* Left sidebar — Mini calendar + Stats */}
      <div className="w-[220px] border-r border-border/30 bg-card/20 shrink-0 flex flex-col">
        {/* Mini calendar */}
        <div className="px-3 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-foreground">{MONTHS[month]} {year}</span>
            <div className="flex items-center gap-0.5">
              <button onClick={() => navigate(-1)} className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent">
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button onClick={() => navigate(1)} className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent">
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0">
            {DAYS_SHORT.map((d, i) => (
              <div key={i} className="text-center text-[8px] font-semibold text-muted-foreground/40 py-0.5">{d}</div>
            ))}
          </div>

          {/* Mini-cal grid */}
          <div className="grid grid-cols-7 gap-0">
            {miniCalDates.map((date, i) => {
              if (date === null) return <div key={i} />;
              const isToday = date === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const hasEvents = eventDays.has(date);
              const isSelected = selectedDate && selectedDate.getDate() === date && selectedDate.getMonth() === month;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(new Date(year, month, date))}
                  className={cn(
                    "relative w-full aspect-square flex items-center justify-center text-[10px] rounded transition-colors",
                    isToday && "font-bold",
                    isSelected ? "bg-primary text-primary-foreground" : isToday ? "text-primary" : "text-foreground/70 hover:bg-accent/50"
                  )}
                >
                  {date}
                  {hasEvents && !isSelected && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/60" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-border/20 mx-3" />

        {/* Stats */}
        <div className="px-3 py-3 space-y-2">
          <h4 className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-wider">This month</h4>
          <div className="space-y-1">
            <StatRow icon={Clock} label="Scheduled" value={stats.scheduled} color="text-blue-500" />
            <StatRow icon={Target} label="Published" value={stats.published} color="text-emerald-500" />
            {stats.failed > 0 && <StatRow icon={Target} label="Failed" value={stats.failed} color="text-red-500" />}
          </div>
          <div className="pt-1">
            <span className="text-[10px] text-muted-foreground/30">{stats.total} total events</span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Quick schedule button */}
        <div className="p-3 border-t border-border/20">
          <button
            onClick={() => setShowSchedule(true)}
            className="w-full h-8 rounded-lg bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3 h-3" />
            Schedule Post
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <h1 className="text-sm font-semibold text-foreground">
              {MONTHS[month]} {year}
            </h1>

            <div className="flex items-center gap-0.5 ml-2">
              <button
                onClick={() => navigate(-1)}
                className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigate(0)}
                className="h-6 px-2 rounded text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                Today
              </button>
              <button
                onClick={() => navigate(1)}
                className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-2" />}
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-muted rounded-md p-0.5">
              <button
                onClick={() => setViewMode("month")}
                className={cn(
                  "h-6 px-2 rounded text-[10px] font-medium transition-colors flex items-center gap-1",
                  viewMode === "month" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                <LayoutGrid className="w-3 h-3" />
                Month
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={cn(
                  "h-6 px-2 rounded text-[10px] font-medium transition-colors flex items-center gap-1",
                  viewMode === "week" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                <Columns3 className="w-3 h-3" />
                Week
              </button>
            </div>

            <button
              onClick={() => setShowSchedule(true)}
              className="h-7 px-3 rounded-md bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3" />
              Schedule
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex min-h-0">
          <CalendarGrid />
          {selectedDate && <DayDetailPanel />}
        </div>
      </div>

      {/* Schedule dialog */}
      {showSchedule && <ScheduleDialog onClose={() => setShowSchedule(false)} />}
    </div>
  );
}

function StatRow({ icon: Icon, label, value, color }: { icon: typeof Clock; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Icon className={cn("w-3 h-3", color)} />
        <span className="text-[11px] text-foreground/70">{label}</span>
      </div>
      <span className="text-[11px] font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  );
}
