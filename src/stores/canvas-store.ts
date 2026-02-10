import { create } from "zustand";
import type { CanvasElement, CanvasElementType, CanvasTool, CanvasPreset } from "@/types/canvas";

export const CANVAS_PRESETS: CanvasPreset[] = [
  { id: "twitter", label: "Twitter/X Post", width: 1200, height: 675 },
  { id: "linkedin", label: "LinkedIn Post", width: 1200, height: 627 },
  { id: "instagram", label: "Instagram Post", width: 1080, height: 1080 },
  { id: "facebook", label: "Facebook Post", width: 1200, height: 630 },
  { id: "newsletter-header", label: "Newsletter Header", width: 1200, height: 400 },
  { id: "og-image", label: "OG Image", width: 1200, height: 630 },
  { id: "custom", label: "Custom", width: 800, height: 600 },
];

export type AlignDirection = "left" | "center" | "right" | "top" | "middle" | "bottom";
export type DistributeAxis = "horizontal" | "vertical";

interface CanvasState {
  elements: CanvasElement[];
  selectedIds: string[];
  tool: CanvasTool;
  zoom: number;
  canvasSize: { width: number; height: number };
  canvasPreset: string;
  clipboard: CanvasElement[];
  snapToGrid: boolean;
  gridSize: number;
  showGrid: boolean;

  // History for undo/redo
  history: CanvasElement[][];
  historyIndex: number;

  // Basic
  setTool: (tool: CanvasTool) => void;
  setZoom: (zoom: number) => void;
  setCanvasSize: (width: number, height: number) => void;
  setCanvasPreset: (presetId: string) => void;

  // Selection (multi-select)
  setSelectedId: (id: string | null) => void;
  selectMultiple: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;

  // Elements
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, changes: Partial<CanvasElement>) => void;
  removeElement: (id: string) => void;
  reorderElement: (id: string, direction: "up" | "down") => void;

  // Clipboard & duplication
  copySelection: () => void;
  pasteClipboard: () => void;
  duplicateSelection: () => void;
  deleteSelection: () => void;

  // Visibility & locking
  toggleElementVisibility: (id: string) => void;
  toggleElementLock: (id: string) => void;

  // Alignment & distribution
  alignElements: (direction: AlignDirection) => void;
  distributeElements: (axis: DistributeAxis) => void;

  // Grid
  setSnapToGrid: (enabled: boolean) => void;
  setShowGrid: (show: boolean) => void;

  // History
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Legacy compat
  selectedId: string | null;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  elements: [],
  selectedIds: [],
  tool: "select",
  zoom: 1,
  canvasSize: { width: 1200, height: 675 },
  canvasPreset: "twitter",
  clipboard: [],
  snapToGrid: false,
  gridSize: 10,
  showGrid: false,
  history: [[]],
  historyIndex: 0,

  // Computed compat: first selected or null
  get selectedId() {
    const ids = get().selectedIds;
    return ids.length === 1 ? ids[0] : ids.length > 0 ? ids[0] : null;
  },

  setTool: (tool) => set({ tool }),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),
  setCanvasSize: (width, height) => set({ canvasSize: { width, height } }),

  setCanvasPreset: (presetId) => {
    const preset = CANVAS_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      set({ canvasPreset: presetId, canvasSize: { width: preset.width, height: preset.height } });
    }
  },

  // ─── Selection ───
  setSelectedId: (id) => set({ selectedIds: id ? [id] : [] }),

  selectMultiple: (ids) => set({ selectedIds: ids }),

  addToSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds
        : [...state.selectedIds, id],
    })),

  toggleSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((sid) => sid !== id)
        : [...state.selectedIds, id],
    })),

  clearSelection: () => set({ selectedIds: [] }),

  // ─── Elements ───
  addElement: (element) =>
    set((state) => {
      const newElements = [...state.elements, element];
      return {
        elements: newElements,
        selectedIds: [element.id],
        history: [...state.history.slice(0, state.historyIndex + 1), newElements],
        historyIndex: state.historyIndex + 1,
      };
    }),

  updateElement: (id, changes) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? ({ ...el, ...changes } as typeof el) : el,
      ),
    })),

  removeElement: (id) =>
    set((state) => {
      const newElements = state.elements.filter((el) => el.id !== id);
      return {
        elements: newElements,
        selectedIds: state.selectedIds.filter((sid) => sid !== id),
        history: [...state.history.slice(0, state.historyIndex + 1), newElements],
        historyIndex: state.historyIndex + 1,
      };
    }),

  reorderElement: (id, direction) =>
    set((state) => {
      const idx = state.elements.findIndex((el) => el.id === id);
      if (idx === -1) return state;
      const newElements = [...state.elements];
      const targetIdx = direction === "up" ? idx + 1 : idx - 1;
      if (targetIdx < 0 || targetIdx >= newElements.length) return state;
      [newElements[idx], newElements[targetIdx]] = [newElements[targetIdx], newElements[idx]];
      return { elements: newElements };
    }),

  // ─── Clipboard ───
  copySelection: () =>
    set((state) => {
      const selected = state.elements.filter((el) => state.selectedIds.includes(el.id));
      return { clipboard: selected.map((el) => ({ ...el })) };
    }),

  pasteClipboard: () =>
    set((state) => {
      if (state.clipboard.length === 0) return state;
      const newElements = state.clipboard.map((el) => ({
        ...el,
        id: crypto.randomUUID(),
        x: el.x + 20,
        y: el.y + 20,
        name: `${el.name} copy`,
      })) as CanvasElement[];
      const all = [...state.elements, ...newElements];
      return {
        elements: all,
        selectedIds: newElements.map((el) => el.id),
        clipboard: newElements.map((el) => ({ ...el })),
        history: [...state.history.slice(0, state.historyIndex + 1), all],
        historyIndex: state.historyIndex + 1,
      };
    }),

  duplicateSelection: () => {
    const state = get();
    const selected = state.elements.filter((el) => state.selectedIds.includes(el.id));
    if (selected.length === 0) return;
    const dupes = selected.map((el) => ({
      ...el,
      id: crypto.randomUUID(),
      x: el.x + 20,
      y: el.y + 20,
      name: `${el.name} copy`,
    })) as CanvasElement[];
    const all = [...state.elements, ...dupes];
    set({
      elements: all,
      selectedIds: dupes.map((el) => el.id),
      history: [...state.history.slice(0, state.historyIndex + 1), all],
      historyIndex: state.historyIndex + 1,
    });
  },

  deleteSelection: () =>
    set((state) => {
      const newElements = state.elements.filter((el) => !state.selectedIds.includes(el.id));
      return {
        elements: newElements,
        selectedIds: [],
        history: [...state.history.slice(0, state.historyIndex + 1), newElements],
        historyIndex: state.historyIndex + 1,
      };
    }),

  // ─── Visibility & Lock ───
  toggleElementVisibility: (id) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? ({ ...el, visible: el.visible === false ? true : false } as typeof el) : el,
      ),
    })),

  toggleElementLock: (id) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? ({ ...el, locked: !el.locked } as typeof el) : el,
      ),
    })),

  // ─── Alignment ───
  alignElements: (direction) =>
    set((state) => {
      const selected = state.elements.filter((el) => state.selectedIds.includes(el.id));
      if (selected.length < 2) return state;

      const bounds = {
        minX: Math.min(...selected.map((el) => el.x)),
        maxX: Math.max(...selected.map((el) => el.x + el.width)),
        minY: Math.min(...selected.map((el) => el.y)),
        maxY: Math.max(...selected.map((el) => el.y + el.height)),
      };

      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;

      const newElements = state.elements.map((el) => {
        if (!state.selectedIds.includes(el.id)) return el;
        switch (direction) {
          case "left":   return { ...el, x: bounds.minX } as typeof el;
          case "center": return { ...el, x: centerX - el.width / 2 } as typeof el;
          case "right":  return { ...el, x: bounds.maxX - el.width } as typeof el;
          case "top":    return { ...el, y: bounds.minY } as typeof el;
          case "middle": return { ...el, y: centerY - el.height / 2 } as typeof el;
          case "bottom": return { ...el, y: bounds.maxY - el.height } as typeof el;
          default: return el;
        }
      });

      return {
        elements: newElements,
        history: [...state.history.slice(0, state.historyIndex + 1), newElements],
        historyIndex: state.historyIndex + 1,
      };
    }),

  distributeElements: (axis) =>
    set((state) => {
      const selected = state.elements.filter((el) => state.selectedIds.includes(el.id));
      if (selected.length < 3) return state;

      const sorted = [...selected].sort((a, b) =>
        axis === "horizontal" ? a.x - b.x : a.y - b.y,
      );

      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalSpace = axis === "horizontal"
        ? (last.x + last.width) - first.x
        : (last.y + last.height) - first.y;
      const totalElSize = sorted.reduce((sum, el) =>
        sum + (axis === "horizontal" ? el.width : el.height), 0);
      const gap = (totalSpace - totalElSize) / (sorted.length - 1);

      let cursor = axis === "horizontal" ? first.x : first.y;
      const posMap = new Map<string, number>();
      for (const el of sorted) {
        posMap.set(el.id, cursor);
        cursor += (axis === "horizontal" ? el.width : el.height) + gap;
      }

      const newElements = state.elements.map((el) => {
        if (!posMap.has(el.id)) return el;
        return axis === "horizontal"
          ? { ...el, x: posMap.get(el.id)! } as typeof el
          : { ...el, y: posMap.get(el.id)! } as typeof el;
      });

      return {
        elements: newElements,
        history: [...state.history.slice(0, state.historyIndex + 1), newElements],
        historyIndex: state.historyIndex + 1,
      };
    }),

  // ─── Grid ───
  setSnapToGrid: (enabled) => set({ snapToGrid: enabled }),
  setShowGrid: (show) => set({ showGrid: show }),

  // ─── History ───
  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return { elements: state.history[newIndex], historyIndex: newIndex, selectedIds: [] };
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return { elements: state.history[newIndex], historyIndex: newIndex, selectedIds: [] };
    }),

  pushHistory: () =>
    set((state) => ({
      history: [...state.history.slice(0, state.historyIndex + 1), [...state.elements]],
      historyIndex: state.historyIndex + 1,
    })),
}));
