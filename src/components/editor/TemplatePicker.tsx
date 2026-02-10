import { useState, useMemo } from "react";
import {
  X, FileText, Newspaper, BarChart3, Lightbulb, List,
  BookOpen, MessageSquare, Layers, PenTool, Target,
  Clock, ArrowRight, Sparkles, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NEWSLETTER_TEMPLATES, getTemplateHtml, type NewsletterTemplate } from "@/lib/newsletter-templates";

// Map archetype → icon
const ARCHETYPE_ICONS: Record<string, React.ElementType> = {
  curator: BookOpen,
  analyst: BarChart3,
  reporter: Newspaper,
  expert: Lightbulb,
  writer: PenTool,
  listicle: List,
  "case-study": FileText,
  "how-to": Target,
  interview: MessageSquare,
  hybrid: Layers,
};

// Map archetype → color
const ARCHETYPE_COLORS: Record<string, string> = {
  curator: "text-blue-500 bg-blue-500/10",
  analyst: "text-violet-500 bg-violet-500/10",
  reporter: "text-red-500 bg-red-500/10",
  expert: "text-amber-500 bg-amber-500/10",
  writer: "text-emerald-500 bg-emerald-500/10",
  listicle: "text-cyan-500 bg-cyan-500/10",
  "case-study": "text-indigo-500 bg-indigo-500/10",
  "how-to": "text-orange-500 bg-orange-500/10",
  interview: "text-pink-500 bg-pink-500/10",
  hybrid: "text-teal-500 bg-teal-500/10",
};

interface TemplatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: { title: string; htmlContent: string; wordCount: number }) => void;
}

export function TemplatePicker({ isOpen, onClose, onSelect }: TemplatePickerProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return NEWSLETTER_TEMPLATES;
    const q = search.toLowerCase();
    return NEWSLETTER_TEMPLATES.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.archetype.toLowerCase().includes(q),
    );
  }, [search]);

  const previewTemplate = useMemo(() => {
    const id = previewId || selectedId;
    if (!id) return null;
    return NEWSLETTER_TEMPLATES.find((t) => t.id === id) ?? null;
  }, [previewId, selectedId]);

  if (!isOpen) return null;

  const handleUseTemplate = (template: NewsletterTemplate) => {
    const html = getTemplateHtml(template.id);
    // Rough word count from the HTML
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const wordCount = text.split(" ").filter(Boolean).length;
    onSelect({
      title: `${template.name} — New Issue`,
      htmlContent: html,
      wordCount,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-[800px] max-h-[85vh] bg-card border border-border/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <div>
            <h2 className="text-[16px] font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Newsletter Templates
            </h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Proven content structures used by top newsletters
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-border/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full h-8 pl-9 pr-3 rounded-lg bg-muted/40 border border-border/30 text-[12px] text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Template grid */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((template) => {
                const Icon = ARCHETYPE_ICONS[template.archetype] ?? FileText;
                const colorClass = ARCHETYPE_COLORS[template.archetype] ?? "text-muted-foreground bg-muted";
                const isSelected = selectedId === template.id;

                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedId(template.id)}
                    onMouseEnter={() => setPreviewId(template.id)}
                    onMouseLeave={() => setPreviewId(null)}
                    className={cn(
                      "flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all group",
                      isSelected
                        ? "border-primary/40 bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]"
                        : "border-border/40 bg-card hover:border-primary/20 hover:bg-accent/30",
                    )}
                  >
                    <div className="flex items-center gap-2.5 w-full">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", colorClass)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate">
                          {template.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> {template.targetReadTime} min
                          </span>
                          <span className="text-[10px] text-muted-foreground/50">
                            ~{template.targetWordCount} words
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground/60 leading-relaxed line-clamp-2">
                      {template.description}
                    </p>
                    {isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseTemplate(template);
                        }}
                        className="mt-1 w-full h-7 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-primary/90 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
                      >
                        Use Template <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="w-6 h-6 text-muted-foreground/20 mb-3" />
                <p className="text-[13px] text-muted-foreground/50">No templates match your search</p>
              </div>
            )}
          </div>

          {/* Preview panel */}
          {previewTemplate && (
            <div className="w-[280px] border-l border-border/30 overflow-y-auto p-5 bg-muted/10">
              <div className="space-y-4">
                <div>
                  <h3 className="text-[14px] font-bold text-foreground">{previewTemplate.name}</h3>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    {previewTemplate.description}
                  </p>
                </div>

                {/* Sections outline */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
                    Sections
                  </p>
                  <div className="space-y-1.5">
                    {previewTemplate.sections.map((section, i) => (
                      <div key={section.id} className="flex items-start gap-2">
                        <span className="text-[9px] text-muted-foreground/30 font-mono mt-0.5 shrink-0 w-3">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-foreground/80 truncate">
                            {section.name}
                            {section.required && (
                              <span className="text-[8px] text-primary ml-1">REQ</span>
                            )}
                          </p>
                          <p className="text-[10px] text-muted-foreground/40">~{section.targetWords} words</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                {previewTemplate.tips.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
                      Pro Tips
                    </p>
                    <div className="space-y-1.5">
                      {previewTemplate.tips.slice(0, 3).map((tip, i) => (
                        <p key={i} className="text-[10px] text-muted-foreground/60 leading-relaxed flex items-start gap-1.5">
                          <Lightbulb className="w-2.5 h-2.5 text-amber-500/50 shrink-0 mt-0.5" />
                          {tip}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Examples */}
                {previewTemplate.examples.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
                      Examples
                    </p>
                    <div className="space-y-1">
                      {previewTemplate.examples.map((ex, i) => (
                        <p key={i} className="text-[10px] text-primary/60">{ex}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
