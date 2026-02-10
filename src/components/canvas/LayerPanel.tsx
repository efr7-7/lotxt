import { useState } from "react";
import { useCanvasStore } from "@/stores/canvas-store";
import {
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  Minus,
  Triangle,
  Star,
  ArrowRight,
  Hexagon,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasElementType } from "@/types/canvas";

const TYPE_ICONS: Record<CanvasElementType, typeof Square> = {
  rect: Square,
  circle: Circle,
  triangle: Triangle,
  star: Star,
  arrow: ArrowRight,
  polygon: Hexagon,
  text: Type,
  image: ImageIcon,
  line: Minus,
};

export function LayerPanel() {
  const {
    elements,
    selectedIds,
    setSelectedId,
    addToSelection,
    toggleSelection,
    toggleElementVisibility,
    toggleElementLock,
    reorderElement,
    duplicateSelection,
    deleteSelection,
    selectMultiple,
  } = useCanvasStore();

  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  // Display in reverse order (top layer first)
  const reversed = [...elements].reverse();

  const handleLayerClick = (id: string, e: React.MouseEvent) => {
    if (e.shiftKey) {
      toggleSelection(id);
    } else if (e.ctrlKey || e.metaKey) {
      addToSelection(id);
    } else {
      setSelectedId(id);
    }
  };

  const handleContextMenu = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    // Make sure this layer is selected
    if (!selectedIds.includes(id)) {
      setSelectedId(id);
    }
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenu(null);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Layers
        </h3>
        {elements.length > 0 && (
          <span className="text-[10px] text-muted-foreground/40">{elements.length}</span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-1">
        {reversed.length === 0 ? (
          <p className="text-xs text-muted-foreground p-3 text-center">
            Add shapes using the toolbar above
          </p>
        ) : (
          reversed.map((el) => {
            const Icon = TYPE_ICONS[el.type];
            const isSelected = selectedIds.includes(el.id);
            const isHidden = el.visible === false;
            const isLocked = el.locked === true;

            return (
              <div
                key={el.id}
                onClick={(e) => handleLayerClick(el.id, e)}
                onContextMenu={(e) => handleContextMenu(el.id, e)}
                className={cn(
                  "group flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md text-left text-xs transition-colors cursor-pointer",
                  isSelected
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  isHidden && "opacity-40",
                )}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span className={cn("truncate flex-1", isLocked && "italic")}>
                  {el.name}
                </span>

                {/* Quick action icons — show on hover */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleElementVisibility(el.id);
                    }}
                    title={isHidden ? "Show" : "Hide"}
                    className="w-5 h-5 rounded flex items-center justify-center hover:bg-background/50 transition-colors"
                  >
                    {isHidden ? (
                      <EyeOff className="w-3 h-3" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleElementLock(el.id);
                    }}
                    title={isLocked ? "Unlock" : "Lock"}
                    className="w-5 h-5 rounded flex items-center justify-center hover:bg-background/50 transition-colors"
                  >
                    {isLocked ? (
                      <Lock className="w-3 h-3 text-amber-400" />
                    ) : (
                      <Unlock className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Persistent lock/hide indicators (when active) */}
                {(isLocked || isHidden) && (
                  <div className="flex items-center gap-0.5 group-hover:hidden">
                    {isLocked && <Lock className="w-2.5 h-2.5 text-amber-400/60" />}
                    {isHidden && <EyeOff className="w-2.5 h-2.5 text-muted-foreground/40" />}
                  </div>
                )}

                {/* Reorder buttons */}
                <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderElement(el.id, "up");
                    }}
                    title="Move Up"
                    className="w-4 h-3 flex items-center justify-center hover:bg-background/50 rounded-sm"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderElement(el.id, "down");
                    }}
                    title="Move Down"
                    className="w-4 h-3 flex items-center justify-center hover:bg-background/50 rounded-sm"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeContextMenu} />
          <div
            className="fixed z-50 w-44 rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/30 p-1.5"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                selectMultiple([contextMenu.id]);
                duplicateSelection();
                closeContextMenu();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-foreground/80 hover:bg-accent/50 transition-colors"
            >
              <Copy className="w-3 h-3" />
              Duplicate
            </button>
            <button
              onClick={() => {
                toggleElementLock(contextMenu.id);
                closeContextMenu();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-foreground/80 hover:bg-accent/50 transition-colors"
            >
              <Lock className="w-3 h-3" />
              {elements.find((el) => el.id === contextMenu.id)?.locked ? "Unlock" : "Lock"}
            </button>
            <button
              onClick={() => {
                toggleElementVisibility(contextMenu.id);
                closeContextMenu();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-foreground/80 hover:bg-accent/50 transition-colors"
            >
              <Eye className="w-3 h-3" />
              {elements.find((el) => el.id === contextMenu.id)?.visible === false ? "Show" : "Hide"}
            </button>
            <button
              onClick={() => {
                reorderElement(contextMenu.id, "up");
                closeContextMenu();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-foreground/80 hover:bg-accent/50 transition-colors"
            >
              <ChevronUp className="w-3 h-3" />
              Move Up
            </button>
            <button
              onClick={() => {
                reorderElement(contextMenu.id, "down");
                closeContextMenu();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-foreground/80 hover:bg-accent/50 transition-colors"
            >
              <ChevronDown className="w-3 h-3" />
              Move Down
            </button>
            <div className="h-px bg-border/30 my-1" />
            <button
              onClick={() => {
                deleteSelection();
                closeContextMenu();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
