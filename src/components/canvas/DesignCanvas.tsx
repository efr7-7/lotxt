import { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Layer, Rect, Circle, Text, Image as KonvaImage, Line, Arrow as KonvaArrow, RegularPolygon, Star as KonvaStar, Transformer } from "react-konva";
import type Konva from "konva";
import { useCanvasStore } from "@/stores/canvas-store";
import type { CanvasElement, ImageElement, GradientConfig, ArrowElement } from "@/types/canvas";

/* ─── Hook: load an image source into an HTMLImageElement ─── */
function useImage(src: string | undefined): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return image;
}

/* ─── Individual image element renderer ─── */
function CanvasImageElement({
  el,
  commonProps,
}: {
  el: ImageElement;
  commonProps: Record<string, any>;
}) {
  const image = useImage(el.src);

  if (!image) {
    // Placeholder while loading
    return (
      <Rect
        {...commonProps}
        fill="#1a1a2e"
        stroke="#333"
        strokeWidth={1}
        dash={[4, 4]}
        cornerRadius={4}
      />
    );
  }

  return (
    <KonvaImage
      {...commonProps}
      image={image}
    />
  );
}

/* ─── Convert GradientConfig to Konva linear gradient props ─── */
function getGradientProps(gradient: GradientConfig | undefined, width: number, height: number) {
  if (!gradient?.enabled) return null;

  const rad = (gradient.angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const halfW = width / 2;
  const halfH = height / 2;

  return {
    fillLinearGradientStartPoint: { x: halfW - cos * halfW, y: halfH - sin * halfH },
    fillLinearGradientEndPoint: { x: halfW + cos * halfW, y: halfH + sin * halfH },
    fillLinearGradientColorStops: [0, gradient.colorStops[0], 1, gradient.colorStops[1]],
  };
}

/* ─── Grid overlay component ─── */
function GridOverlay({ width, height, gridSize }: { width: number; height: number; gridSize: number }) {
  const dots: { x: number; y: number }[] = [];
  for (let x = gridSize; x < width; x += gridSize) {
    for (let y = gridSize; y < height; y += gridSize) {
      dots.push({ x, y });
    }
  }
  return (
    <>
      {dots.map((dot, i) => (
        <Circle
          key={i}
          x={dot.x}
          y={dot.y}
          radius={0.8}
          fill="rgba(150,150,150,0.3)"
          listening={false}
        />
      ))}
    </>
  );
}

/* ─── Marquee selection rectangle ─── */
interface MarqueeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function DesignCanvas() {
  const {
    elements,
    selectedIds,
    setSelectedId,
    addToSelection,
    toggleSelection,
    selectMultiple,
    clearSelection,
    updateElement,
    canvasSize,
    pushHistory,
    tool,
    setTool,
    addElement,
    snapToGrid,
    gridSize,
    showGrid,
    copySelection,
    pasteClipboard,
    duplicateSelection,
    deleteSelection,
    undo,
    redo,
  } = useCanvasStore();

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Marquee state
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null);
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingMarquee = useRef(false);

  // Line drawing state
  const [lineStart, setLineStart] = useState<{ x: number; y: number } | null>(null);

  // Update transformer when selection changes
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;

    if (selectedIds.length > 0) {
      const nodes = selectedIds
        .map((id) => stage.findOne("#" + id))
        .filter(Boolean) as Konva.Node[];
      transformer.nodes(nodes);
      transformer.getLayer()?.batchDraw();
    } else {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedIds, elements]);

  // ─── Keyboard Shortcuts ───
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      const ctrl = e.ctrlKey || e.metaKey;

      // Tool shortcuts
      if (!ctrl && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case "v": setTool("select"); return;
          case "r": setTool("rect"); return;
          case "c": setTool("circle"); return;
          case "t": setTool("text"); return;
          case "l": setTool("line"); return;
          case "i": setTool("image"); return;
          case "a": setTool("arrow"); return;
          case "s": setTool("star"); return;
          case "p": setTool("polygon"); return;
          case "delete":
          case "backspace":
            if (selectedIds.length > 0) {
              e.preventDefault();
              deleteSelection();
            }
            return;
          case "escape":
            clearSelection();
            setTool("select");
            setLineStart(null);
            return;
        }
      }

      // Ctrl shortcuts
      if (ctrl) {
        switch (e.key.toLowerCase()) {
          case "c":
            e.preventDefault();
            copySelection();
            return;
          case "v":
            e.preventDefault();
            pasteClipboard();
            return;
          case "d":
            e.preventDefault();
            duplicateSelection();
            return;
          case "a":
            e.preventDefault();
            selectMultiple(elements.map((el) => el.id));
            return;
          case "z":
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
            return;
          case "y":
            e.preventDefault();
            redo();
            return;
        }
      }
    },
    [
      setTool, selectedIds, deleteSelection, clearSelection,
      copySelection, pasteClipboard, duplicateSelection,
      selectMultiple, elements, undo, redo,
    ],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ─── Snap helper ───
  const snapValue = (val: number) => {
    if (!snapToGrid) return val;
    return Math.round(val / gridSize) * gridSize;
  };

  // ─── Stage click: deselect, marquee start, or line/arrow tool ───
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // If using line or arrow tool, start drawing
    if (tool === "line" || tool === "arrow") {
      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (pos) {
        setLineStart({ x: snapValue(pos.x), y: snapValue(pos.y) });
      }
      return;
    }

    // Only handle select tool for marquee
    if (tool !== "select") return;

    // Clicked on empty area (stage itself)
    if (e.target === stageRef.current) {
      if (!e.evt.shiftKey) {
        clearSelection();
      }
      // Start marquee
      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (pos) {
        marqueeStartRef.current = { x: pos.x, y: pos.y };
        isDraggingMarquee.current = false;
      }
    }
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Line tool preview is handled via lineStart state — we could add preview here
    if (tool !== "select") return;
    if (!marqueeStartRef.current) return;

    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    isDraggingMarquee.current = true;
    const start = marqueeStartRef.current;
    setMarquee({
      x: Math.min(start.x, pos.x),
      y: Math.min(start.y, pos.y),
      width: Math.abs(pos.x - start.x),
      height: Math.abs(pos.y - start.y),
    });
  };

  const handleStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Line or Arrow tool: complete the element
    if ((tool === "line" || tool === "arrow") && lineStart) {
      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (pos) {
        const endX = snapValue(pos.x);
        const endY = snapValue(pos.y);
        // Only create if dragged some distance
        if (Math.abs(endX - lineStart.x) > 3 || Math.abs(endY - lineStart.y) > 3) {
          const minX = Math.min(lineStart.x, endX);
          const minY = Math.min(lineStart.y, endY);

          if (tool === "arrow") {
            addElement({
              id: crypto.randomUUID(),
              type: "arrow",
              x: minX,
              y: minY,
              width: Math.abs(endX - lineStart.x) || 1,
              height: Math.abs(endY - lineStart.y) || 1,
              rotation: 0,
              opacity: 1,
              name: "Arrow",
              points: [lineStart.x - minX, lineStart.y - minY, endX - minX, endY - minY],
              stroke: "#09090b",
              fill: "#09090b",
              strokeWidth: 2,
              pointerLength: 15,
              pointerWidth: 15,
            });
          } else {
            addElement({
              id: crypto.randomUUID(),
              type: "line",
              x: minX,
              y: minY,
              width: Math.abs(endX - lineStart.x) || 1,
              height: Math.abs(endY - lineStart.y) || 1,
              rotation: 0,
              opacity: 1,
              name: "Line",
              points: [lineStart.x - minX, lineStart.y - minY, endX - minX, endY - minY],
              stroke: "#09090b",
              strokeWidth: 2,
            });
          }
        }
      }
      setLineStart(null);
      setTool("select");
      return;
    }

    // Marquee selection completion
    if (marqueeStartRef.current && isDraggingMarquee.current && marquee) {
      // Find elements inside marquee
      const inside = elements.filter((el) => {
        const elRight = el.x + el.width;
        const elBottom = el.y + el.height;
        const mRight = marquee.x + marquee.width;
        const mBottom = marquee.y + marquee.height;
        // Element must overlap with marquee
        return (
          el.x < mRight &&
          elRight > marquee.x &&
          el.y < mBottom &&
          elBottom > marquee.y
        );
      });

      if (inside.length > 0) {
        if (e.evt.shiftKey) {
          // Add to existing selection
          const newIds = new Set(selectedIds);
          inside.forEach((el) => newIds.add(el.id));
          selectMultiple(Array.from(newIds));
        } else {
          selectMultiple(inside.map((el) => el.id));
        }
      }
    }

    marqueeStartRef.current = null;
    isDraggingMarquee.current = false;
    setMarquee(null);
  };

  // ─── Element interaction ───
  const handleElementClick = (id: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    if (e.evt.shiftKey) {
      toggleSelection(id);
    } else {
      setSelectedId(id);
    }
  };

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    updateElement(id, {
      x: snapValue(e.target.x()),
      y: snapValue(e.target.y()),
    });
    pushHistory();
  };

  const handleTransformEnd = (id: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    updateElement(id, {
      x: snapValue(node.x()),
      y: snapValue(node.y()),
      width: Math.max(5, node.width() * node.scaleX()),
      height: Math.max(5, node.height() * node.scaleY()),
      rotation: node.rotation(),
    });
    // Reset scale
    node.scaleX(1);
    node.scaleY(1);
    pushHistory();
  };

  const renderElement = (el: CanvasElement) => {
    // Skip invisible elements
    if (el.visible === false) return null;

    const isLocked = el.locked === true;

    const commonProps = {
      id: el.id,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      rotation: el.rotation,
      opacity: el.opacity,
      draggable: !isLocked,
      onClick: (e: Konva.KonvaEventObject<MouseEvent>) => handleElementClick(el.id, e),
      onTap: () => setSelectedId(el.id),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(el.id, e),
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) => handleTransformEnd(el.id, e),
    };

    switch (el.type) {
      case "rect": {
        const gradientProps = getGradientProps(el.gradient, el.width, el.height);
        return (
          <Rect
            key={el.id}
            {...commonProps}
            fill={gradientProps ? undefined : el.fill}
            {...gradientProps}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            cornerRadius={el.cornerRadius}
          />
        );
      }
      case "circle": {
        const r = Math.min(el.width, el.height) / 2;
        const gradientProps = getGradientProps(el.gradient, r * 2, r * 2);
        return (
          <Circle
            key={el.id}
            {...commonProps}
            radius={r}
            fill={gradientProps ? undefined : el.fill}
            {...gradientProps}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
          />
        );
      }
      case "text":
        return (
          <Text
            key={el.id}
            {...commonProps}
            text={el.text}
            fontSize={el.fontSize}
            fontFamily={el.fontFamily}
            fill={el.fill}
            fontStyle={el.fontStyle}
            align={el.align as any}
            letterSpacing={el.letterSpacing}
            lineHeight={el.lineHeight}
            textDecoration={el.textDecoration || ""}
            shadowColor={el.shadowColor}
            shadowBlur={el.shadowBlur}
            shadowOffsetX={el.shadowOffsetX}
            shadowOffsetY={el.shadowOffsetY}
            stroke={el.strokeColor}
            strokeWidth={el.textStrokeWidth}
          />
        );
      case "image":
        return (
          <CanvasImageElement
            key={el.id}
            el={el}
            commonProps={commonProps}
          />
        );
      case "triangle": {
        const radius = Math.min(el.width, el.height) / 2;
        const gradientProps = getGradientProps(el.gradient, radius * 2, radius * 2);
        return (
          <RegularPolygon
            key={el.id}
            {...commonProps}
            sides={el.sides || 3}
            radius={radius}
            fill={gradientProps ? undefined : el.fill}
            {...gradientProps}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
          />
        );
      }
      case "star": {
        const outerRadius = Math.min(el.width, el.height) / 2;
        const inner = outerRadius * (el.innerRadius || 0.4);
        const gradientProps = getGradientProps(el.gradient, outerRadius * 2, outerRadius * 2);
        return (
          <KonvaStar
            key={el.id}
            {...commonProps}
            numPoints={el.numPoints || 5}
            innerRadius={inner}
            outerRadius={outerRadius}
            fill={gradientProps ? undefined : el.fill}
            {...gradientProps}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
          />
        );
      }
      case "polygon": {
        const polyRadius = Math.min(el.width, el.height) / 2;
        const gradientProps = getGradientProps(el.gradient, polyRadius * 2, polyRadius * 2);
        return (
          <RegularPolygon
            key={el.id}
            {...commonProps}
            sides={el.sides || 6}
            radius={polyRadius}
            fill={gradientProps ? undefined : el.fill}
            {...gradientProps}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
          />
        );
      }
      case "arrow":
        return (
          <KonvaArrow
            key={el.id}
            id={el.id}
            x={el.x}
            y={el.y}
            points={el.points}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            fill={el.fill}
            pointerLength={el.pointerLength || 15}
            pointerWidth={el.pointerWidth || 15}
            rotation={el.rotation}
            opacity={el.opacity}
            draggable={!isLocked}
            onClick={(e: Konva.KonvaEventObject<MouseEvent>) => handleElementClick(el.id, e)}
            onTap={() => setSelectedId(el.id)}
            onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(el.id, e)}
            hitStrokeWidth={10}
          />
        );
      case "line":
        return (
          <Line
            key={el.id}
            id={el.id}
            x={el.x}
            y={el.y}
            points={el.points}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            rotation={el.rotation}
            opacity={el.opacity}
            draggable={!isLocked}
            onClick={(e: Konva.KonvaEventObject<MouseEvent>) => handleElementClick(el.id, e)}
            onTap={() => setSelectedId(el.id)}
            onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(el.id, e)}
            hitStrokeWidth={10}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Stage
        ref={stageRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        style={{
          backgroundColor: "#ffffff",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          borderRadius: "4px",
          cursor: tool === "line" || tool === "arrow" ? "crosshair" : tool === "select" ? "default" : "crosshair",
        }}
      >
        <Layer>
          {/* Canvas background */}
          <Rect
            x={0}
            y={0}
            width={canvasSize.width}
            height={canvasSize.height}
            fill="#ffffff"
            listening={false}
          />

          {/* Grid overlay */}
          {showGrid && (
            <GridOverlay
              width={canvasSize.width}
              height={canvasSize.height}
              gridSize={gridSize}
            />
          )}

          {/* All elements */}
          {elements.map(renderElement)}

          {/* Marquee selection rect */}
          {marquee && (
            <Rect
              x={marquee.x}
              y={marquee.y}
              width={marquee.width}
              height={marquee.height}
              fill="rgba(99, 102, 241, 0.08)"
              stroke="rgba(99, 102, 241, 0.5)"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
            />
          )}

          {/* Selection transformer */}
          <Transformer
            ref={transformerRef}
            borderStroke="hsl(238, 84%, 67%)"
            anchorStroke="hsl(238, 84%, 67%)"
            anchorFill="white"
            anchorSize={8}
            anchorCornerRadius={2}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) return oldBox;
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
}
