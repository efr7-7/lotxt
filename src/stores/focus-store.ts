import { create } from "zustand";

const STORAGE_KEY = "station:focus-timer";

export type TimerState = "idle" | "work" | "short-break" | "long-break";

export interface FocusStoreState {
  /* ── Timer visibility ── */
  isTimerVisible: boolean;
  toggleTimerVisible: () => void;

  /* ── Timer config (seconds) ── */
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  pomodorosUntilLongBreak: number;
  setDuration: (key: "workDuration" | "breakDuration" | "longBreakDuration", seconds: number) => void;

  /* ── Runtime state ── */
  timerState: TimerState;
  secondsRemaining: number;
  isRunning: boolean;
  completedPomodoros: number;
  totalDeepWorkMinutes: number;

  /* ── Actions ── */
  startTimer: () => void;
  pauseTimer: () => void;
  tick: () => TimerState | null; // returns new state if transition happened
  skipToNext: () => TimerState;
  resetTimer: () => void;
  addDeepWorkSeconds: (s: number) => void;
}

function loadFromStorage(): Partial<FocusStoreState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveToStorage(state: FocusStoreState) {
  try {
    const data = {
      isTimerVisible: state.isTimerVisible,
      workDuration: state.workDuration,
      breakDuration: state.breakDuration,
      longBreakDuration: state.longBreakDuration,
      pomodorosUntilLongBreak: state.pomodorosUntilLongBreak,
      completedPomodoros: state.completedPomodoros,
      totalDeepWorkMinutes: state.totalDeepWorkMinutes,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function getNextState(current: TimerState, completedPomodoros: number, pomodorosUntilLongBreak: number): TimerState {
  if (current === "work") {
    return (completedPomodoros + 1) % pomodorosUntilLongBreak === 0
      ? "long-break"
      : "short-break";
  }
  return "work";
}

function getDurationForState(state: TimerState, store: FocusStoreState): number {
  switch (state) {
    case "work": return store.workDuration;
    case "short-break": return store.breakDuration;
    case "long-break": return store.longBreakDuration;
    default: return store.workDuration;
  }
}

const stored = loadFromStorage();

export const useFocusStore = create<FocusStoreState>((set, get) => ({
  /* ── Timer visibility ── */
  isTimerVisible: stored.isTimerVisible ?? false,
  toggleTimerVisible: () => {
    set((s) => ({ isTimerVisible: !s.isTimerVisible }));
    saveToStorage(get());
  },

  /* ── Timer config (stored in seconds) ── */
  workDuration: stored.workDuration ?? 25 * 60,
  breakDuration: stored.breakDuration ?? 5 * 60,
  longBreakDuration: stored.longBreakDuration ?? 15 * 60,
  pomodorosUntilLongBreak: stored.pomodorosUntilLongBreak ?? 4,

  setDuration: (key, seconds) => {
    set({ [key]: seconds } as any);
    saveToStorage(get());
  },

  /* ── Runtime state ── */
  timerState: "idle",
  secondsRemaining: stored.workDuration ?? 25 * 60,
  isRunning: false,
  completedPomodoros: stored.completedPomodoros ?? 0,
  totalDeepWorkMinutes: stored.totalDeepWorkMinutes ?? 0,

  /* ── Actions ── */
  startTimer: () => {
    const state = get();
    if (state.timerState === "idle") {
      set({ timerState: "work", secondsRemaining: state.workDuration, isRunning: true });
    } else {
      set({ isRunning: true });
    }
  },

  pauseTimer: () => {
    set({ isRunning: false });
  },

  tick: () => {
    const state = get();
    if (!state.isRunning || state.timerState === "idle") return null;

    const next = state.secondsRemaining - 1;

    if (next <= 0) {
      // Transition
      const wasWork = state.timerState === "work";
      const newPomodoros = wasWork ? state.completedPomodoros + 1 : state.completedPomodoros;
      const nextTimerState = getNextState(state.timerState, state.completedPomodoros, state.pomodorosUntilLongBreak);
      const nextDuration = getDurationForState(nextTimerState, state);

      set({
        timerState: nextTimerState,
        secondsRemaining: nextDuration,
        completedPomodoros: newPomodoros,
        isRunning: true,
      });

      saveToStorage(get());
      return nextTimerState;
    }

    set({ secondsRemaining: next });
    return null;
  },

  skipToNext: () => {
    const state = get();
    const wasWork = state.timerState === "work";
    const newPomodoros = wasWork ? state.completedPomodoros + 1 : state.completedPomodoros;
    const nextTimerState = state.timerState === "idle"
      ? "work"
      : getNextState(state.timerState, state.completedPomodoros, state.pomodorosUntilLongBreak);
    const nextDuration = getDurationForState(nextTimerState, { ...state, completedPomodoros: newPomodoros });

    set({
      timerState: nextTimerState,
      secondsRemaining: nextDuration,
      completedPomodoros: newPomodoros,
      isRunning: true,
    });

    saveToStorage(get());
    return nextTimerState;
  },

  resetTimer: () => {
    const state = get();
    set({
      timerState: "idle",
      secondsRemaining: state.workDuration,
      isRunning: false,
      completedPomodoros: 0,
      totalDeepWorkMinutes: 0,
    });
    saveToStorage(get());
  },

  addDeepWorkSeconds: (s) => {
    set((prev) => ({
      totalDeepWorkMinutes: prev.totalDeepWorkMinutes + s / 60,
    }));
    saveToStorage(get());
  },
}));
