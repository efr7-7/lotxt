import { create } from "zustand";
import { useEditorStore } from "./editor-store";
import { useWorkspaceStore } from "./workspace-store";

const STORAGE_KEY = "station:captures";

export interface CaptureItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  tags: string[];
  isPinned: boolean;
  promotedToDocId: string | null;
}

interface CaptureState {
  items: CaptureItem[];
  isDialogOpen: boolean;

  /* Dialog */
  openCapture: () => void;
  closeCapture: () => void;

  /* CRUD */
  addItem: (title: string, body?: string, tags?: string[]) => CaptureItem;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<CaptureItem>) => void;
  togglePin: (id: string) => void;

  /* Promotion */
  promoteToDocument: (id: string) => void;

  /* Getters */
  getUnpromoted: () => CaptureItem[];
  getPinned: () => CaptureItem[];
}

function generateId(): string {
  return `cap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadFromStorage(): CaptureItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveToStorage(items: CaptureItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export const useCaptureStore = create<CaptureState>((set, get) => ({
  items: loadFromStorage(),
  isDialogOpen: false,

  openCapture: () => set({ isDialogOpen: true }),
  closeCapture: () => set({ isDialogOpen: false }),

  addItem: (title, body = "", tags = []) => {
    const item: CaptureItem = {
      id: generateId(),
      title: title.trim(),
      body: body.trim(),
      createdAt: new Date().toISOString(),
      tags,
      isPinned: false,
      promotedToDocId: null,
    };
    const newItems = [item, ...get().items];
    set({ items: newItems, isDialogOpen: false });
    saveToStorage(newItems);
    return item;
  },

  removeItem: (id) => {
    const newItems = get().items.filter((i) => i.id !== id);
    set({ items: newItems });
    saveToStorage(newItems);
  },

  updateItem: (id, updates) => {
    const newItems = get().items.map((i) =>
      i.id === id ? { ...i, ...updates } : i,
    );
    set({ items: newItems });
    saveToStorage(newItems);
  },

  togglePin: (id) => {
    const newItems = get().items.map((i) =>
      i.id === id ? { ...i, isPinned: !i.isPinned } : i,
    );
    set({ items: newItems });
    saveToStorage(newItems);
  },

  promoteToDocument: (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;

    // Create a new document from the capture
    const editorStore = useEditorStore.getState();
    editorStore.createNewDocument();

    // Set title after a tick so the new document is active
    setTimeout(() => {
      const store = useEditorStore.getState();
      store.setTitle(item.title);
      // If the capture has body text, we could set content too
      // For now just the title is enough to get started
    }, 50);

    // Mark as promoted
    const docId = useEditorStore.getState().currentDocument.id;
    const newItems = get().items.map((i) =>
      i.id === id ? { ...i, promotedToDocId: docId } : i,
    );
    set({ items: newItems });
    saveToStorage(newItems);

    // Navigate to editor
    useWorkspaceStore.getState().setActiveWorkspace("editor");
  },

  getUnpromoted: () => {
    return get().items.filter((i) => i.promotedToDocId === null);
  },

  getPinned: () => {
    return get().items.filter((i) => i.isPinned && i.promotedToDocId === null);
  },
}));
