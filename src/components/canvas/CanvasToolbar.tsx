import { useState, useRef } from "react";
import { useCanvasStore } from "@/stores/canvas-store";
import type { AlignDirection, DistributeAxis } from "@/stores/canvas-store";
import {
  MousePointer2,
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  Minus,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Download,
  Trash2,
  Sparkles,
  Link,
  Upload,
  X,
  ChevronDown,
  FileImage,
  Save,
  Grid3X3,
  Triangle,
  Star,
  ArrowRight,
  Hexagon,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
  Maximize,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasTool, CanvasElement } from "@/types/canvas";

const CREATE_TOOLS: { id: CanvasTool; icon: typeof MousePointer2; label: string }[] = [
  { id: "select", icon: MousePointer2, label: "Select (V)" },
  { id: "rect", icon: Square, label: "Rectangle (R)" },
  { id: "circle", icon: Circle, label: "Circle (C)" },
  { id: "triangle", icon: Triangle, label: "Triangle" },
  { id: "star", icon: Star, label: "Star" },
  { id: "polygon", icon: Hexagon, label: "Polygon" },
  { id: "arrow", icon: ArrowRight, label: "Arrow (A)" },
  { id: "text", icon: Type, label: "Text (T)" },
  { id: "line", icon: Minus, label: "Line (L)" },
];

const ALIGN_OPTIONS: { direction: AlignDirection; icon: typeof AlignHorizontalJustifyStart; label: string }[] = [
  { direction: "left", icon: AlignHorizontalJustifyStart, label: "Align Left" },
  { direction: "center", icon: AlignHorizontalJustifyCenter, label: "Align Center" },
  { direction: "right", icon: AlignHorizontalJustifyEnd, label: "Align Right" },
  { direction: "top", icon: AlignVerticalJustifyStart, label: "Align Top" },
  { direction: "middle", icon: AlignVerticalJustifyCenter, label: "Align Middle" },
  { direction: "bottom", icon: AlignVerticalJustifyEnd, label: "Align Bottom" },
];

const DISTRIBUTE_OPTIONS: { axis: DistributeAxis; icon: typeof AlignHorizontalSpaceAround; label: string }[] = [
  { axis: "horizontal", icon: AlignHorizontalSpaceAround, label: "Distribute Horizontally" },
  { axis: "vertical", icon: AlignVerticalSpaceAround, label: "Distribute Vertically" },
];

/* ---- Custom tooltip component ---- */
function ToolTip({ children, label }: { children: React.ReactNode; label: string }) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-[60] pointer-events-none">
          <div className="px-2.5 py-1 rounded-lg bg-background/90 backdrop-blur-xl border border-border/40 shadow-lg shadow-black/20 text-[10px] font-medium text-foreground/80 whitespace-nowrap">
            {label}
          </div>
        </div>
      )}
    </div>
  );
}

interface CanvasToolbarProps {
  onToggleAi?: () => void;
  showAi?: boolean;
  onSaveTemplate?: () => void;
}

export function CanvasToolbar({ onToggleAi, showAi, onSaveTemplate }: CanvasToolbarProps) {
  const {
    tool,
    setTool,
    addElement,
    selectedIds,
    selectedId,
    deleteSelection,
    undo,
    redo,
    zoom,
    setZoom,
    canvasSize,
    showGrid,
    setShowGrid,
    snapToGrid,
    setSnapToGrid,
    alignElements,
    distributeElements,
  } = useCanvasStore();

  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAlignMenu, setShowAlignMenu] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [jpegQuality, setJpegQuality] = useState(0.92);
  const [showFillPicker, setShowFillPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick color swatch state from selected element
  const elements = useCanvasStore((s) => s.elements);
  const updateElement = useCanvasStore((s) => s.updateElement);
  const selectedElement =
    selectedIds.length === 1
      ? elements.find((el) => el.id === selectedIds[0])
      : null;

  const currentFill =
    selectedElement && "fill" in selectedElement
      ? (selectedElement as any).fill || "#6366f1"
      : "#6366f1";
  const currentStroke =
    selectedElement && "stroke" in selectedElement
      ? (selectedElement as any).stroke || "transparent"
      : "transparent";

  const handleToolClick = (toolId: CanvasTool) => {
    if (toolId === "select" || toolId === "line" || toolId === "arrow") {
      setTool(toolId);
      return;
    }

    if (toolId === "image") {
      setShowImageDialog(true);
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
    } else if (toolId === "triangle") {
      element = {
        id,
        type: "triangle",
        x: cx,
        y: cy,
        width: 140,
        height: 140,
        rotation: 0,
        opacity: 1,
        name: "Triangle",
        fill: "#f59e0b",
        stroke: "",
        strokeWidth: 0,
        sides: 3,
      };
    } else if (toolId === "star") {
      element = {
        id,
        type: "star",
        x: cx,
        y: cy,
        width: 140,
        height: 140,
        rotation: 0,
        opacity: 1,
        name: "Star",
        fill: "#eab308",
        stroke: "",
        strokeWidth: 0,
        numPoints: 5,
        innerRadius: 0.4,
      };
    } else if (toolId === "polygon") {
      element = {
        id,
        type: "polygon",
        x: cx,
        y: cy,
        width: 140,
        height: 140,
        rotation: 0,
        opacity: 1,
        name: "Hexagon",
        fill: "#8b5cf6",
        stroke: "",
        strokeWidth: 0,
        sides: 6,
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

  const addImageElement = (src: string) => {
    const id = crypto.randomUUID();
    const cx = canvasSize.width / 2;
    const cy = canvasSize.height / 2;

    // Load image to get natural dimensions
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Scale to fit within canvas (max 50% of canvas)
      const maxW = canvasSize.width * 0.5;
      const maxH = canvasSize.height * 0.5;
      let w = img.naturalWidth;
      let h = img.naturalHeight;

      if (w > maxW || h > maxH) {
        const ratio = Math.min(maxW / w, maxH / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      addElement({
        id,
        type: "image",
        x: cx - w / 2,
        y: cy - h / 2,
        width: w,
        height: h,
        rotation: 0,
        opacity: 1,
        name: "Image",
        src,
      });
    };
    img.onerror = () => {
      // Fallback: add with default dimensions
      addElement({
        id,
        type: "image",
        x: cx - 150,
        y: cy - 100,
        width: 300,
        height: 200,
        rotation: 0,
        opacity: 1,
        name: "Image",
        src,
      });
    };
    img.src = src;
    setTool("select");
  };

  const handleImageUrl = () => {
    if (!imageUrl.trim()) return;
    addImageElement(imageUrl.trim());
    setImageUrl("");
    setShowImageDialog(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        addImageElement(reader.result);
        setShowImageDialog(false);
      }
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExport = (format: "png" | "jpeg" | "svg") => {
    const stageCanvas = document.querySelector("canvas") as HTMLCanvasElement | null;
    if (!stageCanvas) return;

    if (format === "svg") {
      const dataUrl = stageCanvas.toDataURL("image/png");
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${canvasSize.width}" height="${canvasSize.height}" viewBox="0 0 ${canvasSize.width} ${canvasSize.height}">
  <image width="${canvasSize.width}" height="${canvasSize.height}" href="${dataUrl}"/>
</svg>`;
      const blob = new Blob([svgContent], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "station-design.svg";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
      const quality = format === "jpeg" ? jpegQuality : undefined;
      const url = stageCanvas.toDataURL(mimeType, quality);
      const a = document.createElement("a");
      a.href = url;
      a.download = `station-design.${format === "jpeg" ? "jpg" : "png"}`;
      a.click();
    }
    setShowExportMenu(false);
  };

  const handleFitToScreen = () => {
    // Calculate zoom to fit canvas within viewport with some padding
    const viewportW = window.innerWidth - 56 - 60 - 64; // left panel + right panel + padding
    const viewportH = window.innerHeight - 44 - 33 - 64; // toolbar + ruler + status bar + padding
    const scaleW = viewportW / canvasSize.width;
    const scaleH = viewportH / canvasSize.height;
    const fitZoom = Math.min(scaleW, scaleH, 1);
    setZoom(Math.round(fitZoom * 100) / 100);
  };

  const multipleSelected = selectedIds.length >= 2;

  return (
    <div className="h-11 flex items-center px-2 border-b border-border/60 gap-0.5 shrink-0 bg-background/95 backdrop-blur-sm relative">
      {/* ── Create section ── */}
      <div className="flex items-center gap-0.5 relative">
        <span className="absolute -top-0.5 left-1 text-[7px] font-semibold text-muted-foreground/25 uppercase tracking-[0.1em] select-none pointer-events-none">
          Create
        </span>
        {CREATE_TOOLS.map((t) => (
          <ToolTip key={t.id} label={t.label}>
            <button
              onClick={() => handleToolClick(t.id)}
              className={cn(
                "h-8 w-8 rounded-md flex items-center justify-center transition-all relative",
                tool === t.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              <t.icon className="w-4 h-4" />
              {/* Active bottom indicator */}
              {tool === t.id && (
                <div className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-4 h-[2px] bg-primary rounded-full" />
              )}
            </button>
          </ToolTip>
        ))}

        {/* Image tool */}
        <ToolTip label="Image (I)">
          <button
            onClick={() => handleToolClick("image")}
            className={cn(
              "h-8 w-8 rounded-md flex items-center justify-center transition-all relative",
              showImageDialog
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
          >
            <ImageIcon className="w-4 h-4" />
            {showImageDialog && (
              <div className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-4 h-[2px] bg-primary rounded-full" />
            )}
          </button>
        </ToolTip>
      </div>

      <div className="w-px h-5 bg-border/40 mx-1.5" />

      {/* ── Edit section ── */}
      <div className="flex items-center gap-0.5 relative">
        <span className="absolute -top-0.5 left-1 text-[7px] font-semibold text-muted-foreground/25 uppercase tracking-[0.1em] select-none pointer-events-none">
          Edit
        </span>

        {/* Grid toggle */}
        <ToolTip label={showGrid ? "Hide Grid" : "Show Grid"}>
          <button
            onClick={() => {
              setShowGrid(!showGrid);
              if (!showGrid) setSnapToGrid(true);
            }}
            className={cn(
              "h-8 w-8 rounded-md flex items-center justify-center transition-all relative",
              showGrid
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
          >
            <Grid3X3 className="w-4 h-4" />
            {showGrid && (
              <div className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-4 h-[2px] bg-primary rounded-full" />
            )}
          </button>
        </ToolTip>

        {/* Alignment dropdown -- only when 2+ selected */}
        <div className="relative">
          <ToolTip label="Align & Distribute">
            <button
              onClick={() => setShowAlignMenu((v) => !v)}
              disabled={!multipleSelected}
              className={cn(
                "h-8 px-2 rounded-md flex items-center gap-1 text-xs font-medium transition-all",
                !multipleSelected
                  ? "text-muted-foreground/20 cursor-not-allowed"
                  : showAlignMenu
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
          </ToolTip>

          {showAlignMenu && multipleSelected && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowAlignMenu(false)}
              />
              <div className="absolute left-0 top-full mt-1 w-52 rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/30 z-50 p-1.5">
                <div className="px-2 py-1">
                  <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-wider">
                    Align
                  </span>
                </div>
                {ALIGN_OPTIONS.map((opt) => (
                  <button
                    key={opt.direction}
                    onClick={() => {
                      alignElements(opt.direction);
                      setShowAlignMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-foreground/80 hover:bg-accent/50 transition-colors"
                  >
                    <opt.icon className="w-3.5 h-3.5 text-muted-foreground/60" />
                    {opt.label}
                  </button>
                ))}
                {selectedIds.length >= 3 && (
                  <>
                    <div className="h-px bg-border/30 my-1" />
                    <div className="px-2 py-1">
                      <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-wider">
                        Distribute
                      </span>
                    </div>
                    {DISTRIBUTE_OPTIONS.map((opt) => (
                      <button
                        key={opt.axis}
                        onClick={() => {
                          distributeElements(opt.axis);
                          setShowAlignMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-foreground/80 hover:bg-accent/50 transition-colors"
                      >
                        <opt.icon className="w-3.5 h-3.5 text-muted-foreground/60" />
                        {opt.label}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Undo/Redo */}
        <ToolTip label="Undo (Ctrl+Z)">
          <button
            onClick={undo}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
          >
            <Undo2 className="w-4 h-4" />
          </button>
        </ToolTip>
        <ToolTip label="Redo (Ctrl+Y)">
          <button
            onClick={redo}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </ToolTip>
      </div>

      <div className="w-px h-5 bg-border/40 mx-1.5" />

      {/* ── Color Swatches ── */}
      {selectedElement && (
        <>
          <div className="flex items-center gap-1 relative">
            <span className="absolute -top-0.5 left-0.5 text-[7px] font-semibold text-muted-foreground/25 uppercase tracking-[0.1em] select-none pointer-events-none">
              Color
            </span>
            {/* Fill swatch */}
            <ToolTip label="Fill Color">
              <div className="relative">
                <button
                  onClick={() => { setShowFillPicker((v) => !v); setShowStrokePicker(false); }}
                  className="h-7 w-7 rounded-md border border-border/40 flex items-center justify-center hover:border-border/80 transition-colors overflow-hidden"
                >
                  <div
                    className="w-5 h-5 rounded-[3px]"
                    style={{ backgroundColor: currentFill || "#6366f1" }}
                  />
                </button>
                {showFillPicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowFillPicker(false)} />
                    <div className="absolute left-0 top-full mt-1 z-50 p-2 rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/30">
                      <label className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-wider mb-1 block">Fill</label>
                      <input
                        type="color"
                        value={currentFill}
                        onChange={(e) => {
                          if (selectedElement) updateElement(selectedElement.id, { fill: e.target.value });
                        }}
                        className="w-32 h-24 rounded border-0 cursor-pointer bg-transparent"
                      />
                    </div>
                  </>
                )}
              </div>
            </ToolTip>

            {/* Stroke swatch */}
            <ToolTip label="Stroke Color">
              <div className="relative">
                <button
                  onClick={() => { setShowStrokePicker((v) => !v); setShowFillPicker(false); }}
                  className="h-7 w-7 rounded-md border border-border/40 flex items-center justify-center hover:border-border/80 transition-colors overflow-hidden"
                >
                  <div
                    className="w-5 h-5 rounded-[3px] border-2"
                    style={{
                      borderColor: currentStroke && currentStroke !== "transparent" ? currentStroke : "hsl(var(--muted-foreground)/0.2)",
                      backgroundColor: "transparent",
                    }}
                  />
                </button>
                {showStrokePicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowStrokePicker(false)} />
                    <div className="absolute left-0 top-full mt-1 z-50 p-2 rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/30">
                      <label className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-wider mb-1 block">Stroke</label>
                      <input
                        type="color"
                        value={currentStroke && currentStroke !== "transparent" ? currentStroke : "#000000"}
                        onChange={(e) => {
                          if (selectedElement) updateElement(selectedElement.id, { stroke: e.target.value, strokeWidth: Math.max(1, (selectedElement as any).strokeWidth || 0) });
                        }}
                        className="w-32 h-24 rounded border-0 cursor-pointer bg-transparent"
                      />
                    </div>
                  </>
                )}
              </div>
            </ToolTip>
          </div>

          <div className="w-px h-5 bg-border/40 mx-1.5" />
        </>
      )}

      {/* ── View section ── */}
      <div className="flex items-center gap-0.5 relative">
        <span className="absolute -top-0.5 left-1 text-[7px] font-semibold text-muted-foreground/25 uppercase tracking-[0.1em] select-none pointer-events-none">
          View
        </span>
        <ToolTip label="Zoom Out">
          <button
            onClick={() => setZoom(zoom - 0.1)}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </ToolTip>
        <span className="text-[10px] text-muted-foreground/60 w-10 text-center select-none font-mono">
          {Math.round(zoom * 100)}%
        </span>
        <ToolTip label="Zoom In">
          <button
            onClick={() => setZoom(zoom + 0.1)}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </ToolTip>

        {/* Fit to Screen */}
        <ToolTip label="Fit to Screen">
          <button
            onClick={handleFitToScreen}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </ToolTip>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Selection count badge */}
      {selectedIds.length > 1 && (
        <span className="h-5 px-2 rounded-full bg-primary/10 text-primary text-[9px] font-semibold flex items-center mr-1.5">
          {selectedIds.length} selected
        </span>
      )}

      {/* Delete selected */}
      {selectedIds.length > 0 && (
        <ToolTip label="Delete (Del)">
          <button
            onClick={deleteSelection}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </ToolTip>
      )}

      {/* Save as Template */}
      {onSaveTemplate && (
        <ToolTip label="Save as Template">
          <button
            onClick={onSaveTemplate}
            className="h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all border border-transparent hover:border-border/30"
          >
            <Save className="w-3 h-3" />
            Save
          </button>
        </ToolTip>
      )}

      {/* AI Agent toggle */}
      {onToggleAi && (
        <ToolTip label="Design Agent (Ctrl+J)">
          <button
            onClick={onToggleAi}
            className={cn(
              "h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-[10px] font-medium transition-all border",
              showAi
                ? "bg-violet-500/15 text-violet-400 border-violet-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent hover:border-border/30"
            )}
          >
            <Sparkles className="w-3 h-3" />
            Agent
          </button>
        </ToolTip>
      )}

      <div className="w-px h-5 bg-border/40 mx-1" />

      {/* Export dropdown */}
      <div className="relative">
        <ToolTip label="Export design">
          <button
            onClick={() => setShowExportMenu((v) => !v)}
            className={cn(
              "h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-[10px] font-medium transition-all border",
              showExportMenu
                ? "bg-primary/15 text-primary border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent hover:border-border/30"
            )}
          >
            <Download className="w-3 h-3" />
            Export
            <ChevronDown className="w-3 h-3 opacity-40" />
          </button>
        </ToolTip>

        {showExportMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowExportMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/30 z-50 p-2 space-y-0.5">
              <button
                onClick={() => handleExport("png")}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-foreground/80 hover:bg-accent/50 transition-colors"
              >
                <FileImage className="w-3.5 h-3.5 text-blue-400" />
                PNG
                <span className="ml-auto text-[9px] text-muted-foreground/40">Lossless</span>
              </button>
              <button
                onClick={() => handleExport("jpeg")}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-foreground/80 hover:bg-accent/50 transition-colors"
              >
                <FileImage className="w-3.5 h-3.5 text-amber-400" />
                JPEG
                <span className="ml-auto text-[9px] text-muted-foreground/40">Smaller size</span>
              </button>
              <button
                onClick={() => handleExport("svg")}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-foreground/80 hover:bg-accent/50 transition-colors"
              >
                <FileImage className="w-3.5 h-3.5 text-emerald-400" />
                SVG
                <span className="ml-auto text-[9px] text-muted-foreground/40">Scalable</span>
              </button>

              {/* JPEG quality slider */}
              <div className="px-3 py-2 border-t border-border/30 mt-1 pt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground/50">JPEG Quality</span>
                  <span className="text-[10px] text-muted-foreground/50 font-mono">
                    {Math.round(jpegQuality * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={jpegQuality}
                  onChange={(e) => setJpegQuality(Number(e.target.value))}
                  className="w-full h-1 rounded-full accent-primary"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Image dialog popover */}
      {showImageDialog && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowImageDialog(false)}
          />
          {/* Dropdown */}
          <div className="absolute left-[220px] top-full mt-1 w-72 rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/30 z-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[12px] font-semibold text-foreground/80">Add Image</h3>
              <button
                onClick={() => setShowImageDialog(false)}
                className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* URL input */}
            <div>
              <label className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-1 block">
                From URL
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/30" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleImageUrl()}
                    placeholder="https://example.com/image.png"
                    className="w-full h-8 pl-8 pr-2 rounded-lg bg-accent/30 border border-border/30 text-[12px] text-foreground placeholder:text-muted-foreground/25 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
                  />
                </div>
                <button
                  onClick={handleImageUrl}
                  disabled={!imageUrl.trim()}
                  className={cn(
                    "h-8 px-3 rounded-lg text-[11px] font-medium transition-colors",
                    imageUrl.trim()
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-accent text-muted-foreground/40 cursor-not-allowed"
                  )}
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border/40" />
              <span className="text-[10px] text-muted-foreground/30">or</span>
              <div className="flex-1 h-px bg-border/40" />
            </div>

            {/* File upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-20 rounded-xl border-2 border-dashed border-border/40 hover:border-primary/30 flex flex-col items-center justify-center gap-2 text-muted-foreground/40 hover:text-primary/60 transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span className="text-[11px] font-medium">Upload from computer</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <p className="text-[9px] text-muted-foreground/30 text-center">
              Supports PNG, JPG, SVG, WebP
            </p>
          </div>
        </>
      )}
    </div>
  );
}
