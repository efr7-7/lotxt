import { useState } from "react";
import { useCanvasStore } from "@/stores/canvas-store";
import { X, Save } from "lucide-react";
import { toast } from "@/stores/toast-store";
import { invoke } from "@tauri-apps/api/core";

const CATEGORIES = [
  { value: "social", label: "Social" },
  { value: "newsletter", label: "Newsletter" },
  { value: "marketing", label: "Marketing" },
  { value: "youtube", label: "YouTube" },
  { value: "video", label: "Video" },
  { value: "presentation", label: "Presentation" },
  { value: "ad", label: "Ad" },
];

interface Props {
  onClose: () => void;
}

export function SaveTemplateDialog({ onClose }: Props) {
  const { elements, canvasSize } = useCanvasStore();
  const canvasWidth = canvasSize.width;
  const canvasHeight = canvasSize.height;
  const [name, setName] = useState("");
  const [category, setCategory] = useState("social");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.warning("Enter a template name");
      return;
    }
    setIsSaving(true);
    try {
      const elementsJson = JSON.stringify(
        elements.map(({ id, ...rest }) => rest)
      );
      await invoke("save_user_template", {
        name: name.trim(),
        category,
        width: canvasWidth,
        height: canvasHeight,
        elementsJson,
      });
      toast.success("Template saved!");
      onClose();
    } catch (e) {
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-popover border border-border rounded-xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Save className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Save as Template</h2>
          </div>
          <button onClick={onClose} className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="p-2.5 rounded-lg bg-muted/50 text-center">
            <span className="text-[10px] text-muted-foreground">
              {canvasWidth} × {canvasHeight} · {elements.length} element{elements.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Template Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="My Template"
              className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save Template"}
          </button>
        </div>
      </div>
    </div>
  );
}
