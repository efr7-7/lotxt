import { create } from "zustand";
import type { JSONContent } from "@tiptap/react";

export type DocumentStatus = "draft" | "review" | "scheduled" | "published";

export interface Document {
  id: string;
  title: string;
  content: JSONContent | null;
  htmlContent: string;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  characterCount: number;
  projectId: string | null;
  status: DocumentStatus;
  tags: string[];
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface EditorState {
  currentDocument: Document;
  documents: Document[];
  isSaving: boolean;
  isDirty: boolean;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  showImportDialog: boolean;

  setTitle: (title: string) => void;
  setContent: (content: JSONContent, html: string) => void;
  setWordCount: (words: number, characters: number) => void;
  createNewDocument: () => void;
  loadDocument: (id: string) => boolean;
  deleteDocument: (id: string) => void;
  renameDocument: (id: string, title: string) => void;
  addTag: (docId: string, tag: string) => void;
  removeTag: (docId: string, tag: string) => void;
  getAllTags: () => string[];
  markDirty: () => void;
  markClean: () => void;
  setSaveStatus: (status: SaveStatus) => void;
  setLastSavedAt: (time: string) => void;
  setShowImportDialog: (show: boolean) => void;
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
  projectId: null,
  status: "draft",
  tags: [],
});

// ─── Welcome Sample Document ───

const WELCOME_HTML = `<h2>Welcome to Station — your all-in-one creator workspace</h2>
<p>If you're reading this, you just installed the last tool you'll ever need to write, design, and ship your newsletter. This sample post shows you what Station can do. Feel free to edit it, or start fresh with a new document.</p>
<blockquote><p>"The best creators don't work harder — they use better tools."</p></blockquote>
<h3>Write with focus and intelligence</h3>
<p>Station's editor is built for long-form content. You get real-time <strong>readability scoring</strong>, word counts, estimated read time, and paragraph-level analytics — all in the <em>Insights</em> tab on the right. No more pasting into Hemingway after the fact.</p>
<p>Need a hand? Press <strong>Ctrl+J</strong> to open the AI writing assistant. It can draft intros, rewrite paragraphs, generate subject lines, and even create entire Twitter threads from your newsletter.</p>
<h3>Design without opening another app</h3>
<p>Switch to the <strong>Canvas</strong> workspace and you'll find over 100 templates — social cards, YouTube thumbnails, email headers, TikTok covers, and more. Every template is fully editable: drag shapes, change colours, swap fonts, and export at any resolution.</p>
<ul>
<li>Drag-and-drop shape, text, and image tools</li>
<li>Pixel-perfect alignment with snap guides</li>
<li>One-click export to PNG, JPG, or SVG</li>
<li>Save custom templates for your brand</li>
</ul>
<h3>Publish everywhere at once</h3>
<p>When your post is ready, hit <strong>Publish</strong> in the toolbar. Station connects directly to Beehiiv, Substack, Kit, and Ghost — no copy-pasting, no reformatting. You can publish as a draft or go live immediately.</p>
<h3>Distribute and repurpose</h3>
<p>Open the <strong>Distribute</strong> workspace to auto-generate Twitter threads, LinkedIn posts, YouTube descriptions, TikTok captions, email subject lines, and content summaries — all from the same article. One piece of content, six platforms, zero extra effort.</p>
<h3>What to do next</h3>
<ol>
<li>Check the <strong>Insights</strong> tab on the right to see live readability scores for this post</li>
<li>Open <strong>Accounts</strong> (gear icon) to connect your newsletter platform</li>
<li>Visit the <strong>Canvas</strong> to browse templates and design a header image</li>
<li>Try the <strong>Distribute</strong> tab to generate social content from this article</li>
<li>Hit <strong>Ctrl+J</strong> to chat with the AI assistant</li>
</ol>
<p>Station is built for creators who refuse to juggle five apps. Everything you need — writing, design, publishing, analytics, distribution — lives in one place. Welcome aboard.</p>`;

const WELCOME_WORD_COUNT = 375;
const WELCOME_CHAR_COUNT = 2280;

function createInitialDocument(): Document {
  const isFirstLaunch = typeof window !== "undefined" && !localStorage.getItem("station:has-sample-doc");

  if (isFirstLaunch && typeof window !== "undefined") {
    localStorage.setItem("station:has-sample-doc", "1");
    return {
      id: crypto.randomUUID(),
      title: "Welcome to Station",
      content: null,
      htmlContent: WELCOME_HTML,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wordCount: WELCOME_WORD_COUNT,
      characterCount: WELCOME_CHAR_COUNT,
      projectId: null,
      status: "draft",
      tags: ["welcome"],
    };
  }

  return createEmptyDocument();
}

export const useEditorStore = create<EditorState>((set, get) => ({
  currentDocument: createInitialDocument(),
  documents: [],
  isSaving: false,
  isDirty: false,
  saveStatus: "idle",
  lastSavedAt: null,
  showImportDialog: false,

  setTitle: (title) =>
    set((state) => ({
      isDirty: true,
      currentDocument: {
        ...state.currentDocument,
        title,
        updatedAt: new Date().toISOString(),
      },
    })),

  setContent: (content, html) =>
    set((state) => ({
      isDirty: true,
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
        isDirty: false,
        saveStatus: "idle",
      };
    }),

  loadDocument: (id) => {
    const state = get();
    // Check if dirty — confirm before switching
    if (state.isDirty) {
      const confirmed = window.confirm(
        "You have unsaved changes. Switch document anyway?"
      );
      if (!confirmed) return false;
    }

    const doc = state.documents.find((d) => d.id === id);
    if (!doc) return false;

    set({
      currentDocument: doc,
      documents: state.documents.map((d) =>
        d.id === state.currentDocument.id ? state.currentDocument : d,
      ),
      isDirty: false,
      saveStatus: "idle",
    });
    return true;
  },

  deleteDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
    })),

  renameDocument: (id, title) =>
    set((state) => {
      if (state.currentDocument.id === id) {
        return {
          currentDocument: { ...state.currentDocument, title, updatedAt: new Date().toISOString() },
          isDirty: true,
        };
      }
      return {
        documents: state.documents.map((d) =>
          d.id === id ? { ...d, title, updatedAt: new Date().toISOString() } : d,
        ),
      };
    }),

  addTag: (docId, tag) =>
    set((state) => {
      const normalizedTag = tag.trim().toLowerCase();
      if (!normalizedTag) return state;
      if (state.currentDocument.id === docId) {
        if (state.currentDocument.tags.includes(normalizedTag)) return state;
        return {
          currentDocument: {
            ...state.currentDocument,
            tags: [...state.currentDocument.tags, normalizedTag],
          },
        };
      }
      return {
        documents: state.documents.map((d) =>
          d.id === docId && !d.tags.includes(normalizedTag)
            ? { ...d, tags: [...d.tags, normalizedTag] }
            : d,
        ),
      };
    }),

  removeTag: (docId, tag) =>
    set((state) => {
      if (state.currentDocument.id === docId) {
        return {
          currentDocument: {
            ...state.currentDocument,
            tags: state.currentDocument.tags.filter((t) => t !== tag),
          },
        };
      }
      return {
        documents: state.documents.map((d) =>
          d.id === docId ? { ...d, tags: d.tags.filter((t) => t !== tag) } : d,
        ),
      };
    }),

  getAllTags: () => {
    const state = get();
    const allDocs = [state.currentDocument, ...state.documents];
    const tags = new Set<string>();
    for (const doc of allDocs) {
      for (const tag of doc.tags) tags.add(tag);
    }
    return Array.from(tags).sort();
  },

  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),
  setSaveStatus: (status) => set({ saveStatus: status }),
  setLastSavedAt: (time) => set({ lastSavedAt: time }),
  setShowImportDialog: (show) => set({ showImportDialog: show }),
}));
