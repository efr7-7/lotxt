import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagEditorProps {
  docId: string;
  tags: string[];
  onClose?: () => void;
}

export function TagEditor({ docId, tags, onClose }: TagEditorProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const allTags = useEditorStore((s) => s.getAllTags());
  const addTag = useEditorStore((s) => s.addTag);
  const removeTag = useEditorStore((s) => s.removeTag);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const suggestions = allTags
    .filter((t) => !tags.includes(t))
    .filter((t) => !input || t.includes(input.toLowerCase()))
    .slice(0, 5);

  const handleAdd = () => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return;
    addTag(docId, trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onClose?.();
    }
  };

  return (
    <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-card/80 border border-border/30">
      {/* Existing tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium"
            >
              {tag}
              <button
                onClick={() => removeTag(docId, tag)}
                className="ml-0.5 w-3 h-3 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <X className="w-2 h-2" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-1.5">
        <Plus className="w-3 h-3 text-muted-foreground/40 shrink-0" />
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add tag..."
          className="flex-1 bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground/30 outline-none"
        />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5 border-t border-border/20">
          {suggestions.map((tag) => (
            <button
              key={tag}
              onClick={() => addTag(docId, tag)}
              className="px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground/50 text-[10px] hover:bg-muted/50 hover:text-muted-foreground/80 transition-colors cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
