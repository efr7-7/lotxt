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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasTool, CanvasElement } from "@/types/canvas";

const SHAPE_TOOLS: { id: CanvasTool; icon: typeof MousePointer2; label: string }[] = [
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const multipleSelected = selectedIds.length >= 2;

  return (
    <div className="h-11 flex items-center px-4 border-b border-border gap-1 shrink-0 bg-background relative">
      {/* Shape Tools */}
      {SHAPE_TOOLS.map((t) => (
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

      {/* Image tool */}
      <button
        onClick={() => handleToolClick("image")}
        title="Image (I)"
        className={cn(
          "h-8 w-8 rounded-md flex items-center justify-center transition-colors",
          showImageDialog
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted",
        )}
      >
        <ImageIcon className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-border mx-2" />

      {/* Grid toggle */}
      <button
        onClick={() => {
          setShowGrid(!showGrid);
          if (!showGrid) setSnapToGrid(true);
        }}
        title={showGrid ? "Hide Grid" : "Show Grid"}
        className={cn(
          "h-8 w-8 rounded-md flex items-center justify-center transition-colors",
          showGrid
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted",
        )}
      >
        <Grid3X3 className="w-4 h-4" />
      </button>

      {/* Alignment dropdown — only when 2+ selected */}
      <div className="relative">
        <button
          onClick={() => setShowAlignMenu((v) => !v)}
          disabled={!multipleSelected}
          title="Align & Distribute"
          className={cn(
            "h-8 px-2 rounded-md flex items-center gap-1 text-xs font-medium transition-colors",
            !multipleSelected
              ? "text-muted-foreground/30 cursor-not-allowed"
              : showAlignMenu
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
          <ChevronDown className="w-3 h-3 opacity-50" />
        </button>

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

      <div className="w-px h-5 bg-border mx-2" />

      {/* Undo/Redo */}
      <button
        onClick={undo}
        title="Undo (Ctrl+Z)"
        className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        onClick={redo}
        title="Redo (Ctrl+Y)"
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

      {/* Selection count badge */}
      {selectedIds.length > 1 && (
        <span className="h-6 px-2 rounded-full bg-primary/10 text-primary text-[10px] font-semibold flex items-center mr-2">
          {selectedIds.length} selected
        </span>
      )}

      {/* Delete selected */}
      {selectedIds.length > 0 && (
        <button
          onClick={deleteSelection}
          title="Delete (Del)"
          className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* Save as Template */}
      {onSaveTemplate && (
        <button
          onClick={onSaveTemplate}
          title="Save as Template"
          className="h-8 px-3 rounded-md flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          Save Template
        </button>
      )}

      {/* AI Agent toggle */}
      {onToggleAi && (
        <button
          onClick={onToggleAi}
          title="Design Agent (Ctrl+J)"
          className={cn(
            "h-8 px-3 rounded-md flex items-center gap-1.5 text-xs font-medium transition-colors",
            showAi
              ? "bg-violet-500/15 text-violet-400"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Agent
        </button>
      )}

      <div className="w-px h-5 bg-border mx-1" />

      {/* Export dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowExportMenu((v) => !v)}
          title="Export design"
          className={cn(
            "h-8 px-3 rounded-md flex items-center gap-1.5 text-xs font-medium transition-colors",
            showExportMenu
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Download className="w-3.5 h-3.5" />
          Export
          <ChevronDown className="w-3 h-3 opacity-50" />
        </button>

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
