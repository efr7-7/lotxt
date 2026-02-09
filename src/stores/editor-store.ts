import { create } from "zustand";
import type { JSONContent } from "@tiptap/react";

interface Document {
  id: string;
  title: string;
  content: JSONContent | null;
  htmlContent: string;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  characterCount: number;
}

interface EditorState {
  currentDocument: Document;
  documents: Document[];
  isSaving: boolean;

  setTitle: (title: string) => void;
  setContent: (content: JSONContent, html: string) => void;
  setWordCount: (words: number, characters: number) => void;
  createNewDocument: () => void;
  loadDocument: (id: string) => void;
}

const createEmptyDocument = (): Document => ({
  id: crypto.randomUUID(),
  title: "",
  content: null,
  htmlContent: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  wordCount: 0,
  characterCount: 0,
});

export const useEditorStore = create<EditorState>((set, get) => ({
  currentDocument: createEmptyDocument(),
  documents: [],
  isSaving: false,

  setTitle: (title) =>
    set((state) => ({
      currentDocument: {
        ...state.currentDocument,
        title,
        updatedAt: new Date().toISOString(),
      },
    })),

  setContent: (content, html) =>
    set((state) => ({
      currentDocument: {
        ...state.currentDocument,
        content,
        htmlContent: html,
        updatedAt: new Date().toISOString(),
      },
    })),

  setWordCount: (words, characters) =>
    set((state) => ({
      currentDocument: {
        ...state.currentDocument,
        wordCount: words,
        characterCount: characters,
      },
    })),

  createNewDocument: () =>
    set((state) => {
      const newDoc = createEmptyDocument();
      return {
        currentDocument: newDoc,
        documents: [...state.documents, state.currentDocument],
      };
    }),

  loadDocument: (id) =>
    set((state) => {
      const doc = state.documents.find((d) => d.id === id);
      if (!doc) return state;
      return {
        currentDocument: doc,
        documents: state.documents.map((d) =>
          d.id === state.currentDocument.id ? state.currentDocument : d,
        ),
      };
    }),
}));
