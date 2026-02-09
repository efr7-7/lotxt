import { useCanvasStore } from "@/stores/canvas-store";
import { Square, Circle, Type, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasElementType } from "@/types/canvas";

const TYPE_ICONS: Record<CanvasElementType, typeof Square> = {
  rect: Square,
  circle: Circle,
  text: Type,
  image: ImageIcon,
};

export function LayerPanel() {
  const { elements, selectedId, setSelectedId } = useCanvasStore();

  // Display in reverse order (top layer first)
  const reversed = [...elements].reverse();

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="p-3 border-b border-border">
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Layers
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-1">
        {reversed.length === 0 ? (
          <p className="text-xs text-muted-foreground p-3 text-center">
            Add shapes using the toolbar above
          </p>
        ) : (
          reversed.map((el) => {
            const Icon = TYPE_ICONS[el.type];
            return (
              <button
                key={el.id}
                onClick={() => setSelectedId(el.id)}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 rounded-md text-left text-xs transition-colors",
                  selectedId === el.id
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span className="truncate flex-1">{el.name}</span>
                <span className="text-[10px] opacity-50">{el.type}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
