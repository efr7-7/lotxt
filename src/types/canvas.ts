export type CanvasElementType = "rect" | "circle" | "text" | "image" | "line" | "triangle" | "star" | "arrow" | "polygon";
export type CanvasTool = "select" | "rect" | "circle" | "text" | "image" | "line" | "triangle" | "star" | "arrow" | "polygon";

export interface CanvasElementBase {
  id: string;
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  name: string;
  locked?: boolean;
  visible?: boolean;
  groupId?: string;
}

/* ─── Gradient support for shapes ─── */
export interface GradientConfig {
  enabled: boolean;
  type: "linear";
  colorStops: [string, string]; // [start, end]
  angle: number; // 0-360 degrees
}

export interface RectElement extends CanvasElementBase {
  type: "rect";
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
  gradient?: GradientConfig;
}

export interface CircleElement extends CanvasElementBase {
  type: "circle";
  fill: string;
  stroke: string;
  strokeWidth: number;
  gradient?: GradientConfig;
}

export interface TriangleElement extends CanvasElementBase {
  type: "triangle";
  fill: string;
  stroke: string;
  strokeWidth: number;
  sides: number; // 3 for triangle, can be used for polygons
  gradient?: GradientConfig;
}

export interface StarElement extends CanvasElementBase {
  type: "star";
  fill: string;
  stroke: string;
  strokeWidth: number;
  numPoints: number; // number of star points (5 default)
  innerRadius: number; // inner radius ratio (0-1)
  gradient?: GradientConfig;
}

export interface ArrowElement extends CanvasElementBase {
  type: "arrow";
  points: number[]; // [x1, y1, x2, y2]
  stroke: string;
  strokeWidth: number;
  fill: string;
  pointerLength: number;
  pointerWidth: number;
}

export interface PolygonElement extends CanvasElementBase {
  type: "polygon";
  fill: string;
  stroke: string;
  strokeWidth: number;
  sides: number; // 5=pentagon, 6=hexagon, 8=octagon, etc.
  gradient?: GradientConfig;
}

export interface TextElement extends CanvasElementBase {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  fontStyle: string; // "normal" | "bold" | "italic" | "bold italic"
  align: string;
  // Extended text effects
  letterSpacing?: number;
  lineHeight?: number;
  textDecoration?: string; // "none" | "underline" | "line-through"
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  strokeColor?: string;    // Text outline color
  textStrokeWidth?: number; // Text outline width
}

export interface ImageElement extends CanvasElementBase {
  type: "image";
  src: string;
}

export interface LineElement extends CanvasElementBase {
  type: "line";
  points: number[]; // [x1, y1, x2, y2, ...]
  stroke: string;
  strokeWidth: number;
}

export type CanvasElement =
  | RectElement
  | CircleElement
  | TriangleElement
  | StarElement
  | ArrowElement
  | PolygonElement
  | TextElement
  | ImageElement
  | LineElement;

export interface CanvasPreset {
  id: string;
  label: string;
  width: number;
  height: number;
}
