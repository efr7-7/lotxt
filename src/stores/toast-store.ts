import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
  duration: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (variant: ToastVariant, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

let _id = 0;
const nextId = () => `toast-${++_id}-${Date.now()}`;

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (variant, message, duration = 3500) => {
    const id = nextId();
    const toast: Toast = { id, variant, message, duration };

    set((s) => {
      // Max 3 visible — drop oldest
      const next = [...s.toasts, toast];
      return { toasts: next.length > 3 ? next.slice(-3) : next };
    });

    // Auto-dismiss
    setTimeout(() => get().removeToast(id), duration);
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

/* ─── Convenience API ─── */
export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().addToast("success", message, duration),
  error: (message: string, duration?: number) =>
    useToastStore.getState().addToast("error", message, duration),
  info: (message: string, duration?: number) =>
    useToastStore.getState().addToast("info", message, duration),
  warning: (message: string, duration?: number) =>
    useToastStore.getState().addToast("warning", message, duration),
};
