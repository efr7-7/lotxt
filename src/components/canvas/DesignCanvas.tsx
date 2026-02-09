import { useRef, useEffect } from "react";
import { Stage, Layer, Rect, Circle, Text, Transformer } from "react-konva";
import type Konva from "konva";
import { useCanvasStore } from "@/stores/canvas-store";
import type { CanvasElement } from "@/types/canvas";

export function DesignCanvas() {
  const {
    elements,
    selectedId,
    setSelectedId,
    updateElement,
    canvasSize,
    pushHistory,
  } = useCanvasStore();

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // Update transformer when selection changes
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;

    if (selectedId) {
      const node = stage.findOne("#" + selectedId);
      if (node) {
        transformer.nodes([node]);
        transformer.getLayer()?.batchDraw();
      }
    } else {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedId]);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Clicked on empty area
    if (e.target === stageRef.current) {
      setSelectedId(null);
    }
  };

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    updateElement(id, {
      x: e.target.x(),
      y: e.target.y(),
    });
    pushHistory();
  };

  const handleTransformEnd = (id: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    updateElement(id, {
      x: node.x(),
      y: node.y(),
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
    const commonProps = {
      id: el.id,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      rotation: el.rotation,
      opacity: el.opacity,
      draggable: true,
      onClick: () => setSelectedId(el.id),
      onTap: () => setSelectedId(el.id),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(el.id, e),
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) => handleTransformEnd(el.id, e),
    };

    switch (el.type) {
      case "rect":
        return (
          <Rect
            key={el.id}
            {...commonProps}
            fill={el.fill}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            cornerRadius={el.cornerRadius}
          />
        );
      case "circle":
        return (
          <Circle
            key={el.id}
            {...commonProps}
            radius={Math.min(el.width, el.height) / 2}
            fill={el.fill}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
          />
        );
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
          />
        );
      default:
        return null;
    }
  };

  return (
    <Stage
      ref={stageRef}
      width={canvasSize.width}
      height={canvasSize.height}
      onClick={handleStageClick}
      style={{
        backgroundColor: "#ffffff",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        borderRadius: "4px",
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

        {/* All elements */}
        {elements.map(renderElement)}

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
  );
}
