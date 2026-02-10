import { useState, useEffect, useCallback } from "react";
import { CanvasToolbar } from "./CanvasToolbar";
import { DesignCanvas } from "./DesignCanvas";
import { PropertyPanel } from "./PropertyPanel";
import { LayerPanel } from "./LayerPanel";
import { TemplatePanel } from "./TemplatePanel";
import { SaveTemplateDialog } from "./SaveTemplateDialog";
import { CanvasAiAgent } from "./CanvasAiAgent";
import { CanvasAiWelcome } from "./CanvasAiWelcome";
import { useCanvasStore, CANVAS_PRESETS } from "@/stores/canvas-store";
import { useAiStore } from "@/stores/ai-store";
import { cn } from "@/lib/utils";
import {
  Layers,
  LayoutTemplate,
  MousePointer2,
  Move,
  ZoomIn,
} from "lucide-react";

const AI_WELCOME_KEY = "station:canvas-ai-welcomed";

type LeftTab = "layers" | "templates";

export default function CanvasWorkspace() {
  const { canvasPreset, setCanvasPreset, zoom, canvasSize, selectedIds, elements } = useCanvasStore();
  const [showAi, setShowAi] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [leftTab, setLeftTab] = useState<LeftTab>("layers");
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Track cursor position over canvas area
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      // Approximate position on canvas accounting for zoom and centering
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      setCursorPos({ x: Math.round(rawX), y: Math.round(rawY) });
    },
    [],
  );

  const handleCanvasMouseLeave = useCallback(() => {
    setCursorPos(null);
  }, []);

  // Check if we should show the AI welcome popup
  useEffect(() => {
    const wasWelcomed = localStorage.getItem(AI_WELCOME_KEY);
    if (!wasWelcomed) {
      // Small delay so the canvas renders first
      const timer = setTimeout(() => setShowWelcome(true), 400);
      return () => clearTimeout(timer);
    }
  }, []);

  // Load AI providers on mount
  useEffect(() => {
    useAiStore.getState().loadProviders();
  }, []);

  // Ctrl+J to toggle AI agent
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "j") {
        e.preventDefault();
        setShowAi((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleAcceptWelcome = useCallback(() => {
    localStorage.setItem(AI_WELCOME_KEY, "true");
    setShowWelcome(false);
    setShowAi(true);
  }, []);

  const handleDismissWelcome = useCallback(() => {
    localStorage.setItem(AI_WELCOME_KEY, "true");
    setShowWelcome(false);
  }, []);

  // Selected element info for status bar
  const selectedElement =
    selectedIds.length === 1
      ? elements.find((el) => el.id === selectedIds[0])
      : null;

  return (
    <div className="h-full flex flex-col">
      <CanvasToolbar
        onToggleAi={() => setShowAi((v) => !v)}
        showAi={showAi}
        onSaveTemplate={() => setShowSaveTemplate(true)}
      />
      <div className="flex-1 flex min-h-0 relative">
        {/* Left panel: Layers + Templates */}
        <div className="w-56 border-r border-border/60 bg-card/50 shrink-0 flex flex-col">
          {/* Preset selector */}
          <div className="px-3 pt-3 pb-2.5 border-b border-border/40">
            <label className="text-[10px] font-semibold text-muted-foreground/50 mb-1.5 block uppercase tracking-wider flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-40">
                <rect x="1" y="1" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <line x1="5" y1="1" x2="5" y2="9" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/>
                <line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/>
              </svg>
              Canvas Size
            </label>
            <select
              value={canvasPreset}
              onChange={(e) => setCanvasPreset(e.target.value)}
              className="w-full rounded-lg border border-border/40 bg-background/80 px-2.5 py-1.5 text-[11px] text-foreground outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 transition-colors"
            >
              {CANVAS_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} ({p.width}&times;{p.height})
                </option>
              ))}
            </select>
          </div>

          {/* Tabs: Layers / Templates */}
          <div className="flex items-center h-9 border-b border-border/40 shrink-0">
            <button
              onClick={() => setLeftTab("layers")}
              className={cn(
                "flex-1 h-full text-[10px] font-medium transition-colors relative flex items-center justify-center gap-1.5",
                leftTab === "layers"
                  ? "text-foreground/90"
                  : "text-muted-foreground/40 hover:text-foreground/60"
              )}
            >
              <Layers className="w-3 h-3" />
              Layers
              {leftTab === "layers" && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[2px] bg-primary rounded-full" />
              )}
            </button>
            <div className="w-px h-4 bg-border/20" />
            <button
              onClick={() => setLeftTab("templates")}
              className={cn(
                "flex-1 h-full text-[10px] font-medium transition-colors relative flex items-center justify-center gap-1.5",
                leftTab === "templates"
                  ? "text-foreground/90"
                  : "text-muted-foreground/40 hover:text-foreground/60"
              )}
            >
              <LayoutTemplate className="w-3 h-3" />
              Templates
              {leftTab === "templates" && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[2px] bg-primary rounded-full" />
              )}
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {leftTab === "layers" ? <LayerPanel /> : <TemplatePanel />}
          </div>
        </div>

        {/* Canvas area with checkerboard + ruler */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Ruler header */}
          <div className="h-6 bg-[hsl(0_0%_7%)] border-b border-border/30 flex items-center px-3 shrink-0">
            <div className="flex items-center gap-3 text-[9px] font-mono text-muted-foreground/40 tracking-wider select-none">
              <span className="text-muted-foreground/25">|</span>
              <span>0</span>
              <span className="text-muted-foreground/15">---</span>
              <span>{Math.round(canvasSize.width / 4)}</span>
              <span className="text-muted-foreground/15">---</span>
              <span>{Math.round(canvasSize.width / 2)}</span>
              <span className="text-muted-foreground/15">---</span>
              <span>{Math.round((canvasSize.width * 3) / 4)}</span>
              <span className="text-muted-foreground/15">---</span>
              <span>{canvasSize.width}px</span>
            </div>
            <div className="flex-1" />
            <span className="text-[9px] font-mono text-muted-foreground/30">
              {canvasSize.width} &times; {canvasSize.height}
            </span>
          </div>

          {/* Canvas viewport - checkerboard background */}
          <div
            className="flex-1 overflow-auto flex items-center justify-center p-8 relative"
            style={{
              backgroundColor: "hsl(0 0% 7%)",
              backgroundImage:
                "linear-gradient(45deg, hsl(0 0% 9%) 25%, transparent 25%), " +
                "linear-gradient(-45deg, hsl(0 0% 9%) 25%, transparent 25%), " +
                "linear-gradient(45deg, transparent 75%, hsl(0 0% 9%) 75%), " +
                "linear-gradient(-45deg, transparent 75%, hsl(0 0% 9%) 75%)",
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
            }}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
          >
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
                transition: "transform 100ms ease-out",
              }}
            >
              <DesignCanvas />
            </div>

            {/* Floating AI Agent -- inside canvas area */}
            <CanvasAiAgent
              isOpen={showAi}
              onClose={() => setShowAi(false)}
            />
          </div>

          {/* Status bar */}
          <div className="h-7 bg-[hsl(0_0%_6%)] border-t border-border/30 flex items-center px-3 gap-4 shrink-0 select-none">
            {/* Canvas dimensions */}
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground/40">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-30">
                <rect x="1" y="1" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1"/>
              </svg>
              {canvasSize.width} &times; {canvasSize.height}
            </div>

            <div className="w-px h-3 bg-border/20" />

            {/* Zoom level */}
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground/40">
              <ZoomIn className="w-2.5 h-2.5 opacity-40" />
              {Math.round(zoom * 100)}%
            </div>

            <div className="w-px h-3 bg-border/20" />

            {/* Cursor position */}
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground/40">
              <Move className="w-2.5 h-2.5 opacity-40" />
              {cursorPos ? `${cursorPos.x}, ${cursorPos.y}` : "-- , --"}
            </div>

            <div className="flex-1" />

            {/* Selected element info */}
            {selectedIds.length === 0 && (
              <span className="text-[9px] text-muted-foreground/25 italic">No selection</span>
            )}
            {selectedIds.length === 1 && selectedElement && (
              <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/40">
                <MousePointer2 className="w-2.5 h-2.5 opacity-40" />
                <span className="text-muted-foreground/50 font-sans font-medium">
                  {selectedElement.name}
                </span>
                <span>
                  {Math.round(selectedElement.x)}, {Math.round(selectedElement.y)}
                </span>
                <span className="text-muted-foreground/25">/</span>
                <span>
                  {Math.round(selectedElement.width)} &times; {Math.round(selectedElement.height)}
                </span>
              </div>
            )}
            {selectedIds.length > 1 && (
              <span className="text-[9px] text-primary/60 font-medium">
                {selectedIds.length} elements selected
              </span>
            )}
          </div>
        </div>

        {/* Right panel: Properties */}
        <div className="w-60 border-l border-border/60 bg-card/50 shrink-0">
          <PropertyPanel />
        </div>
      </div>

      {/* Save Template dialog */}
      {showSaveTemplate && (
        <SaveTemplateDialog onClose={() => setShowSaveTemplate(false)} />
      )}

      {/* AI Welcome popup */}
      {showWelcome && (
        <CanvasAiWelcome
          onAccept={handleAcceptWelcome}
          onDismiss={handleDismissWelcome}
        />
      )}
    </div>
  );
}
