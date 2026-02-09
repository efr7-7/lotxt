import { useCanvasStore } from "@/stores/canvas-store";
import {
  MousePointer2,
  Square,
  Circle,
  Type,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Download,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasTool, CanvasElement } from "@/types/canvas";

const TOOLS: { id: CanvasTool; icon: typeof MousePointer2; label: string }[] = [
  { id: "select", icon: MousePointer2, label: "Select (V)" },
  { id: "rect", icon: Square, label: "Rectangle (R)" },
  { id: "circle", icon: Circle, label: "Circle (C)" },
  { id: "text", icon: Type, label: "Text (T)" },
];

export function CanvasToolbar() {
  const {
    tool,
    setTool,
    addElement,
    selectedId,
    removeElement,
    undo,
    redo,
    zoom,
    setZoom,
    canvasSize,
  } = useCanvasStore();

  const handleToolClick = (toolId: CanvasTool) => {
    if (toolId === "select") {
      setTool("select");
      return;
    }

    // Add a new element at center
    const id = crypto.randomUUID();
    const cx = canvasSize.width / 2;
    const cy = canvasSize.height / 2;

    let element: CanvasElement | null = null;

    if (toolId === "rect") {
      element = {
        id,
        type: "rect",
        x: cx - 100,
        y: cy - 60,
        width: 200,
        height: 120,
        rotation: 0,
        opacity: 1,
        name: "Rectangle",
        fill: "#6366f1",
        stroke: "",
        strokeWidth: 0,
        cornerRadius: 8,
      };
    } else if (toolId === "circle") {
      element = {
        id,
        type: "circle",
        x: cx,
        y: cy,
        width: 120,
        height: 120,
        rotation: 0,
        opacity: 1,
        name: "Circle",
        fill: "#6366f1",
        stroke: "",
        strokeWidth: 0,
      };
    } else if (toolId === "text") {
      element = {
        id,
        type: "text",
        x: cx - 100,
        y: cy - 20,
        width: 300,
        height: 50,
        rotation: 0,
        opacity: 1,
        name: "Text",
        text: "Double-click to edit",
        fontSize: 32,
        fontFamily: "Inter",
        fill: "#09090b",
        fontStyle: "normal",
        align: "left",
      };
    }

    if (element) {
      addElement(element);
    }
    setTool("select");
  };

  const handleExport = () => {
    const stage = document.querySelector("canvas");
    if (!stage) return;
    const url = stage.toDataURL();
    const a = document.createElement("a");
    a.href = url;
    a.download = "station-design.png";
    a.click();
  };

  return (
    <div className="h-11 flex items-center px-4 border-b border-border gap-1 shrink-0 bg-background">
      {/* Tools */}
      {TOOLS.map((t) => (
        <button
          key={t.id}
          onClick={() => handleToolClick(t.id)}
          title={t.label}
          className={cn(
            "h-8 w-8 rounded-md flex items-center justify-center transition-colors",
            tool === t.id
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          <t.icon className="w-4 h-4" />
        </button>
      ))}

      <div className="w-px h-5 bg-border mx-2" />

      {/* Undo/Redo */}
      <button
        onClick={undo}
        title="Undo"
        className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        onClick={redo}
        title="Redo"
        className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Redo2 className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-border mx-2" />

      {/* Zoom */}
      <button
        onClick={() => setZoom(zoom - 0.1)}
        title="Zoom Out"
        className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <span className="text-xs text-muted-foreground w-12 text-center select-none">
        {Math.round(zoom * 100)}%
      </span>
      <button
        onClick={() => setZoom(zoom + 0.1)}
        title="Zoom In"
        className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Delete selected */}
      {selectedId && (
        <button
          onClick={() => removeElement(selectedId)}
          title="Delete"
          className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* Export */}
      <button
        onClick={handleExport}
        title="Export as PNG"
        className="h-8 px-3 rounded-md flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Export
      </button>
    </div>
  );
}
