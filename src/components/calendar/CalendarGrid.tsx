import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useCalendarStore, type CalendarEvent } from "@/stores/calendar-store";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EVENT_COLORS: Record<string, string> = {
  draft: "bg-muted/80 text-muted-foreground border-border/40",
  scheduled: "bg-blue-500/12 text-blue-600 border-blue-500/20",
  published: "bg-emerald-500/12 text-emerald-600 border-emerald-500/20",
  pending: "bg-blue-500/12 text-blue-600 border-blue-500/20",
  failed: "bg-red-500/12 text-red-600 border-red-500/20",
  cancelled: "bg-muted/50 text-muted-foreground/40 line-through border-border/20",
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
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function CalendarGrid() {
  const { currentDate, selectedDate, setSelectedDate, events, addQuickEvent, removeEvent } =
    useCalendarStore();

  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const weeks = useMemo(() => getMonthGrid(year, month), [year, month]);

  // Index events by day
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const dateKey = event.date.slice(0, 10);
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(event);
    }
    return map;
  }, [events]);

  // Auto-focus input when editing cell changes
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  const startEditing = useCallback((dateKey: string) => {
    setEditingCell(dateKey);
    setEditValue("");
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingCell(null);
    setEditValue("");
  }, []);

  const submitQuickAdd = useCallback(() => {
    if (editingCell && editValue.trim()) {
      addQuickEvent(editingCell, editValue.trim());
    }
    cancelEditing();
  }, [editingCell, editValue, addQuickEvent, cancelEditing]);

  const handleCellClick = useCallback(
    (date: Date) => {
      setSelectedDate(date);
    },
    [setSelectedDate]
  );

  const handleCellDoubleClick = useCallback(
    (dateKey: string) => {
      startEditing(dateKey);
    },
    [startEditing]
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitQuickAdd();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEditing();
      }
    },
    [submitQuickAdd, cancelEditing]
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border/30 shrink-0">
        {DAYS.map((d) => (
          <div
            key={d}
            className="py-2.5 text-center text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Weeks grid - fills remaining space */}
      <div className="flex-1 flex flex-col min-h-0">
        {weeks.map((week, wi) => (
          <div
            key={wi}
            className="flex-1 grid grid-cols-7 border-b border-border/15 last:border-b-0 min-h-0"
          >
            {week.map((date, di) => {
              if (!date) {
                return (
                  <div
                    key={di}
                    className="border-r border-border/10 last:border-r-0 bg-muted/10"
                  />
                );
              }

              const dateKey = formatDateKey(date);
              const dayEvents = eventsByDay.get(dateKey) || [];
              const isToday = isSameDay(date, today);
              const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
              const isCurrentMonth = date.getMonth() === month;
              const isEditing = editingCell === dateKey;
              const isHovered = hoveredCell === dateKey;

              return (
                <div
                  key={di}
                  onClick={() => handleCellClick(date)}
                  onDoubleClick={() => handleCellDoubleClick(dateKey)}
                  onMouseEnter={() => setHoveredCell(dateKey)}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={cn(
                    "relative border-r border-border/10 last:border-r-0 p-1.5 cursor-pointer transition-all duration-150 overflow-hidden flex flex-col",
                    isSelected
                      ? "bg-primary/[0.06] ring-1 ring-inset ring-primary/30"
                      : isHovered
                        ? "bg-accent/40"
                        : "",
                    isToday && !isSelected && "bg-amber-500/[0.04]",
                    !isCurrentMonth && "opacity-35"
                  )}
                >
                  {/* Date header row */}
                  <div className="flex items-center justify-between mb-1 shrink-0">
                    <span
                      className={cn(
                        "text-[12px] font-medium w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                        isToday
                          ? "bg-primary text-primary-foreground font-bold shadow-sm"
                          : isSelected
                            ? "text-primary font-semibold"
                            : "text-muted-foreground"
                      )}
                    >
                      {date.getDate()}
                    </span>

                    {/* Hover "+" affordance - only show when not editing */}
                    {isHovered && !isEditing && isCurrentMonth && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(dateKey);
                        }}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Add task (or double-click)"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Event count badge when not hovered */}
                    {!isHovered && dayEvents.length > 0 && (
                      <span className="text-[9px] text-muted-foreground/40 font-medium tabular-nums">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event pills */}
                  <div className="flex-1 space-y-0.5 overflow-hidden min-h-0">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "group/pill text-[10px] leading-snug font-medium px-1.5 py-[3px] rounded-md truncate border flex items-center gap-1 transition-colors",
                          EVENT_COLORS[event.status] || EVENT_COLORS.draft
                        )}
                        title={`${event.title} (${event.status})`}
                      >
                        <span className="truncate flex-1">
                          {event.title || "Untitled"}
                        </span>
                        {event.status === "draft" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeEvent(event.id);
                            }}
                            className="hidden group-hover/pill:flex w-3.5 h-3.5 rounded items-center justify-center text-muted-foreground/50 hover:text-red-500 shrink-0"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-muted-foreground/40 pl-1 font-medium">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Inline quick-add input */}
                  {isEditing && (
                    <div
                      className="mt-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => e.stopPropagation()}
                    >
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        onBlur={submitQuickAdd}
                        placeholder="Add task..."
                        className="w-full text-[11px] px-2 py-1.5 rounded-md border border-primary/40 bg-background/90 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/60 shadow-sm"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
