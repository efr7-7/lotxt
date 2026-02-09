import { CanvasToolbar } from "./CanvasToolbar";
import { DesignCanvas } from "./DesignCanvas";
import { PropertyPanel } from "./PropertyPanel";
import { LayerPanel } from "./LayerPanel";
import { useCanvasStore, CANVAS_PRESETS } from "@/stores/canvas-store";

export default function CanvasWorkspace() {
  const { canvasPreset, setCanvasPreset, zoom } = useCanvasStore();

  return (
    <div className="h-full flex flex-col">
      <CanvasToolbar />
      <div className="flex-1 flex min-h-0">
        {/* Left panel: Layers */}
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
          <LayerPanel />
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto bg-[hsl(0_0%_8%)] flex items-center justify-center p-8">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              transition: "transform 100ms ease-out",
            }}
          >
            <DesignCanvas />
          </div>
        </div>

        {/* Right panel: Properties */}
        <div className="w-56 border-l border-border bg-card/50 shrink-0">
          <PropertyPanel />
        </div>
      </div>
    </div>
  );
}
