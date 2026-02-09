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

interface CanvasState {
  elements: CanvasElement[];
  selectedId: string | null;
  tool: CanvasTool;
  zoom: number;
  canvasSize: { width: number; height: number };
  canvasPreset: string;

  // History for undo/redo
  history: CanvasElement[][];
  historyIndex: number;

  setTool: (tool: CanvasTool) => void;
  setZoom: (zoom: number) => void;
  setCanvasSize: (width: number, height: number) => void;
  setCanvasPreset: (presetId: string) => void;
  setSelectedId: (id: string | null) => void;

  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, changes: Partial<CanvasElement>) => void;
  removeElement: (id: string) => void;
  reorderElement: (id: string, direction: "up" | "down") => void;

  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  elements: [],
  selectedId: null,
  tool: "select",
  zoom: 1,
  canvasSize: { width: 1200, height: 675 },
  canvasPreset: "twitter",
  history: [[]],
  historyIndex: 0,

  setTool: (tool) => set({ tool }),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),

  setCanvasSize: (width, height) => set({ canvasSize: { width, height } }),

  setCanvasPreset: (presetId) => {
    const preset = CANVAS_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      set({
        canvasPreset: presetId,
        canvasSize: { width: preset.width, height: preset.height },
      });
    }
  },

  setSelectedId: (id) => set({ selectedId: id }),

  addElement: (element) =>
    set((state) => {
      const newElements = [...state.elements, element];
      return {
        elements: newElements,
        selectedId: element.id,
        history: [
          ...state.history.slice(0, state.historyIndex + 1),
          newElements,
        ],
        historyIndex: state.historyIndex + 1,
      };
    }),

  updateElement: (id, changes) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...changes } : el,
      ),
    })),

  removeElement: (id) =>
    set((state) => {
      const newElements = state.elements.filter((el) => el.id !== id);
      return {
        elements: newElements,
        selectedId: state.selectedId === id ? null : state.selectedId,
        history: [
          ...state.history.slice(0, state.historyIndex + 1),
          newElements,
        ],
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
      [newElements[idx], newElements[targetIdx]] = [
        newElements[targetIdx],
        newElements[idx],
      ];
      return { elements: newElements };
    }),

  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        elements: state.history[newIndex],
        historyIndex: newIndex,
        selectedId: null,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        elements: state.history[newIndex],
        historyIndex: newIndex,
        selectedId: null,
      };
    }),

  pushHistory: () =>
    set((state) => ({
      history: [
        ...state.history.slice(0, state.historyIndex + 1),
        [...state.elements],
      ],
      historyIndex: state.historyIndex + 1,
    })),
}));
