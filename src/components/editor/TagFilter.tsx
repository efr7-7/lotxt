import { useEditorStore } from "@/stores/editor-store";
import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagFilterProps {
  activeTag: string | null;
  onTagSelect: (tag: string | null) => void;
}

export function TagFilter({ activeTag, onTagSelect }: TagFilterProps) {
  const allTags = useEditorStore((s) => s.getAllTags());

  if (allTags.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scroll-fade">
      {/* "All" pill — always first */}
      <button
        onClick={() => onTagSelect(null)}
        className={cn(
          "shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium cursor-pointer transition-all duration-150",
          activeTag === null
            ? "bg-primary/15 text-primary ring-1 ring-primary/30"
            : "bg-muted/30 text-muted-foreground/60 hover:bg-muted/50",
        )}
      >
        All
      </button>

      {allTags.map((tag) => (
        <button
          key={tag}
          onClick={() => onTagSelect(activeTag === tag ? null : tag)}
          className={cn(
            "shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium cursor-pointer transition-all duration-150",
            activeTag === tag
              ? "bg-primary/15 text-primary ring-1 ring-primary/30"
              : "bg-muted/30 text-muted-foreground/60 hover:bg-muted/50",
          )}
        >
          <Tag className="w-2.5 h-2.5" />
          {tag}
        </button>
      ))}
    </div>
  );
}
