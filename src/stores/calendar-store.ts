import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface ScheduledPost {
  id: string;
  documentId: string;
  platform: string;
  accountId: string;
  publicationId: string | null;
  title: string;
  scheduledAt: string;
  status: "pending" | "publishing" | "published" | "failed" | "cancelled";
  errorMessage: string | null;
  publishedUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  eventType: "scheduled" | "published" | "draft";
  platform: string | null;
  status: string;
  documentId: string | null;
}

interface CalendarState {
  currentDate: Date;
  viewMode: "month" | "week";
  selectedDate: Date | null;
  events: CalendarEvent[];
  isLoading: boolean;

  navigate: (direction: -1 | 0 | 1) => void;
  setViewMode: (mode: "month" | "week") => void;
  setSelectedDate: (date: Date | null) => void;
  fetchEvents: (year: number, month: number) => Promise<void>;
  schedulePost: (params: {
    documentId: string;
    platform: string;
    accountId: string;
    publicationId?: string;
    title: string;
    scheduledAt: string;
  }) => Promise<void>;
  reschedulePost: (id: string, newDate: string) => Promise<void>;
  cancelPost: (id: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  currentDate: new Date(),
  viewMode: "month",
  selectedDate: null,
  events: [],
  isLoading: false,

  navigate: (direction) => {
    const curr = get().currentDate;
    const viewMode = get().viewMode;
    const next = new Date(curr);

    if (direction === 0) {
      set({ currentDate: new Date() });
    } else if (viewMode === "month") {
      next.setMonth(next.getMonth() + direction);
      set({ currentDate: next });
    } else {
      next.setDate(next.getDate() + direction * 7);
      set({ currentDate: next });
    }

    // Refresh events for new month
    const d = direction === 0 ? new Date() : next;
    get().fetchEvents(d.getFullYear(), d.getMonth() + 1);
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedDate: (date) => set({ selectedDate: date }),

  fetchEvents: async (year, month) => {
    set({ isLoading: true });
    try {
      const raw = await invoke<any[]>("get_calendar_events", { year, month });
      set({
        events: raw.map((e) => ({
          id: e.id,
          title: e.title,
          date: e.date,
          eventType: e.event_type,
          platform: e.platform,
          status: e.status,
          documentId: e.document_id,
        })),
      });
    } catch {
      // Ignore
    } finally {
      set({ isLoading: false });
    }
  },

  schedulePost: async (params) => {
    await invoke("schedule_post", {
      documentId: params.documentId,
      platform: params.platform,
      accountId: params.accountId,
      publicationId: params.publicationId,
      title: params.title,
      scheduledAt: params.scheduledAt,
    });
    const d = get().currentDate;
    get().fetchEvents(d.getFullYear(), d.getMonth() + 1);
  },

  reschedulePost: async (id, newDate) => {
    await invoke("reschedule_post", { id, newScheduledAt: newDate });
    const d = get().currentDate;
    get().fetchEvents(d.getFullYear(), d.getMonth() + 1);
  },

  cancelPost: async (id) => {
    await invoke("cancel_scheduled_post", { id });
    const d = get().currentDate;
    get().fetchEvents(d.getFullYear(), d.getMonth() + 1);
  },
}));
