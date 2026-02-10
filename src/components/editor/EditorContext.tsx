import { createContext, useContext, useRef, useCallback, useEffect, type ReactNode } from "react";
import { useEditor, type Editor } from "@tiptap/react";
import { getEditorExtensions } from "@/lib/editor-extensions";
import { useEditorStore } from "@/stores/editor-store";
import { useSocialStore } from "@/stores/social-store";
import { toast } from "@/stores/toast-store";

const AUTO_SAVE_DELAY = 30_000; // 30s idle

const EditorContext = createContext<Editor | null>(null);

export function useEditorInstance(): Editor | null {
  return useContext(EditorContext);
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const { currentDocument, setContent, setWordCount } = useEditorStore();
  const socialSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingDocument = useRef(false);

  // Debounced social preview sync — updates 500ms after user stops typing
  const syncSocialPreview = useCallback((title: string, html: string) => {
    if (socialSyncTimer.current) clearTimeout(socialSyncTimer.current);
    socialSyncTimer.current = setTimeout(() => {
      useSocialStore.getState().deriveFromEditor(title, html);
    }, 500);
  }, []);

  // ─── Auto-save function ───
  const performAutoSave = useCallback(async () => {
    const store = useEditorStore.getState();
    if (!store.isDirty) return;

    const doc = store.currentDocument;
    if (!doc.title && !doc.htmlContent) return; // skip empty docs

    store.setSaveStatus("saving");
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("auto_save", {
        id: doc.id,
        title: doc.title || "Untitled",
        content: JSON.stringify(doc.content),
        htmlContent: doc.htmlContent,
      });
      store.markClean();
      store.setSaveStatus("saved");
      store.setLastSavedAt(new Date().toISOString());
      // Fade back to idle after 2s
      setTimeout(() => {
        if (useEditorStore.getState().saveStatus === "saved") {
          useEditorStore.getState().setSaveStatus("idle");
        }
      }, 2000);
    } catch (e) {
      console.error("Auto-save failed:", e);
      store.setSaveStatus("error");
      toast.error("Auto-save failed");
    }
  }, []);

  // ─── Debounced auto-save trigger ───
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      performAutoSave();
    }, AUTO_SAVE_DELAY);
  }, [performAutoSave]);

  const editor = useEditor({
    extensions: getEditorExtensions(),
    content: currentDocument.content || "<p></p>",
    editorProps: {
      attributes: {
        class: "tiptap-editor outline-none min-h-[60vh]",
      },
    },
    onUpdate: ({ editor }) => {
      if (isLoadingDocument.current) return;

      const json = editor.getJSON();
      const html = editor.getHTML();
      setContent(json, html);

      const text = editor.state.doc.textContent;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      setWordCount(words, chars);

      // Auto-sync social preview
      const title = useEditorStore.getState().currentDocument.title;
      syncSocialPreview(title, html);

      // Schedule auto-save
      scheduleAutoSave();
    },
  });

  // ─── Save on visibility change (tab hidden) and beforeunload ───
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && useEditorStore.getState().isDirty) {
        performAutoSave();
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (useEditorStore.getState().isDirty) {
        performAutoSave();
        e.preventDefault();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [performAutoSave]);

  // ─── Tauri window close interception ───
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    (async () => {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        unlisten = await getCurrentWindow().onCloseRequested(async (event) => {
          if (useEditorStore.getState().isDirty) {
            await performAutoSave();
          }
        });
      } catch {
        // Not in Tauri — ignore
      }
    })();

    return () => {
      unlisten?.();
    };
  }, [performAutoSave]);

  // ─── Sync editor content when currentDocument.id changes ───
  const prevDocId = useRef(currentDocument.id);
  useEffect(() => {
    if (prevDocId.current !== currentDocument.id && editor) {
      isLoadingDocument.current = true;
      editor.commands.setContent(currentDocument.content || "<p></p>");
      prevDocId.current = currentDocument.id;
      // Defer flag reset to let the onUpdate from setContent pass through
      requestAnimationFrame(() => {
        isLoadingDocument.current = false;
      });
    }
  }, [currentDocument.id, currentDocument.content, editor]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  return (
    <EditorContext.Provider value={editor}>{children}</EditorContext.Provider>
  );
}
