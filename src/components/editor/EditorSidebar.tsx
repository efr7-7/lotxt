import { useState, useEffect, useCallback, useMemo } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { useEditorInstance } from "./EditorContext";
import {
  FileText, Clock, Hash, Type, AlignLeft,
  Save, BookOpen, ChevronRight, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { analyzeContent } from "@/lib/readability";

interface HeadingItem {
  level: number;
  text: string;
  pos: number;
}

export function EditorSidebar() {
  const { currentDocument } = useEditorStore();
  const editor = useEditorInstance();
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activeSection, setActiveSection] = useState<"outline" | "info" | "insights">("outline");

  // Extract headings from document for outline
  useEffect(() => {
    if (!editor) return;

    const extractHeadings = () => {
      const items: HeadingItem[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          items.push({
            level: node.attrs.level,
            text: node.textContent,
            pos,
          });
        }
      });
      setHeadings(items);
    };

    extractHeadings();
    editor.on("update", extractHeadings);
    return () => { editor.off("update", extractHeadings); };
  }, [editor]);

  // Live readability analysis (updates when content changes)
  const insights = useMemo(() => {
    const html = currentDocument.htmlContent || "";
    if (!html.trim()) return null;
    return analyzeContent(html);
  }, [currentDocument.htmlContent]);

  const scrollToHeading = useCallback((pos: number) => {
    if (!editor) return;
    editor.chain().focus().setTextSelection(pos).scrollIntoView().run();
  }, [editor]);

  const handleSave = useCallback(async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("save_document", {
        id: currentDocument.id,
        title: currentDocument.title || "Untitled",
        content: JSON.stringify(currentDocument.content),
        htmlContent: currentDocument.htmlContent,
      });
    } catch (e) {
      console.error("Save failed:", e);
    }
  }, [currentDocument]);

  const formatDate = (iso: string) => {
    if (!iso) return "\u2014";
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const wordCount = currentDocument.wordCount;
  const readingTime = wordCount > 0 ? Math.max(1, Math.ceil(wordCount / 238)) : 0;

  return (
    <aside className="w-[220px] border-l border-border/30 bg-card/30 shrink-0 overflow-y-auto flex flex-col">
      {/* Section tabs */}
      <div className="flex items-center shrink-0 h-10 border-b border-border/30">
        <button
          onClick={() => setActiveSection("outline")}
          className={cn(
            "flex-1 h-full text-[11px] font-medium transition-colors relative",
            activeSection === "outline"
              ? "text-foreground/90"
              : "text-muted-foreground/40 hover:text-foreground/60",
          )}
        >
          Outline
          {activeSection === "outline" && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-primary rounded-full" />
          )}
        </button>
        <div className="w-px h-4 bg-border/30" />
        <button
          onClick={() => setActiveSection("info")}
          className={cn(
            "flex-1 h-full text-[11px] font-medium transition-colors relative",
            activeSection === "info"
              ? "text-foreground/90"
              : "text-muted-foreground/40 hover:text-foreground/60",
          )}
        >
          Details
          {activeSection === "info" && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-primary rounded-full" />
          )}
        </button>
        <div className="w-px h-4 bg-border/30" />
        <button
          onClick={() => setActiveSection("insights")}
          className={cn(
            "flex-1 h-full text-[11px] font-medium transition-colors relative",
            activeSection === "insights"
              ? "text-foreground/90"
              : "text-muted-foreground/40 hover:text-foreground/60",
          )}
        >
          Insights
          {activeSection === "insights" && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-primary rounded-full" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSection === "outline" ? (
          <div className="p-3">
            {headings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                  <AlignLeft className="w-4.5 h-4.5 text-muted-foreground/25" />
                </div>
                <p className="text-[11px] text-muted-foreground/35 leading-relaxed max-w-[140px]">
                  Add headings to your document to see an outline
                </p>
              </div>
            ) : (
              <div className="space-y-px">
                {headings.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToHeading(h.pos)}
                    className={cn(
                      "w-full text-left py-1.5 rounded-md text-[11.5px] truncate transition-all hover:bg-accent/60 group flex items-center gap-1.5",
                      h.level === 1 && "font-semibold text-foreground/85 px-2",
                      h.level === 2 && "pl-5 pr-2 text-foreground/65",
                      h.level === 3 && "pl-8 pr-2 text-muted-foreground/55",
                    )}
                    title={h.text}
                  >
                    <ChevronRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-40 shrink-0 transition-opacity" />
                    <span className="truncate">{h.text || "Untitled heading"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : activeSection === "info" ? (
          <div className="p-3 space-y-5">
            {/* Document stats */}
            <Section label="Statistics">
              <div className="grid grid-cols-2 gap-2">
                <StatCard label="Words" value={wordCount.toLocaleString()} />
                <StatCard label="Characters" value={currentDocument.characterCount.toLocaleString()} />
                <StatCard label="Reading" value={wordCount > 0 ? `${readingTime} min` : "\u2014"} />
                <StatCard label="Headings" value={headings.length.toString()} />
              </div>
            </Section>

            {/* Document metadata */}
            <Section label="Document">
              <div className="space-y-2">
                <MetaRow icon={FileText} label="Title" value={currentDocument.title || "Untitled"} />
                <MetaRow icon={Clock} label="Last edit" value={formatDate(currentDocument.updatedAt)} />
              </div>
            </Section>

            {/* Quick actions */}
            <Section label="Shortcuts">
              <div className="space-y-0.5">
                <ActionButton icon={Save} label="Save document" shortcut="Ctrl+S" onClick={handleSave} />
                <ShortcutRow keys="/" label="Slash commands" />
                <ShortcutRow keys="Ctrl+B" label="Bold" />
                <ShortcutRow keys="Ctrl+I" label="Italic" />
                <ShortcutRow keys="Ctrl+H" label="Find & Replace" />
                <ShortcutRow keys="Ctrl+J" label="AI Assistant" />
                <ShortcutRow keys="Ctrl+K" label="Command palette" />
              </div>
            </Section>
          </div>
        ) : (
          /* ─── Insights tab ─── */
          <div className="p-3 space-y-5">
            {!insights ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="w-6 h-6 text-muted-foreground/20 mb-2" />
                <p className="text-[11px] text-muted-foreground/35">
                  Write some content to see readability insights
                </p>
              </div>
            ) : (
              <>
                {/* Readability Score Ring */}
                <Section label="Readability">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative w-14 h-14 shrink-0">
                      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                        <circle
                          cx="28" cy="28" r="24"
                          fill="none" stroke="currentColor"
                          className="text-border/30"
                          strokeWidth="4"
                        />
                        <circle
                          cx="28" cy="28" r="24"
                          fill="none"
                          stroke="currentColor"
                          className={insights.readingLevelColor}
                          strokeWidth="4"
                          strokeDasharray={`${(insights.ease / 100) * 150.8} 150.8`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-foreground/80">
                        {Math.round(insights.ease)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className={cn("text-[12px] font-semibold", insights.readingLevelColor)}>
                        {insights.readingLevel}
                      </div>
                      <div className="text-[10px] text-muted-foreground/40 mt-0.5">
                        Grade {insights.grade} &middot; {insights.readingTime} min read
                      </div>
                      <div className="text-[9px] text-muted-foreground/30 mt-1">
                        {insights.grade <= 9
                          ? "Perfect for newsletters"
                          : "Consider simplifying for wider reach"}
                      </div>
                    </div>
                  </div>
                </Section>

                {/* Content Metrics */}
                <Section label="Content Metrics">
                  <div className="space-y-2">
                    <MetricBar
                      label="Avg Sentence Length"
                      value={`${insights.sentences.avgLength} words`}
                      percent={Math.min(100, (insights.sentences.avgLength / 30) * 100)}
                      optimal={insights.sentences.avgLength <= 20}
                    />
                    <MetricBar
                      label="Avg Paragraph Length"
                      value={`${insights.paragraphs.avgLength} words`}
                      percent={Math.min(100, (insights.paragraphs.avgLength / 150) * 100)}
                      optimal={insights.paragraphs.avgLength <= 100}
                    />
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <StatCard label="Paragraphs" value={insights.paragraphs.count.toString()} />
                      <StatCard label="Sentences" value={insights.sentences.count.toString()} />
                    </div>
                  </div>
                </Section>

                {/* Top Keywords */}
                <Section label="Top Keywords">
                  {insights.keywords.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground/30">
                      Not enough content for keyword analysis
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {insights.keywords.map((kw, i) => (
                        <div key={kw.word} className="flex items-center gap-2">
                          <span className="text-[9px] text-muted-foreground/30 w-3 text-right">
                            {i + 1}
                          </span>
                          <div className="flex-1 h-5 relative">
                            <div
                              className="absolute inset-y-0 left-0 bg-primary/8 rounded"
                              style={{
                                width: `${Math.min(100, (kw.count / insights.keywords[0].count) * 100)}%`,
                              }}
                            />
                            <span className="relative text-[11px] text-foreground/70 px-2 leading-5 font-medium">
                              {kw.word}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground/30 font-mono tabular-nums">
                            {kw.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                {/* Title Health */}
                <Section label="Title Health">
                  {currentDocument.title ? (
                    <div className="space-y-1.5">
                      <TitleCheck
                        label="Length"
                        pass={currentDocument.title.length >= 20 && currentDocument.title.length <= 70}
                        detail={`${currentDocument.title.length} chars ${currentDocument.title.length < 20 ? "(too short)" : currentDocument.title.length > 70 ? "(too long for email)" : "(good)"}`}
                      />
                      <TitleCheck
                        label="Has a number"
                        pass={/\d/.test(currentDocument.title)}
                        detail={/\d/.test(currentDocument.title) ? "Numbers boost open rates" : "Consider adding a number"}
                      />
                      <TitleCheck
                        label="Power words"
                        pass={/free|new|proven|secret|best|top|ultimate|essential|powerful|exclusive/i.test(currentDocument.title)}
                        detail="Words that trigger curiosity or urgency"
                      />
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground/30">Add a title first</p>
                  )}
                </Section>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

/* ─── Helper components ─── */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[9.5px] font-semibold text-muted-foreground/40 uppercase tracking-[0.1em] mb-2.5 px-0.5">
        {label}
      </h3>
      {children}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-accent/40 border border-border/20 px-2.5 py-2 flex flex-col">
      <span className="text-[13px] font-semibold text-foreground/80 tabular-nums leading-tight">{value}</span>
      <span className="text-[9.5px] text-muted-foreground/40 mt-0.5">{label}</span>
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <div className="w-5 h-5 rounded-md bg-accent/50 flex items-center justify-center shrink-0">
        <Icon className="w-2.5 h-2.5 text-muted-foreground/50" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[9.5px] text-muted-foreground/40 block leading-tight">{label}</span>
        <span className="text-[11px] text-foreground/75 truncate block">{value}</span>
      </div>
    </div>
  );
}

function MetricBar({
  label,
  value,
  percent,
  optimal,
}: {
  label: string;
  value: string;
  percent: number;
  optimal: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground/50">{label}</span>
        <span className={cn(
          "text-[10px] font-medium",
          optimal ? "text-emerald-400" : "text-amber-400",
        )}>
          {value}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-border/20 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            optimal ? "bg-emerald-400/60" : "bg-amber-400/60",
          )}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
}

function TitleCheck({
  label,
  pass,
  detail,
}: {
  label: string;
  pass: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-2 py-0.5">
      <span className={cn(
        "text-[10px] mt-0.5 shrink-0",
        pass ? "text-emerald-400" : "text-muted-foreground/30",
      )}>
        {pass ? "\u2713" : "\u2717"}
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] text-foreground/60 block">{label}</span>
        <span className="text-[9px] text-muted-foreground/35">{detail}</span>
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  shortcut,
  onClick,
}: {
  icon: typeof Save;
  label: string;
  shortcut?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 py-1.5 px-2 rounded-md text-[11px] text-muted-foreground/60 hover:text-foreground hover:bg-accent/60 transition-colors"
    >
      <Icon className="w-3 h-3 shrink-0" strokeWidth={1.5} />
      <span className="flex-1 text-left">{label}</span>
      {shortcut && (
        <kbd className="text-[9px] text-muted-foreground/35 bg-accent/80 border border-border/30 px-1.5 py-0.5 rounded font-mono">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}

function ShortcutRow({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2">
      <span className="text-[11px] text-muted-foreground/50">{label}</span>
      <kbd className="text-[9px] text-muted-foreground/35 bg-accent/80 border border-border/30 px-1.5 py-0.5 rounded font-mono">
        {keys}
      </kbd>
    </div>
  );
}
