import { useCanvasStore } from "@/stores/canvas-store";
import type { GradientConfig } from "@/types/canvas";

/* ─── Google Fonts list (loaded via <link> or local) ─── */
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

export function PropertyPanel() {
  const { elements, selectedIds, updateElement } = useCanvasStore();

  // Multi-select: get all selected elements
  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  const element = selectedElements.length === 1 ? selectedElements[0] : null;
  const isMulti = selectedElements.length > 1;

  if (selectedElements.length === 0) {
    return (
      <div className="p-4">
        <p className="text-xs text-muted-foreground text-center mt-10">
          Select an element to edit its properties
        </p>
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
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Properties
        </h3>
        {isMulti && (
          <span className="text-[10px] text-primary font-medium">
            {selectedElements.length} elements
          </span>
        )}
      </div>

      {/* Name — single select only */}
      {element && (
        <PropField label="Name">
          <input
            value={element.name}
            onChange={(e) => updateElement(element.id, { name: e.target.value })}
            className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
          />
        </PropField>
      )}

      {/* Position — single select only */}
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

      {/* Size — single select only */}
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

      {/* Rotation + Opacity — always available */}
      <div className="grid grid-cols-2 gap-2">
        <PropField label="Rotation">
          <NumberInput
            value={getShared((el) => el.rotation) ?? 0}
            onChange={(v) => update({ rotation: v })}
          />
        </PropField>
        <PropField label="Opacity">
          <NumberInput
            value={getShared((el) => el.opacity) ?? 1}
            onChange={(v) => update({ opacity: v })}
            min={0}
            max={1}
            step={0.05}
          />
        </PropField>
      </div>

      {/* Lock controls */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedElements.every((el) => el.locked)}
            onChange={(e) => update({ locked: e.target.checked })}
            className="w-3 h-3 rounded border-border accent-primary"
          />
          <span className="text-[10px] text-muted-foreground">Lock position</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedElements.every((el) => el.visible === false)}
            onChange={(e) => update({ visible: !e.target.checked })}
            className="w-3 h-3 rounded border-border accent-primary"
          />
          <span className="text-[10px] text-muted-foreground">Hidden</span>
        </label>
      </div>

      <div className="h-px bg-border" />

      {/* Fill — for elements that have fill */}
      {(element ? "fill" in element : sharedType && sharedType !== "image" && sharedType !== "line") && (
        <PropField label="Fill">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={getShared((el) => ("fill" in el ? (el as any).fill : "")) || "#000000"}
              onChange={(e) => update({ fill: e.target.value })}
              className="w-7 h-7 rounded border border-border cursor-pointer bg-transparent"
            />
            <input
              value={getShared((el) => ("fill" in el ? (el as any).fill : "")) || ""}
              onChange={(e) => update({ fill: e.target.value })}
              className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </PropField>
      )}

      {/* Stroke — for shapes and lines */}
      {(element ? "stroke" in element : sharedType && sharedType !== "image") && (
        <PropField label="Stroke">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={getShared((el) => ("stroke" in el ? (el as any).stroke : "")) || "#000000"}
              onChange={(e) => update({ stroke: e.target.value })}
              className="w-7 h-7 rounded border border-border cursor-pointer bg-transparent"
            />
            <NumberInput
              value={getShared((el) => ("strokeWidth" in el ? (el as any).strokeWidth : 0)) ?? 0}
              onChange={(v) => update({ strokeWidth: v })}
              min={0}
            />
          </div>
        </PropField>
      )}

      {/* Corner radius for rects */}
      {(element?.type === "rect" || sharedType === "rect") && (
        <PropField label="Corner Radius">
          <NumberInput
            value={getShared((el) => el.type === "rect" ? el.cornerRadius : 0) ?? 0}
            onChange={(v) => update({ cornerRadius: v })}
            min={0}
          />
        </PropField>
      )}

      {/* Star-specific: points and inner radius */}
      {(element?.type === "star" || sharedType === "star") && (
        <>
          <PropField label="Points">
            <NumberInput
              value={getShared((el) => el.type === "star" ? el.numPoints : 5) ?? 5}
              onChange={(v) => update({ numPoints: v })}
              min={3}
              max={20}
            />
          </PropField>
          <PropField label="Inner Radius">
            <NumberInput
              value={getShared((el) => el.type === "star" ? el.innerRadius : 0.4) ?? 0.4}
              onChange={(v) => update({ innerRadius: v })}
              min={0.1}
              max={0.9}
              step={0.05}
            />
          </PropField>
        </>
      )}

      {/* Polygon-specific: sides count */}
      {(element?.type === "polygon" || sharedType === "polygon") && (
        <PropField label="Sides">
          <NumberInput
            value={getShared((el) => el.type === "polygon" ? el.sides : 6) ?? 6}
            onChange={(v) => update({ sides: v })}
            min={3}
            max={20}
          />
        </PropField>
      )}

      {/* Arrow-specific */}
      {(element?.type === "arrow" || sharedType === "arrow") && (
        <>
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
        </>
      )}

      {/* Gradient — for rect, circle, triangle, star, polygon */}
      {element && (element.type === "rect" || element.type === "circle" || element.type === "triangle" || element.type === "star" || element.type === "polygon") && (
        <>
          <div className="h-px bg-border" />
          <PropField label="Gradient Fill">
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
              <span className="text-[10px] text-muted-foreground">Enable gradient</span>
            </label>
          </PropField>
          {element.gradient?.enabled && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <PropField label="Start Color">
                  <input
                    type="color"
                    value={element.gradient.colorStops[0]}
                    onChange={(e) => update({
                      gradient: {
                        ...element.gradient!,
                        colorStops: [e.target.value, element.gradient!.colorStops[1]],
                      },
                    })}
                    className="w-full h-7 rounded border border-border cursor-pointer bg-transparent"
                  />
                </PropField>
                <PropField label="End Color">
                  <input
                    type="color"
                    value={element.gradient.colorStops[1]}
                    onChange={(e) => update({
                      gradient: {
                        ...element.gradient!,
                        colorStops: [element.gradient!.colorStops[0], e.target.value],
                      },
                    })}
                    className="w-full h-7 rounded border border-border cursor-pointer bg-transparent"
                  />
                </PropField>
              </div>
              <PropField label="Angle">
                <NumberInput
                  value={element.gradient.angle}
                  onChange={(v) => update({
                    gradient: { ...element.gradient!, angle: v },
                  })}
                  min={0}
                  max={360}
                />
              </PropField>
            </>
          )}
        </>
      )}

      {/* Text-specific */}
      {(element?.type === "text" || sharedType === "text") && (
        <>
          <div className="h-px bg-border" />

          {/* Text content — single only */}
          {element?.type === "text" && (
            <PropField label="Text">
              <textarea
                value={element.text}
                onChange={(e) => update({ text: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </PropField>
          )}

          <PropField label="Font Size">
            <NumberInput
              value={getShared((el) => el.type === "text" ? el.fontSize : 0) ?? 32}
              onChange={(v) => update({ fontSize: v })}
              min={1}
            />
          </PropField>

          <PropField label="Font">
            <select
              value={getShared((el) => el.type === "text" ? el.fontFamily : "") ?? "Inter"}
              onChange={(e) => update({ fontFamily: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
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

          <PropField label="Weight">
            <select
              value={getShared((el) => el.type === "text" ? el.fontStyle : "") ?? "normal"}
              onChange={(e) => update({ fontStyle: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
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
              className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </PropField>

          {/* Extended text effects — single only */}
          {element?.type === "text" && (
            <>
              <div className="h-px bg-border" />
              <h3 className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                Text Effects
              </h3>
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
                  className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
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
                      className="w-7 h-7 rounded border border-border cursor-pointer bg-transparent"
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
                    className="w-7 h-7 rounded border border-border cursor-pointer bg-transparent"
                  />
                  <NumberInput
                    value={element.textStrokeWidth ?? 0}
                    onChange={(v) => update({ textStrokeWidth: v })}
                    min={0}
                  />
                </div>
              </PropField>
            </>
          )}
        </>
      )}

      {/* Line-specific */}
      {(element?.type === "line" || sharedType === "line") && (
        <>
          <div className="h-px bg-border" />
          <PropField label="Stroke Color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={getShared((el) => el.type === "line" ? el.stroke : "") || "#000000"}
                onChange={(e) => update({ stroke: e.target.value })}
                className="w-7 h-7 rounded border border-border cursor-pointer bg-transparent"
              />
              <input
                value={getShared((el) => el.type === "line" ? el.stroke : "") || ""}
                onChange={(e) => update({ stroke: e.target.value })}
                className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
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
        </>
      )}

      {/* Image-specific */}
      {element?.type === "image" && (
        <>
          <div className="h-px bg-border" />
          <PropField label="Image URL">
            <input
              value={element.src}
              onChange={(e) => update({ src: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </PropField>
          {element.src && element.src.startsWith("data:") && (
            <p className="text-[9px] text-muted-foreground/40">Uploaded file (base64)</p>
          )}
        </>
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
      <span className="text-[10px] text-muted-foreground mb-0.5 block">{label}</span>
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
      className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
    />
  );
}
