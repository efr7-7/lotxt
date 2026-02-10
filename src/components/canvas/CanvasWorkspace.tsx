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

const AI_WELCOME_KEY = "station:canvas-ai-welcomed";

type LeftTab = "layers" | "templates";

export default function CanvasWorkspace() {
  const { canvasPreset, setCanvasPreset, zoom } = useCanvasStore();
  const [showAi, setShowAi] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [leftTab, setLeftTab] = useState<LeftTab>("layers");

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

  return (
    <div className="h-full flex flex-col">
      <CanvasToolbar
        onToggleAi={() => setShowAi((v) => !v)}
        showAi={showAi}
        onSaveTemplate={() => setShowSaveTemplate(true)}
      />
      <div className="flex-1 flex min-h-0 relative">
        {/* Left panel: Layers + Templates */}
        <div className="w-52 border-r border-border bg-card/50 shrink-0 flex flex-col">
          {/* Preset selector */}
          <div className="p-3 border-b border-border">
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
              Canvas Size
            </label>
            <select
              value={canvasPreset}
              onChange={(e) => setCanvasPreset(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
            >
              {CANVAS_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} ({p.width}x{p.height})
                </option>
              ))}
            </select>
          </div>

          {/* Tabs: Layers / Templates */}
          <div className="flex items-center h-9 border-b border-border shrink-0">
            <button
              onClick={() => setLeftTab("layers")}
              className={cn(
                "flex-1 h-full text-[10px] font-medium transition-colors relative",
                leftTab === "layers"
                  ? "text-foreground/90"
                  : "text-muted-foreground/40 hover:text-foreground/60"
              )}
            >
              Layers
              {leftTab === "layers" && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-primary rounded-full" />
              )}
            </button>
            <div className="w-px h-4 bg-border/30" />
            <button
              onClick={() => setLeftTab("templates")}
              className={cn(
                "flex-1 h-full text-[10px] font-medium transition-colors relative",
                leftTab === "templates"
                  ? "text-foreground/90"
                  : "text-muted-foreground/40 hover:text-foreground/60"
              )}
            >
              Templates
              {leftTab === "templates" && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-primary rounded-full" />
              )}
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {leftTab === "layers" ? <LayerPanel /> : <TemplatePanel />}
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto bg-[hsl(0_0%_8%)] flex items-center justify-center p-8 relative">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              transition: "transform 100ms ease-out",
            }}
          >
            <DesignCanvas />
          </div>

          {/* Floating AI Agent — inside canvas area */}
          <CanvasAiAgent
            isOpen={showAi}
            onClose={() => setShowAi(false)}
          />
        </div>

        {/* Right panel: Properties */}
        <div className="w-56 border-l border-border bg-card/50 shrink-0">
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
