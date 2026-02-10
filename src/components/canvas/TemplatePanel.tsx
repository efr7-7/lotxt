import { useState } from "react";
import { CANVAS_TEMPLATES, type CanvasTemplate } from "@/lib/canvas-templates";
import { useCanvasStore } from "@/stores/canvas-store";
import type { CanvasElement } from "@/types/canvas";
import { cn } from "@/lib/utils";
import { LayoutTemplate, Sparkles } from "lucide-react";

const CATEGORIES = [
  { id: "all" as const, label: "All" },
  { id: "social" as const, label: "Social" },
  { id: "newsletter" as const, label: "Newsletter" },
  { id: "marketing" as const, label: "Marketing" },
  { id: "youtube" as const, label: "YouTube" },
  { id: "video" as const, label: "Video" },
  { id: "presentation" as const, label: "Slides" },
  { id: "ad" as const, label: "Ads" },
];

export function TemplatePanel() {
  const [category, setCategory] = useState<string>("all");
  const { setCanvasSize, addElement } = useCanvasStore();

  const filteredTemplates = category === "all"
    ? CANVAS_TEMPLATES
    : CANVAS_TEMPLATES.filter((t) => t.category === category);

  const applyTemplate = (template: CanvasTemplate) => {
    // Set canvas size to template dimensions
    setCanvasSize(template.width, template.height);

    // Add all elements with unique IDs
    for (const elDef of template.elements) {
      const element: CanvasElement = {
        ...elDef,
        id: crypto.randomUUID(),
      } as CanvasElement;
      addElement(element);
    }
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <LayoutTemplate className="w-3.5 h-3.5 text-muted-foreground/50" />
        <h3 className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
          Templates
        </h3>
      </div>

      {/* Category filter */}
      <div className="flex gap-1 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              "px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors",
              category === cat.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground/40 hover:text-foreground hover:bg-accent/50"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template cards */}
      <div className="space-y-1.5">
        {filteredTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => applyTemplate(template)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-accent/50 transition-colors group text-left"
          >
            <div className="w-8 h-8 rounded-md bg-accent/60 border border-border/30 flex items-center justify-center text-base shrink-0 group-hover:border-primary/20 transition-colors">
              {template.thumbnail}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-foreground/80 truncate">
                {template.label}
              </p>
              <p className="text-[9px] text-muted-foreground/40">
                {template.width}x{template.height}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
