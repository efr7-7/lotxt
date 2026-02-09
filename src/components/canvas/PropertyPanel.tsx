import { useCanvasStore } from "@/stores/canvas-store";

export function PropertyPanel() {
  const { elements, selectedId, updateElement } = useCanvasStore();
  const element = elements.find((el) => el.id === selectedId);

  if (!element) {
    return (
      <div className="p-4">
        <p className="text-xs text-muted-foreground text-center mt-10">
          Select an element to edit its properties
        </p>
      </div>
    );
  }

  const update = (changes: Record<string, unknown>) => {
    updateElement(element.id, changes);
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        Properties
      </h3>

      {/* Name */}
      <PropField label="Name">
        <input
          value={element.name}
          onChange={(e) => update({ name: e.target.value })}
          className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
        />
      </PropField>

      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <PropField label="X">
          <NumberInput value={element.x} onChange={(v) => update({ x: v })} />
        </PropField>
        <PropField label="Y">
          <NumberInput value={element.y} onChange={(v) => update({ y: v })} />
        </PropField>
      </div>

      {/* Size */}
      <div className="grid grid-cols-2 gap-2">
        <PropField label="W">
          <NumberInput value={element.width} onChange={(v) => update({ width: v })} />
        </PropField>
        <PropField label="H">
          <NumberInput value={element.height} onChange={(v) => update({ height: v })} />
        </PropField>
      </div>

      {/* Rotation + Opacity */}
      <div className="grid grid-cols-2 gap-2">
        <PropField label="Rotation">
          <NumberInput
            value={element.rotation}
            onChange={(v) => update({ rotation: v })}
          />
        </PropField>
        <PropField label="Opacity">
          <NumberInput
            value={element.opacity}
            onChange={(v) => update({ opacity: v })}
            min={0}
            max={1}
            step={0.05}
          />
        </PropField>
      </div>

      <div className="h-px bg-border" />

      {/* Fill */}
      {"fill" in element && (
        <PropField label="Fill">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={(element as any).fill || "#000000"}
              onChange={(e) => update({ fill: e.target.value })}
              className="w-7 h-7 rounded border border-border cursor-pointer bg-transparent"
            />
            <input
              value={(element as any).fill || ""}
              onChange={(e) => update({ fill: e.target.value })}
              className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </PropField>
      )}

      {/* Stroke */}
      {"stroke" in element && (
        <PropField label="Stroke">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={(element as any).stroke || "#000000"}
              onChange={(e) => update({ stroke: e.target.value })}
              className="w-7 h-7 rounded border border-border cursor-pointer bg-transparent"
            />
            <NumberInput
              value={(element as any).strokeWidth || 0}
              onChange={(v) => update({ strokeWidth: v })}
              min={0}
            />
          </div>
        </PropField>
      )}

      {/* Corner radius for rects */}
      {element.type === "rect" && (
        <PropField label="Corner Radius">
          <NumberInput
            value={element.cornerRadius}
            onChange={(v) => update({ cornerRadius: v })}
            min={0}
          />
        </PropField>
      )}

      {/* Text-specific */}
      {element.type === "text" && (
        <>
          <div className="h-px bg-border" />
          <PropField label="Text">
            <textarea
              value={element.text}
              onChange={(e) => update({ text: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </PropField>
          <PropField label="Font Size">
            <NumberInput
              value={element.fontSize}
              onChange={(v) => update({ fontSize: v })}
              min={1}
            />
          </PropField>
          <PropField label="Font">
            <select
              value={element.fontFamily}
              onChange={(e) => update({ fontFamily: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="Inter">Inter</option>
              <option value="Arial">Arial</option>
              <option value="Georgia">Georgia</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
            </select>
          </PropField>
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
