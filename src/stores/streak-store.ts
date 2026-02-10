import { create } from "zustand";

const STORAGE_KEY = "station:streak-data";

export interface DayActivity {
  date: string; // YYYY-MM-DD
  wordsWritten: number;
  documentsEdited: number;
  focusMinutes: number;
  designsCreated: number;
  postsPublished: number;
}

export interface StreakState {
  /* ── Persisted data ── */
  days: DayActivity[];
  currentStreak: number;
  longestStreak: number;
  totalWordsAllTime: number;
  totalFocusMinutesAllTime: number;
  totalPostsAllTime: number;
  weeklyGoal: number; // days per week target (default 5)

  /* ── Actions ── */
  recordActivity: (type: keyof Omit<DayActivity, "date">, amount: number) => void;
  getToday: () => DayActivity;
  getWeek: () => DayActivity[];
  getMonth: () => DayActivity[];
  setWeeklyGoal: (days: number) => void;
  computeStreak: () => void;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function loadFromStorage(): Partial<StreakState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveToStorage(state: StreakState) {
  try {
    const data = {
      days: state.days.slice(-90), // Keep 90 days max
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      totalWordsAllTime: state.totalWordsAllTime,
      totalFocusMinutesAllTime: state.totalFocusMinutesAllTime,
      totalPostsAllTime: state.totalPostsAllTime,
      weeklyGoal: state.weeklyGoal,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function computeStreakFromDays(days: DayActivity[]): { current: number; longest: number } {
  if (days.length === 0) return { current: 0, longest: 0 };

  // Sort by date descending
  const sorted = [...days]
    .filter((d) => d.wordsWritten > 0 || d.focusMinutes > 0 || d.postsPublished > 0)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) return { current: 0, longest: 0 };

  // Current streak: count backwards from today
  let current = 0;
  const today = todayStr();
  const yesterday = daysAgo(1);

  // Check if the most recent activity is today or yesterday
  if (sorted[0].date !== today && sorted[0].date !== yesterday) {
    current = 0;
  } else {
    let checkDate = sorted[0].date === today ? today : yesterday;
    for (const day of sorted) {
      if (day.date === checkDate) {
        current++;
        // Move to previous day
        const d = new Date(checkDate);
        d.setDate(d.getDate() - 1);
        checkDate = d.toISOString().slice(0, 10);
      } else if (day.date < checkDate) {
        break;
      }
    }
  }

  // Longest streak: scan all days
  let longest = 0;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date);
    const curr = new Date(sorted[i].date);
    const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (Math.round(diffDays) === 1) {
      streak++;
    } else {
      longest = Math.max(longest, streak);
      streak = 1;
    }
  }
  longest = Math.max(longest, streak, current);

  return { current, longest };
}

const stored = loadFromStorage();

export const useStreakStore = create<StreakState>((set, get) => ({
  days: (stored.days as DayActivity[]) ?? [],
  currentStreak: stored.currentStreak ?? 0,
  longestStreak: stored.longestStreak ?? 0,
  totalWordsAllTime: stored.totalWordsAllTime ?? 0,
  totalFocusMinutesAllTime: stored.totalFocusMinutesAllTime ?? 0,
  totalPostsAllTime: stored.totalPostsAllTime ?? 0,
  weeklyGoal: stored.weeklyGoal ?? 5,

  recordActivity: (type, amount) => {
    const state = get();
    const today = todayStr();
    const existingIdx = state.days.findIndex((d) => d.date === today);

    let newDays: DayActivity[];
    if (existingIdx >= 0) {
      newDays = state.days.map((d, i) =>
        i === existingIdx ? { ...d, [type]: d[type] + amount } : d,
      );
    } else {
      const newDay: DayActivity = {
        date: today,
        wordsWritten: 0,
        documentsEdited: 0,
        focusMinutes: 0,
        designsCreated: 0,
        postsPublished: 0,
        [type]: amount,
      };
      newDays = [...state.days, newDay];
    }

    // Update all-time totals
    const updates: Partial<StreakState> = { days: newDays };
    if (type === "wordsWritten") updates.totalWordsAllTime = state.totalWordsAllTime + amount;
    if (type === "focusMinutes") updates.totalFocusMinutesAllTime = state.totalFocusMinutesAllTime + amount;
    if (type === "postsPublished") updates.totalPostsAllTime = state.totalPostsAllTime + amount;

    // Recompute streak
    const { current, longest } = computeStreakFromDays(newDays);
    updates.currentStreak = current;
    updates.longestStreak = Math.max(state.longestStreak, longest);

    set(updates as any);
    saveToStorage(get());
  },

  getToday: () => {
    const today = todayStr();
    return (
      get().days.find((d) => d.date === today) ?? {
        date: today,
        wordsWritten: 0,
        documentsEdited: 0,
        focusMinutes: 0,
        designsCreated: 0,
        postsPublished: 0,
      }
    );
  },

  getWeek: () => {
    const days = get().days;
    const weekDates = Array.from({ length: 7 }, (_, i) => daysAgo(6 - i));
    return weekDates.map(
      (date) =>
        days.find((d) => d.date === date) ?? {
          date,
          wordsWritten: 0,
          documentsEdited: 0,
          focusMinutes: 0,
          designsCreated: 0,
          postsPublished: 0,
        },
    );
  },

  getMonth: () => {
    const days = get().days;
    const monthDates = Array.from({ length: 30 }, (_, i) => daysAgo(29 - i));
    return monthDates.map(
      (date) =>
        days.find((d) => d.date === date) ?? {
          date,
          wordsWritten: 0,
          documentsEdited: 0,
          focusMinutes: 0,
          designsCreated: 0,
          postsPublished: 0,
        },
    );
  },

  setWeeklyGoal: (days) => {
    set({ weeklyGoal: days });
    saveToStorage(get());
  },

  computeStreak: () => {
    const state = get();
    const { current, longest } = computeStreakFromDays(state.days);
    set({
      currentStreak: current,
      longestStreak: Math.max(state.longestStreak, longest),
    });
    saveToStorage(get());
  },
}));
