import { useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X, Loader2, Check, AlertCircle, ChevronRight, Pencil } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useEditorStore } from "@/stores/editor-store";
import { cn } from "@/lib/utils";

const WORKSPACE_LABELS: Record<string, string> = {
  home: "Home",
  editor: "Editor",
  canvas: "Canvas",
  analytics: "Analytics",
  accounts: "Accounts",
  distribute: "Distribute",
  calendar: "Calendar",
  "social-preview": "Social Preview",
};

export function TitleBar() {
  const { activeWorkspace } = useWorkspaceStore();
  const { currentDocument, saveStatus, isDirty, setSaveStatus } = useEditorStore();

  // Auto-reset save indicator after 3 seconds
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (saveStatus === "saved") {
      savedTimerRef.current = setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    }
    return () => {
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
        savedTimerRef.current = null;
      }
    };
  }, [saveStatus, setSaveStatus]);

  const handleMinimize = () => getCurrentWindow().minimize();
  const handleMaximize = () => getCurrentWindow().toggleMaximize();
  const handleClose = () => getCurrentWindow().close();

  const isEditorWithTitle = activeWorkspace === "editor" && currentDocument.title;

  const contextLabel = isEditorWithTitle
    ? currentDocument.title
    : WORKSPACE_LABELS[activeWorkspace] || activeWorkspace;

  return (
    <div className="relative shrink-0">
      <div
        data-tauri-drag-region
        className="h-10 flex items-center justify-between bg-background/80 backdrop-blur-sm border-b border-border/30 select-none"
      >
        {/* Left: breadcrumb */}
        <div className="flex items-center gap-0 pl-[68px]" data-tauri-drag-region>
          <span
            className="text-[11.5px] font-medium text-muted-foreground/40 tracking-[-0.01em]"
            data-tauri-drag-region
          >
            Station
          </span>

          {/* Chevron separator */}
          <ChevronRight
            className="w-2 h-2 text-muted-foreground/20 mx-1.5 shrink-0"
            strokeWidth={2}
            data-tauri-drag-region
          />

          {/* Context label with optional pencil hint */}
          <span className="group/title inline-flex items-center gap-1" data-tauri-drag-region>
            <span
              className="text-[11.5px] font-medium text-foreground/70 tracking-[-0.01em]"
              data-tauri-drag-region
            >
              {contextLabel}
            </span>
            {isEditorWithTitle && (
              <Pencil
                className="w-2.5 h-2.5 text-muted-foreground/0 group-hover/title:text-muted-foreground/40 transition-colors duration-200 shrink-0"
                strokeWidth={2}
              />
            )}
          </span>

          {/* Save status indicator */}
          {activeWorkspace === "editor" && saveStatus !== "idle" && (
            <span
              className={cn(
                "ml-2.5 flex items-center gap-1 text-[10px] font-medium transition-all duration-300",
                saveStatus === "saving" && "text-muted-foreground/50 opacity-100",
                saveStatus === "saved" && "text-emerald-500/70 opacity-100 animate-in fade-in",
                saveStatus === "error" && "text-destructive/70 opacity-100",
              )}
              data-tauri-drag-region
            >
              {saveStatus === "saving" && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
              {saveStatus === "saved" && <Check className="w-2.5 h-2.5" />}
              {saveStatus === "error" && <AlertCircle className="w-2.5 h-2.5" />}
              {saveStatus === "saving" && "Saving\u2026"}
              {saveStatus === "saved" && "Saved"}
              {saveStatus === "error" && "Save failed"}
            </span>
          )}

          {/* Dirty dot */}
          {activeWorkspace === "editor" && isDirty && saveStatus === "idle" && (
            <span
              className="ml-2 w-1.5 h-1.5 rounded-full bg-muted-foreground/30"
              data-tauri-drag-region
            />
          )}
        </div>

        <div className="flex-1" data-tauri-drag-region />

        {/* Window controls */}
        <div className="flex items-center h-full">
          <button
            onClick={handleMinimize}
            className="h-full w-[46px] flex items-center justify-center hover:bg-foreground/[0.06] active:bg-foreground/[0.08] transition-colors duration-75"
            tabIndex={-1}
          >
            <Minus className="w-[14px] h-[14px] text-foreground/35 hover:text-foreground/55 transition-colors duration-75" strokeWidth={1.5} />
          </button>
          <button
            onClick={handleMaximize}
            className="h-full w-[46px] flex items-center justify-center hover:bg-foreground/[0.06] active:bg-foreground/[0.08] transition-colors duration-75"
            tabIndex={-1}
          >
            <Square className="w-[10px] h-[10px] text-foreground/35 hover:text-foreground/55 transition-colors duration-75" strokeWidth={1.5} />
          </button>
          <button
            onClick={handleClose}
            className="h-full w-[46px] flex items-center justify-center hover:bg-[#c42b1c] active:bg-[#b22a1a] transition-colors duration-75 group"
            tabIndex={-1}
          >
            <X className="w-[14px] h-[14px] text-foreground/35 group-hover:text-white transition-colors duration-75" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Subtle bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/20 to-transparent pointer-events-none" />
    </div>
  );
}
