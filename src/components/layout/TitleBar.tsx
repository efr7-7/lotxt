import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X, Loader2, Check, AlertCircle } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useEditorStore } from "@/stores/editor-store";
import { cn } from "@/lib/utils";

const WORKSPACE_LABELS: Record<string, string> = {
  editor: "Editor",
  canvas: "Canvas",
  analytics: "Analytics",
  accounts: "Accounts",
  distribute: "Distribute",
};

export function TitleBar() {
  const { activeWorkspace } = useWorkspaceStore();
  const { currentDocument, saveStatus, isDirty } = useEditorStore();

  const handleMinimize = () => getCurrentWindow().minimize();
  const handleMaximize = () => getCurrentWindow().toggleMaximize();
  const handleClose = () => getCurrentWindow().close();

  const contextLabel = activeWorkspace === "editor" && currentDocument.title
    ? currentDocument.title
    : WORKSPACE_LABELS[activeWorkspace] || activeWorkspace;

  return (
    <div
      data-tauri-drag-region
      className="h-10 flex items-center justify-between bg-background/80 backdrop-blur-sm border-b border-border/30 select-none shrink-0"
    >
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-0 pl-[68px]" data-tauri-drag-region>
        <span className="text-[11.5px] font-medium text-muted-foreground/40 tracking-[-0.01em]" data-tauri-drag-region>
          Station
        </span>
        <span className="text-[11.5px] text-muted-foreground/20 mx-1.5" data-tauri-drag-region>/</span>
        <span className="text-[11.5px] font-medium text-foreground/70 tracking-[-0.01em]" data-tauri-drag-region>
          {contextLabel}
        </span>

        {/* Save status indicator */}
        {activeWorkspace === "editor" && saveStatus !== "idle" && (
          <span
            className={cn(
              "ml-2.5 flex items-center gap-1 text-[10px] font-medium transition-opacity duration-300",
              saveStatus === "saving" && "text-muted-foreground/50",
              saveStatus === "saved" && "text-emerald-500/70",
              saveStatus === "error" && "text-destructive/70",
            )}
            data-tauri-drag-region
          >
            {saveStatus === "saving" && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
            {saveStatus === "saved" && <Check className="w-2.5 h-2.5" />}
            {saveStatus === "error" && <AlertCircle className="w-2.5 h-2.5" />}
            {saveStatus === "saving" && "Saving..."}
            {saveStatus === "saved" && "Saved"}
            {saveStatus === "error" && "Save failed"}
          </span>
        )}
        {activeWorkspace === "editor" && isDirty && saveStatus === "idle" && (
          <span className="ml-2 w-1.5 h-1.5 rounded-full bg-muted-foreground/30" data-tauri-drag-region />
        )}
      </div>

      <div className="flex-1" data-tauri-drag-region />

      {/* Window controls — Win11 style */}
      <div className="flex items-center h-full">
        <button
          onClick={handleMinimize}
          className="h-full w-[46px] flex items-center justify-center hover:bg-foreground/[0.04] transition-colors duration-75"
          tabIndex={-1}
        >
          <Minus className="w-[14px] h-[14px] text-foreground/35" strokeWidth={1.5} />
        </button>
        <button
          onClick={handleMaximize}
          className="h-full w-[46px] flex items-center justify-center hover:bg-foreground/[0.04] transition-colors duration-75"
          tabIndex={-1}
        >
          <Square className="w-[10px] h-[10px] text-foreground/35" strokeWidth={1.5} />
        </button>
        <button
          onClick={handleClose}
          className="h-full w-[46px] flex items-center justify-center hover:bg-[#c42b1c] transition-colors duration-75 group"
          tabIndex={-1}
        >
          <X className="w-[14px] h-[14px] text-foreground/35 group-hover:text-white" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
