export type CanvasElementType = "rect" | "circle" | "text" | "image";
export type CanvasTool = "select" | "rect" | "circle" | "text" | "image";

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
}

export interface RectElement extends CanvasElementBase {
  type: "rect";
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
}

export interface CircleElement extends CanvasElementBase {
  type: "circle";
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface TextElement extends CanvasElementBase {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  fontStyle: string;
  align: string;
}

export interface ImageElement extends CanvasElementBase {
  type: "image";
  src: string;
}

export type CanvasElement =
  | RectElement
  | CircleElement
  | TextElement
  | ImageElement;

export interface CanvasPreset {
  id: string;
  label: string;
  width: number;
  height: number;
}
