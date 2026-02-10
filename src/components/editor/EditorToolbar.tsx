import { useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus,
  AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, Image as ImageIcon, Table as TableIcon,
  Highlighter, Undo2, Redo2,
  Search, ChevronDown,
  Download, FileText, FileImage,
  Send, Sparkles, FolderOpen, Layers, History, LayoutTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";
import { useEditorInstance } from "./EditorContext";
import { PublishDialog } from "@/components/accounts/PublishDialog";
import { PreFlightChecklist } from "./PreFlightChecklist";
import { ImageUploadDialog } from "./ImageUploadDialog";
import { TemplatePicker } from "./TemplatePicker";
import { toast } from "@/stores/toast-store";

function ToolBtn({
  onClick, isActive = false, disabled = false, title, children,
}: {
  onClick: () => void; isActive?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick} disabled={disabled} title={title}
      className={cn(
        "h-7 w-7 rounded-md flex items-center justify-center transition-all duration-75",
        isActive
          ? "bg-primary/12 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.15)]"
          : "text-muted-foreground/60 hover:text-foreground hover:bg-accent/80",
        disabled && "opacity-20 pointer-events-none",
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-4 bg-border/40 mx-1" />;
}

interface Props {
  onToggleFind: () => void;
  onToggleAi?: () => void;
  showAi?: boolean;
  onToggleDocList?: () => void;
  showDocList?: boolean;
  onToggleProjects?: () => void;
  showProjects?: boolean;
  onToggleVersionHistory?: () => void;
  showVersionHistory?: boolean;
}

export function EditorToolbar({ onToggleFind, onToggleAi, showAi, onToggleDocList, showDocList, onToggleProjects, showProjects, onToggleVersionHistory, showVersionHistory }: Props) {
  const { currentDocument, setTitle, createNewDocument } = useEditorStore();
  const editor = useEditorInstance();
  const [showPublish, setShowPublish] = useState(false);
  const [showPreflight, setShowPreflight] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const insertLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href;
    const url = prompt("Enter URL:", prev || "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  };

  const insertImage = () => {
    setShowImageUpload(true);
  };

  const handleImageInsert = (url: string) => {
    if (!editor || !url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  const insertTable = () => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const handleExport = async (format: "html" | "markdown" | "pdf" | "docx") => {
    setShowExport(false);
    const title = currentDocument.title || "Untitled";
    const html = currentDocument.htmlContent;

    if (format === "html") {
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:system-ui,sans-serif;max-width:680px;margin:2rem auto;padding:0 1rem;line-height:1.7;color:#1a1a1a}h1{font-size:2rem;font-weight:700}h2{font-size:1.5rem;font-weight:600}h3{font-size:1.25rem;font-weight:600}img{max-width:100%;border-radius:8px}code{background:#f4f4f5;padding:2px 6px;border-radius:4px;font-size:0.9em}pre{background:#f4f4f5;padding:1rem;border-radius:8px;overflow-x:auto}blockquote{border-left:3px solid #d4d4d8;padding-left:1rem;color:#52525b}table{border-collapse:collapse;width:100%}th,td{border:1px solid #e4e4e7;padding:8px 12px;text-align:left}th{background:#f4f4f5;font-weight:600}</style></head><body>${html}</body></html>`;
      downloadBlob(new Blob([fullHtml], { type: "text/html" }), `${title}.html`);
    } else if (format === "markdown") {
      let md = html
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
        .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
        .replace(/<b>(.*?)<\/b>/gi, "**$1**")
        .replace(/<em>(.*?)<\/em>/gi, "*$1*")
        .replace(/<i>(.*?)<\/i>/gi, "*$1*")
        .replace(/<s>(.*?)<\/s>/gi, "~~$1~~")
        .replace(/<code>(.*?)<\/code>/gi, "`$1`")
        .replace(/<a href="(.*?)">(.*?)<\/a>/gi, "[$2]($1)")
        .replace(/<img[^>]*src="(.*?)"[^>]*\/?>/gi, "![]($1)")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<hr\s*\/?>/gi, "\n---\n\n")
        .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
        .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, "> $1\n\n")
        .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
        .replace(/\n{3,}/g, "\n\n").trim();
      downloadBlob(new Blob([md], { type: "text/markdown" }), `${title}.md`);
    } else if (format === "pdf" || format === "docx") {
      toast.info(`Exporting ${format.toUpperCase()}...`);
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const bytes = await invoke<number[]>(format === "pdf" ? "export_pdf" : "export_docx", {
          title, htmlContent: html,
        });
        const blob = new Blob([new Uint8Array(bytes)], {
          type: format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        downloadBlob(blob, `${title}.${format}`);
        toast.success(`${format.toUpperCase()} exported successfully`);
      } catch (e) {
        console.error(`Export to ${format} failed:`, e);
        toast.error(`Export failed — make sure you're running the native app`);
      }
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = currentDocument.wordCount;
  const readingTime = wordCount > 0 ? Math.max(1, Math.ceil(wordCount / 238)) : 0;

  return (
    <>
      <div className="flex flex-col shrink-0 border-b border-border/40">
        {/* Row 1: Formatting tools */}
        <div className="h-10 flex items-center px-2.5 gap-0.5">
          <ToolBtn onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()} title="Undo (Ctrl+Z)">
            <Undo2 className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()} title="Redo (Ctrl+Shift+Z)">
            <Redo2 className="w-3.5 h-3.5" />
          </ToolBtn>
          <Sep />
          <ToolBtn onClick={() => editor?.chain().focus().toggleBold().run()} isActive={editor?.isActive("bold") ?? false} title="Bold (Ctrl+B)">
            <Bold className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => editor?.chain().focus().toggleItalic().run()} isActive={editor?.isActive("italic") ?? false} title="Italic (Ctrl+I)">
            <Italic className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => editor?.chain().focus().toggleUnderline().run()} isActive={editor?.isActive("underline") ?? false} title="Underline (Ctrl+U)">
            <UnderlineIcon className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => editor?.chain().focus().toggleStrike().run()} isActive={editor?.isActive("strike") ?? false} title="Strikethrough">
            <Strikethrough className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => editor?.chain().focus().toggleCode().run()} isActive={editor?.isActive("code") ?? false} title="Inline Code">
            <Code className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => editor?.chain().focus().toggleHighlight().run()} isActive={editor?.isActive("highlight") ?? false} title="Highlight">
            <Highlighter className="w-3.5 h-3.5" />
          </ToolBtn>
          <Sep />
          <ToolBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor?.isActive("heading", { level: 1 }) ?? false} title="Heading 1">
            <Heading1 className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor?.isActive("heading", { level: 2 }) ?? false} title="Heading 2">
            <Heading2 className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor?.isActive("heading", { level: 3 }) ?? false} title="Heading 3">
            <Heading3 className="w-3.5 h-3.5" />
          </ToolBtn>
          <Sep />
          <ToolBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} isActive={editor?.isActive("bulletList") ?? false} title="Bullet List">
            <List className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} isActive={editor?.isActive("orderedList") ?? false} title="Numbered List">
            <ListOrdered className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => editor?.chain().focus().toggleBlockquote().run()} isActive={editor?.isActive("blockquote") ?? false} title="Blockquote">
            <Quote className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
            <Minus className="w-3.5 h-3.5" />
          </ToolBtn>
          <Sep />
          <ToolBtn onClick={() => editor?.chain().focus().setTextAlign("left").run()} isActive={editor?.isActive({ textAlign: "left" }) ?? false} title="Align Left">
            <AlignLeft className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => editor?.chain().focus().setTextAlign("center").run()} isActive={editor?.isActive({ textAlign: "center" }) ?? false} title="Align Center">
            <AlignCenter className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => editor?.chain().focus().setTextAlign("right").run()} isActive={editor?.isActive({ textAlign: "right" }) ?? false} title="Align Right">
            <AlignRight className="w-3.5 h-3.5" />
          </ToolBtn>
          <Sep />
          <ToolBtn onClick={insertLink} isActive={editor?.isActive("link") ?? false} title="Link">
            <LinkIcon className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={insertImage} title="Image">
            <ImageIcon className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={insertTable} title="Table">
            <TableIcon className="w-3.5 h-3.5" />
          </ToolBtn>
          <Sep />
          <ToolBtn onClick={onToggleFind} title="Find & Replace (Ctrl+H)">
            <Search className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => onToggleAi?.()} isActive={showAi ?? false} title="AI Assistant (Ctrl+J)">
            <Sparkles className="w-3.5 h-3.5" />
          </ToolBtn>
        </div>

        {/* Row 2: Document meta + actions — separate row to prevent overlap */}
        <div className="h-8 flex items-center px-3 bg-card/30">
          {/* Left: documents button + word stats */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onToggleProjects?.()}
              className={cn(
                "h-5 px-1.5 rounded flex items-center gap-1 text-[10.5px] font-medium transition-colors",
                showProjects
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground/50 hover:text-foreground hover:bg-accent/70",
              )}
              title="Projects (Ctrl+Shift+P)"
            >
              <Layers className="w-3 h-3" />
            </button>
            <button
              onClick={() => onToggleDocList?.()}
              className={cn(
                "h-5 px-1.5 rounded flex items-center gap-1 text-[10.5px] font-medium transition-colors",
                showDocList
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground/50 hover:text-foreground hover:bg-accent/80",
              )}
              title="Documents (Ctrl+D)"
            >
              <FolderOpen className="w-3 h-3" />
            </button>
            <button
              onClick={() => onToggleVersionHistory?.()}
              className={cn(
                "h-5 px-1.5 rounded flex items-center gap-1 text-[10.5px] font-medium transition-colors",
                showVersionHistory
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground/50 hover:text-foreground hover:bg-accent/80",
              )}
              title="Version History"
            >
              <History className="w-3 h-3" />
            </button>
            <span className="text-muted-foreground/20">·</span>
            <span className="text-[10.5px] text-muted-foreground/45 tabular-nums font-medium">
              {wordCount.toLocaleString()} words
            </span>
            <span className="text-muted-foreground/20">·</span>
            <span className="text-[10.5px] text-muted-foreground/35 tabular-nums">
              {currentDocument.characterCount.toLocaleString()} chars
            </span>
            {wordCount > 0 && (
              <>
                <span className="text-muted-foreground/20">·</span>
                <span className="text-[10.5px] text-muted-foreground/35 tabular-nums">
                  {readingTime} min read
                </span>
              </>
            )}
          </div>

          <div className="flex-1" />

          {/* Right: Export + Publish */}
          <div className="flex items-center gap-1.5">
            {/* Export */}
            <div className="relative">
              <button onClick={() => setShowExport(!showExport)}
                className="h-6 px-2 rounded-md text-[11px] font-medium text-muted-foreground/60 hover:text-foreground hover:bg-accent/80 flex items-center gap-1 transition-colors">
                <Download className="w-3 h-3" /> Export <ChevronDown className="w-2.5 h-2.5 opacity-40" />
              </button>
              {showExport && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExport(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-popover/95 backdrop-blur-md border border-border/50 rounded-lg shadow-overlay overflow-hidden py-1">
                    <button onClick={() => handleExport("html")} className="flex items-center gap-2.5 w-full px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                      <FileText className="w-3.5 h-3.5" /> HTML
                    </button>
                    <button onClick={() => handleExport("markdown")} className="flex items-center gap-2.5 w-full px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                      <FileText className="w-3.5 h-3.5" /> Markdown
                    </button>
                    <div className="h-px bg-border/30 my-1 mx-2" />
                    <button onClick={() => handleExport("pdf")} className="flex items-center gap-2.5 w-full px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                      <FileImage className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button onClick={() => handleExport("docx")} className="flex items-center gap-2.5 w-full px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                      <FileText className="w-3.5 h-3.5" /> DOCX
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Template */}
            <button onClick={() => setShowTemplatePicker(true)}
              className="h-6 px-2 rounded-md text-[11px] font-medium text-muted-foreground/60 hover:text-foreground hover:bg-accent/80 flex items-center gap-1 transition-colors"
              title="Newsletter Templates">
              <LayoutTemplate className="w-3 h-3" /> Template
            </button>

            {/* Publish */}
            <button onClick={() => setShowPreflight(true)}
              className="h-6 px-3 rounded-md bg-primary text-primary-foreground text-[11px] font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
              <Send className="w-2.5 h-2.5" /> Publish
            </button>
          </div>
        </div>
      </div>

      {/* Pre-flight checklist → then Publish */}
      {showPreflight && (
        <PreFlightChecklist
          onClose={() => setShowPreflight(false)}
          onPublish={() => {
            setShowPreflight(false);
            setShowPublish(true);
          }}
        />
      )}
      {showPublish && <PublishDialog onClose={() => setShowPublish(false)} />}
      <ImageUploadDialog
        isOpen={showImageUpload}
        onClose={() => setShowImageUpload(false)}
        onInsert={handleImageInsert}
      />
      <TemplatePicker
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelect={({ title, htmlContent }) => {
          createNewDocument();
          // Small delay to let the new document mount, then set content via editor
          setTimeout(() => {
            setTitle(title);
            if (editor) {
              editor.commands.setContent(htmlContent);
            }
          }, 100);
        }}
      />
    </>
  );
}
