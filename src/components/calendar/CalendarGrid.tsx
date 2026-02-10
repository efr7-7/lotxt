import { useMemo } from "react";
import { useCalendarStore, type CalendarEvent } from "@/stores/calendar-store";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EVENT_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  published: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
  pending: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  failed: "bg-red-500/15 text-red-600 border-red-500/20",
  cancelled: "bg-muted text-muted-foreground/50 line-through",
};

function getMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = new Array(startDow).fill(null);

  for (let d = 1; d <= totalDays; d++) {
    week.push(new Date(year, month, d));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return weeks;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function CalendarGrid() {
  const { currentDate, selectedDate, setSelectedDate, events } = useCalendarStore();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const weeks = useMemo(() => getMonthGrid(year, month), [year, month]);

  // Index events by day
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const dateKey = event.date.slice(0, 10); // YYYY-MM-DD
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(event);
    }
    return map;
  }, [events]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border/40">
        {DAYS.map((d) => (
          <div key={d} className="py-2 text-center text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="flex-1 grid grid-rows-[repeat(auto-fill,minmax(0,1fr))]">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-border/20 last:border-b-0">
            {week.map((date, di) => {
              if (!date) {
                return <div key={di} className="p-1 bg-muted/20" />;
              }

              const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
              const dayEvents = eventsByDay.get(dateKey) || [];
              const isToday = isSameDay(date, today);
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isCurrentMonth = date.getMonth() === month;

              return (
                <div
                  key={di}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "p-1 min-h-[80px] cursor-pointer transition-colors border-r border-border/10 last:border-r-0",
                    isSelected ? "bg-primary/5" : "hover:bg-accent/30",
                    !isCurrentMonth && "opacity-40"
                  )}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={cn(
                        "text-[11px] font-medium w-6 h-6 flex items-center justify-center rounded-full",
                        isToday && "bg-primary text-primary-foreground font-bold",
                        !isToday && "text-muted-foreground"
                      )}
                    >
                      {date.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[8px] text-muted-foreground/40 font-medium">{dayEvents.length}</span>
                    )}
                  </div>

                  {/* Event pills (max 3 visible) */}
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "text-[9px] leading-tight font-medium px-1 py-0.5 rounded truncate border",
                          EVENT_COLORS[event.status] || EVENT_COLORS.draft
                        )}
                        title={`${event.title} (${event.status})`}
                      >
                        {event.title || "Untitled"}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[8px] text-muted-foreground/50 pl-1">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
