import { useState } from "react";
import { useCanvasStore } from "@/stores/canvas-store";
import type { GradientConfig } from "@/types/canvas";
import {
  ChevronDown,
  ChevronRight,
  Move,
  Paintbrush,
  PenTool,
  Type,
  Sparkles,
  Image as ImageIcon,
  MousePointer2,
  Maximize2,
  Eye,
  Lock,
  CircleDot,
} from "lucide-react";

/* ---- Google Fonts list (loaded via <link> or local) ---- */
const GOOGLE_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Montserrat",
  "Poppins",
  "Lato",
  "Oswald",
  "Raleway",
  "Merriweather",
  "Nunito",
  "Source Sans 3",
  "Ubuntu",
  "Rubik",
  "Work Sans",
  "DM Sans",
  "Space Grotesk",
  "Bricolage Grotesque",
  "Outfit",
  "Plus Jakarta Sans",
  "Geist",
];

const SYSTEM_FONTS = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "system-ui",
];

const FONT_WEIGHTS = [
  { value: "100", label: "Thin" },
  { value: "200", label: "Extra Light" },
  { value: "300", label: "Light" },
  { value: "normal", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "bold", label: "Bold" },
  { value: "800", label: "Extra Bold" },
  { value: "900", label: "Black" },
];

/* ---- Collapsible section ---- */
function Section({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon?: typeof Move;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/30 last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-1.5 px-3 py-2 hover:bg-accent/30 transition-colors"
      >
        {open ? (
          <ChevronDown className="w-3 h-3 text-muted-foreground/40 shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
        )}
        {Icon && <Icon className="w-3 h-3 text-muted-foreground/50 shrink-0" />}
        <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
          {title}
        </span>
      </button>
      {open && <div className="px-3 pb-3 space-y-2.5">{children}</div>}
    </div>
  );
}

export function PropertyPanel() {
  const { elements, selectedIds, updateElement } = useCanvasStore();

  // Multi-select: get all selected elements
  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  const element = selectedElements.length === 1 ? selectedElements[0] : null;
  const isMulti = selectedElements.length > 1;

  if (selectedElements.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {/* Panel header */}
        <div className="px-3 py-2.5 border-b border-border/30">
          <h3 className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
            Properties
          </h3>
        </div>
        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mb-3">
            <MousePointer2 className="w-5 h-5 text-muted-foreground/20" />
          </div>
          <p className="text-[11px] text-muted-foreground/40 text-center leading-relaxed">
            Select an element to view and edit its properties
          </p>
        </div>
      </div>
    );
  }

  // For multi-select, update all selected
  const update = (changes: Record<string, unknown>) => {
    for (const el of selectedElements) {
      updateElement(el.id, changes);
    }
  };

  // Check if all selected share the same type
  const allSameType = selectedElements.every((el) => el.type === selectedElements[0].type);
  const sharedType = allSameType ? selectedElements[0].type : null;

  // Get a shared value (if all same, return it; otherwise placeholder)
  const getShared = <T,>(getter: (el: (typeof selectedElements)[0]) => T): T | undefined => {
    if (selectedElements.length === 0) return undefined;
    const first = getter(selectedElements[0]);
    if (selectedElements.every((el) => getter(el) === first)) return first;
    return undefined;
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Panel header */}
      <div className="px-3 py-2.5 border-b border-border/30 flex items-center justify-between shrink-0">
        <h3 className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
          Properties
        </h3>
        {isMulti && (
          <span className="text-[9px] text-primary font-medium px-1.5 py-0.5 rounded-md bg-primary/10">
            {selectedElements.length} elements
          </span>
        )}
      </div>

      {/* Name -- single select only */}
      {element && (
        <div className="px-3 py-2.5 border-b border-border/30">
          <input
            value={element.name}
            onChange={(e) => updateElement(element.id, { name: e.target.value })}
            className="w-full bg-transparent text-[12px] font-medium text-foreground outline-none placeholder:text-muted-foreground/30 border-b border-transparent focus:border-primary/30 transition-colors pb-0.5"
            placeholder="Element name"
          />
          <span className="text-[9px] text-muted-foreground/30 mt-0.5 block capitalize">{element.type}</span>
        </div>
      )}

      {/* Transform section */}
      <Section title="Transform" icon={Move}>
        {/* Position -- single select only */}
        {element && (
          <div className="grid grid-cols-2 gap-2">
            <PropField label="X">
              <NumberInput value={element.x} onChange={(v) => update({ x: v })} />
            </PropField>
            <PropField label="Y">
              <NumberInput value={element.y} onChange={(v) => update({ y: v })} />
            </PropField>
          </div>
        )}

        {/* Size -- single select only */}
        {element && (
          <div className="grid grid-cols-2 gap-2">
            <PropField label="W">
              <NumberInput value={element.width} onChange={(v) => update({ width: v })} />
            </PropField>
            <PropField label="H">
              <NumberInput value={element.height} onChange={(v) => update({ height: v })} />
            </PropField>
          </div>
        )}

        {/* Rotation */}
        <PropField label="Rotation">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={getShared((el) => el.rotation) ?? 0}
              onChange={(e) => update({ rotation: Number(e.target.value) })}
              className="flex-1 h-1 rounded-full accent-primary"
            />
            <span className="text-[10px] font-mono text-muted-foreground/50 w-8 text-right">
              {Math.round(getShared((el) => el.rotation) ?? 0)}°
            </span>
          </div>
        </PropField>

        {/* Opacity */}
        <PropField label="Opacity">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={getShared((el) => el.opacity) ?? 1}
              onChange={(e) => update({ opacity: Number(e.target.value) })}
              className="flex-1 h-1 rounded-full accent-primary"
            />
            <span className="text-[10px] font-mono text-muted-foreground/50 w-8 text-right">
              {Math.round((getShared((el) => el.opacity) ?? 1) * 100)}%
            </span>
          </div>
        </PropField>

        {/* Lock controls */}
        <div className="flex items-center gap-3 pt-0.5">
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={selectedElements.every((el) => el.locked)}
              onChange={(e) => update({ locked: e.target.checked })}
              className="w-3 h-3 rounded border-border accent-primary"
            />
            <Lock className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors" />
            <span className="text-[9px] text-muted-foreground/40">Lock</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={selectedElements.every((el) => el.visible === false)}
              onChange={(e) => update({ visible: !e.target.checked })}
              className="w-3 h-3 rounded border-border accent-primary"
            />
            <Eye className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors" />
            <span className="text-[9px] text-muted-foreground/40">Hide</span>
          </label>
        </div>
      </Section>

      {/* Fill section */}
      {(element ? "fill" in element : sharedType && sharedType !== "image" && sharedType !== "line") && (
        <Section title="Fill" icon={Paintbrush}>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="color"
                value={getShared((el) => ("fill" in el ? (el as any).fill : "")) || "#000000"}
                onChange={(e) => update({ fill: e.target.value })}
                className="w-8 h-8 rounded-lg border border-border/40 cursor-pointer bg-transparent p-0.5"
              />
            </div>
            <input
              value={getShared((el) => ("fill" in el ? (el as any).fill : "")) || ""}
              onChange={(e) => update({ fill: e.target.value })}
              className="flex-1 rounded-lg border border-border/30 bg-background/50 px-2 py-1.5 text-[11px] font-mono text-foreground outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-colors"
              placeholder="#000000"
            />
          </div>
        </Section>
      )}

      {/* Stroke section */}
      {(element ? "stroke" in element : sharedType && sharedType !== "image") && (
        <Section title="Stroke" icon={PenTool}>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="color"
                value={getShared((el) => ("stroke" in el ? (el as any).stroke : "")) || "#000000"}
                onChange={(e) => update({ stroke: e.target.value })}
                className="w-8 h-8 rounded-lg border border-border/40 cursor-pointer bg-transparent p-0.5"
              />
            </div>
            <NumberInput
              value={getShared((el) => ("strokeWidth" in el ? (el as any).strokeWidth : 0)) ?? 0}
              onChange={(v) => update({ strokeWidth: v })}
              min={0}
            />
          </div>
        </Section>
      )}

      {/* Corner radius for rects */}
      {(element?.type === "rect" || sharedType === "rect") && (
        <Section title="Shape" icon={Maximize2} defaultOpen={true}>
          <PropField label="Corner Radius">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={getShared((el) => el.type === "rect" ? el.cornerRadius : 0) ?? 0}
                onChange={(e) => update({ cornerRadius: Number(e.target.value) })}
                className="flex-1 h-1 rounded-full accent-primary"
              />
              <span className="text-[10px] font-mono text-muted-foreground/50 w-6 text-right">
                {getShared((el) => el.type === "rect" ? el.cornerRadius : 0) ?? 0}
              </span>
            </div>
          </PropField>
        </Section>
      )}

      {/* Star-specific: points and inner radius */}
      {(element?.type === "star" || sharedType === "star") && (
        <Section title="Star" icon={CircleDot}>
          <PropField label="Points">
            <NumberInput
              value={getShared((el) => el.type === "star" ? el.numPoints : 5) ?? 5}
              onChange={(v) => update({ numPoints: v })}
              min={3}
              max={20}
            />
          </PropField>
          <PropField label="Inner Radius">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={getShared((el) => el.type === "star" ? el.innerRadius : 0.4) ?? 0.4}
                onChange={(e) => update({ innerRadius: Number(e.target.value) })}
                className="flex-1 h-1 rounded-full accent-primary"
              />
              <span className="text-[10px] font-mono text-muted-foreground/50 w-6 text-right">
                {((getShared((el) => el.type === "star" ? el.innerRadius : 0.4) ?? 0.4) * 100).toFixed(0)}%
              </span>
            </div>
          </PropField>
        </Section>
      )}

      {/* Polygon-specific: sides count */}
      {(element?.type === "polygon" || sharedType === "polygon") && (
        <Section title="Polygon" icon={Maximize2}>
          <PropField label="Sides">
            <NumberInput
              value={getShared((el) => el.type === "polygon" ? el.sides : 6) ?? 6}
              onChange={(v) => update({ sides: v })}
              min={3}
              max={20}
            />
          </PropField>
        </Section>
      )}

      {/* Arrow-specific */}
      {(element?.type === "arrow" || sharedType === "arrow") && (
        <Section title="Arrow" icon={PenTool}>
          <PropField label="Pointer Length">
            <NumberInput
              value={getShared((el) => el.type === "arrow" ? el.pointerLength : 15) ?? 15}
              onChange={(v) => update({ pointerLength: v })}
              min={5}
              max={50}
            />
          </PropField>
          <PropField label="Pointer Width">
            <NumberInput
              value={getShared((el) => el.type === "arrow" ? el.pointerWidth : 15) ?? 15}
              onChange={(v) => update({ pointerWidth: v })}
              min={5}
              max={50}
            />
          </PropField>
        </Section>
      )}

      {/* Gradient -- for rect, circle, triangle, star, polygon */}
      {element && (element.type === "rect" || element.type === "circle" || element.type === "triangle" || element.type === "star" || element.type === "polygon") && (
        <Section title="Gradient" icon={Paintbrush} defaultOpen={element.gradient?.enabled ?? false}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={element.gradient?.enabled ?? false}
              onChange={(e) => {
                const grad: GradientConfig = element.gradient ?? {
                  enabled: false,
                  type: "linear",
                  colorStops: ["#7c3aed", "#ec4899"],
                  angle: 90,
                };
                update({ gradient: { ...grad, enabled: e.target.checked } });
              }}
              className="w-3 h-3 rounded border-border accent-primary"
            />
            <span className="text-[10px] text-muted-foreground/50">Enable gradient</span>
          </label>
          {element.gradient?.enabled && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <PropField label="Start">
                  <input
                    type="color"
                    value={element.gradient.colorStops[0]}
                    onChange={(e) => update({
                      gradient: {
                        ...element.gradient!,
                        colorStops: [e.target.value, element.gradient!.colorStops[1]],
                      },
                    })}
                    className="w-full h-7 rounded-lg border border-border/40 cursor-pointer bg-transparent p-0.5"
                  />
                </PropField>
                <PropField label="End">
                  <input
                    type="color"
                    value={element.gradient.colorStops[1]}
                    onChange={(e) => update({
                      gradient: {
                        ...element.gradient!,
                        colorStops: [element.gradient!.colorStops[0], e.target.value],
                      },
                    })}
                    className="w-full h-7 rounded-lg border border-border/40 cursor-pointer bg-transparent p-0.5"
                  />
                </PropField>
              </div>
              <PropField label="Angle">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={element.gradient.angle}
                    onChange={(e) => update({
                      gradient: { ...element.gradient!, angle: Number(e.target.value) },
                    })}
                    className="flex-1 h-1 rounded-full accent-primary"
                  />
                  <span className="text-[10px] font-mono text-muted-foreground/50 w-8 text-right">
                    {element.gradient.angle}°
                  </span>
                </div>
              </PropField>
            </>
          )}
        </Section>
      )}

      {/* Text-specific */}
      {(element?.type === "text" || sharedType === "text") && (
        <>
          <Section title="Text" icon={Type}>
            {/* Text content -- single only */}
            {element?.type === "text" && (
              <textarea
                value={element.text}
                onChange={(e) => update({ text: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-border/30 bg-background/50 px-2.5 py-1.5 text-[11px] text-foreground outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/30 resize-none transition-colors"
              />
            )}

            <PropField label="Font Size">
              <NumberInput
                value={getShared((el) => el.type === "text" ? el.fontSize : 0) ?? 32}
                onChange={(v) => update({ fontSize: v })}
                min={1}
              />
            </PropField>

            <PropField label="Font Family">
              <select
                value={getShared((el) => el.type === "text" ? el.fontFamily : "") ?? "Inter"}
                onChange={(e) => update({ fontFamily: e.target.value })}
                className="w-full rounded-lg border border-border/30 bg-background/50 px-2 py-1.5 text-[11px] text-foreground outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-colors"
              >
                <optgroup label="Google Fonts">
                  {GOOGLE_FONTS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </optgroup>
                <optgroup label="System Fonts">
                  {SYSTEM_FONTS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </optgroup>
              </select>
            </PropField>

            <div className="grid grid-cols-2 gap-2">
              <PropField label="Weight">
                <select
                  value={getShared((el) => el.type === "text" ? el.fontStyle : "") ?? "normal"}
                  onChange={(e) => update({ fontStyle: e.target.value })}
                  className="w-full rounded-lg border border-border/30 bg-background/50 px-2 py-1.5 text-[11px] text-foreground outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-colors"
                >
                  {FONT_WEIGHTS.map((fw) => (
                    <option key={fw.value} value={fw.value}>{fw.label}</option>
                  ))}
                </select>
              </PropField>

              <PropField label="Align">
                <select
                  value={getShared((el) => el.type === "text" ? el.align : "") ?? "left"}
                  onChange={(e) => update({ align: e.target.value })}
                  className="w-full rounded-lg border border-border/30 bg-background/50 px-2 py-1.5 text-[11px] text-foreground outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-colors"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </PropField>
            </div>
          </Section>

          {/* Extended text effects -- single only */}
          {element?.type === "text" && (
            <Section title="Text Effects" icon={Sparkles} defaultOpen={false}>
              <div className="grid grid-cols-2 gap-2">
                <PropField label="Letter Spacing">
                  <NumberInput
                    value={element.letterSpacing ?? 0}
                    onChange={(v) => update({ letterSpacing: v })}
                    step={0.5}
                  />
                </PropField>
                <PropField label="Line Height">
                  <NumberInput
                    value={element.lineHeight ?? 1}
                    onChange={(v) => update({ lineHeight: v })}
                    min={0.5}
                    max={3}
                    step={0.1}
                  />
                </PropField>
              </div>
              <PropField label="Decoration">
                <select
                  value={element.textDecoration ?? "none"}
                  onChange={(e) => update({ textDecoration: e.target.value })}
                  className="w-full rounded-lg border border-border/30 bg-background/50 px-2 py-1.5 text-[11px] text-foreground outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-colors"
                >
                  <option value="">None</option>
                  <option value="underline">Underline</option>
                  <option value="line-through">Strikethrough</option>
                </select>
              </PropField>

              {/* Text Shadow */}
              <PropField label="Shadow">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={element.shadowColor ?? "#000000"}
                      onChange={(e) => update({ shadowColor: e.target.value })}
                      className="w-8 h-8 rounded-lg border border-border/40 cursor-pointer bg-transparent p-0.5"
                    />
                    <NumberInput
                      value={element.shadowBlur ?? 0}
                      onChange={(v) => update({ shadowBlur: v })}
                      min={0}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <PropField label="Shadow X">
                      <NumberInput
                        value={element.shadowOffsetX ?? 0}
                        onChange={(v) => update({ shadowOffsetX: v })}
                      />
                    </PropField>
                    <PropField label="Shadow Y">
                      <NumberInput
                        value={element.shadowOffsetY ?? 0}
                        onChange={(v) => update({ shadowOffsetY: v })}
                      />
                    </PropField>
                  </div>
                </div>
              </PropField>

              {/* Text Outline */}
              <PropField label="Text Outline">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={element.strokeColor ?? "#000000"}
                    onChange={(e) => update({ strokeColor: e.target.value })}
                    className="w-8 h-8 rounded-lg border border-border/40 cursor-pointer bg-transparent p-0.5"
                  />
                  <NumberInput
                    value={element.textStrokeWidth ?? 0}
                    onChange={(v) => update({ textStrokeWidth: v })}
                    min={0}
                  />
                </div>
              </PropField>
            </Section>
          )}
        </>
      )}

      {/* Line-specific */}
      {(element?.type === "line" || sharedType === "line") && (
        <Section title="Line" icon={PenTool}>
          <PropField label="Stroke Color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={getShared((el) => el.type === "line" ? el.stroke : "") || "#000000"}
                onChange={(e) => update({ stroke: e.target.value })}
                className="w-8 h-8 rounded-lg border border-border/40 cursor-pointer bg-transparent p-0.5"
              />
              <input
                value={getShared((el) => el.type === "line" ? el.stroke : "") || ""}
                onChange={(e) => update({ stroke: e.target.value })}
                className="flex-1 rounded-lg border border-border/30 bg-background/50 px-2 py-1.5 text-[11px] font-mono text-foreground outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-colors"
                placeholder="#000000"
              />
            </div>
          </PropField>
          <PropField label="Stroke Width">
            <NumberInput
              value={getShared((el) => el.type === "line" ? el.strokeWidth : 0) ?? 2}
              onChange={(v) => update({ strokeWidth: v })}
              min={1}
            />
          </PropField>
        </Section>
      )}

      {/* Image-specific */}
      {element?.type === "image" && (
        <Section title="Image" icon={ImageIcon}>
          <PropField label="Image URL">
            <input
              value={element.src}
              onChange={(e) => update({ src: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-lg border border-border/30 bg-background/50 px-2 py-1.5 text-[11px] text-foreground outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-colors"
            />
          </PropField>
          {element.src && element.src.startsWith("data:") && (
            <p className="text-[9px] text-muted-foreground/30">Uploaded file (base64)</p>
          )}
        </Section>
      )}
    </div>
  );
}

function PropField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="text-[9px] text-muted-foreground/40 mb-0.5 block font-medium">{label}</span>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={Math.round(value * 100) / 100}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      className="w-full rounded-lg border border-border/30 bg-background/50 px-2 py-1.5 text-[11px] font-mono text-foreground outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-colors"
    />
  );
}
