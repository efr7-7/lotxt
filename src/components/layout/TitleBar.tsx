import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";

const WORKSPACE_LABELS: Record<string, string> = {
  editor: "Editor",
  canvas: "Canvas",
  analytics: "Analytics",
  accounts: "Accounts",
  "social-preview": "Social Preview",
};

export function TitleBar() {
  const { activeWorkspace } = useWorkspaceStore();

  const handleMinimize = () => getCurrentWindow().minimize();
  const handleMaximize = () => getCurrentWindow().toggleMaximize();
  const handleClose = () => getCurrentWindow().close();

  return (
    <div
      data-tauri-drag-region
      className="h-9 flex items-center justify-between bg-background border-b border-border select-none shrink-0"
    >
      {/* Left: App name */}
      <div className="flex items-center gap-2 px-4" data-tauri-drag-region>
        <div className="w-3.5 h-3.5 rounded-sm bg-primary flex items-center justify-center">
          <span className="text-[8px] font-bold text-primary-foreground">S</span>
        </div>
        <span className="text-xs font-medium text-foreground/80" data-tauri-drag-region>
          Station
        </span>
        <span className="text-xs text-muted-foreground" data-tauri-drag-region>
          / {WORKSPACE_LABELS[activeWorkspace] || activeWorkspace}
        </span>
      </div>

      {/* Center: Drag region */}
      <div className="flex-1" data-tauri-drag-region />

      {/* Right: Window controls */}
      <div className="flex items-center">
        <button
          onClick={handleMinimize}
          className="h-9 w-11 flex items-center justify-center hover:bg-muted transition-colors"
          tabIndex={-1}
        >
          <Minus className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={handleMaximize}
          className="h-9 w-11 flex items-center justify-center hover:bg-muted transition-colors"
          tabIndex={-1}
        >
          <Square className="w-3 h-3 text-muted-foreground" />
        </button>
        <button
          onClick={handleClose}
          className="h-9 w-11 flex items-center justify-center hover:bg-destructive/80 hover:text-white transition-colors"
          tabIndex={-1}
        >
          <X className="w-3.5 h-3.5 text-muted-foreground hover:text-white" />
        </button>
      </div>
    </div>
  );
}
