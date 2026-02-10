import { useState, useRef, useCallback, useMemo } from "react";
import { Import, Upload, FileText, X, Eye, Code, ClipboardPaste, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";

// ─── Markdown to HTML Converter ────────────────────────────────────────────────

function markdownToHtml(md: string): string {
  let html = md;

  // Normalize line endings
  html = html.replace(/\r\n/g, "\n");

  // Fenced code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    const escaped = code.replace(/</g, "&lt;").replace(/>/g, "&gt;").trimEnd();
    return `<pre><code>${escaped}</code></pre>`;
  });

  // Inline code (must come before other inline transforms)
  html = html.replace(/`([^`\n]+)`/g, "<code>$1</code>");

  // Horizontal rules
  html = html.replace(/^---+$/gm, "<hr>");
  html = html.replace(/^\*\*\*+$/gm, "<hr>");
  html = html.replace(/^___+$/gm, "<hr>");

  // Headings (h1-h6)
  html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

  // Images (before links so ![alt](src) isn't caught by link regex)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Obsidian-style [[wiki links]] → plain text with marker
  html = html.replace(/\[\[([^\]]+)\]\]/g, '<span class="wiki-link" title="Wiki link">$1</span>');

  // Bold and italic combined (***text*** or ___text___)
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/___(.+?)___/g, "<strong><em>$1</em></strong>");

  // Bold (**text** or __text__)
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Italic (*text* or _text_)
  html = html.replace(/(?<!\w)\*([^*\n]+)\*(?!\w)/g, "<em>$1</em>");
  html = html.replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, "<em>$1</em>");

  // Strikethrough (~~text~~)
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

  // Blockquotes — collect consecutive > lines
  html = html.replace(/^(?:>\s?(.*)(?:\n|$))+/gm, (match) => {
    const content = match
      .split("\n")
      .map((line) => line.replace(/^>\s?/, ""))
      .join("\n")
      .trim();
    return `<blockquote><p>${content}</p></blockquote>`;
  });

  // Unordered lists — collect consecutive lines starting with - or *
  html = html.replace(/^(?:[-*]\s+.+(?:\n|$))+/gm, (match) => {
    const items = match
      .trim()
      .split("\n")
      .map((line) => `<li>${line.replace(/^[-*]\s+/, "")}</li>`)
      .join("\n");
    return `<ul>\n${items}\n</ul>`;
  });

  // Ordered lists — collect consecutive lines starting with 1. 2. etc
  html = html.replace(/^(?:\d+\.\s+.+(?:\n|$))+/gm, (match) => {
    const items = match
      .trim()
      .split("\n")
      .map((line) => `<li>${line.replace(/^\d+\.\s+/, "")}</li>`)
      .join("\n");
    return `<ol>\n${items}\n</ol>`;
  });

  // Paragraphs — split by blank lines, wrap non-block content in <p> tags
  const blocks = html.split(/\n\n+/);
  const blockTags = /^<(h[1-6]|ul|ol|li|blockquote|pre|hr|img|table|div)/;
  html = blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (blockTags.test(trimmed)) return trimmed;
      // Replace single newlines within paragraph with <br>
      return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    })
    .filter(Boolean)
    .join("\n");

  return html;
}

// ─── Extract title from markdown (first # heading or first line) ───────────────

function extractTitle(md: string, filename?: string): string {
  const headingMatch = md.match(/^#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();

  // Fall back to filename without extension
  if (filename) {
    return filename.replace(/\.(md|markdown|txt|html)$/i, "");
  }

  // Fall back to first non-empty line
  const firstLine = md.trim().split("\n")[0]?.trim();
  if (firstLine && firstLine.length < 120) return firstLine;

  return "Imported Document";
}

// ─── Format file size ──────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type TabMode = "file" | "paste" | "url";
type PreviewMode = "preview" | "source";

interface FileEntry {
  name: string;
  size: number;
  content: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ImportDialog({ onClose }: { onClose: () => void }) {
  const { createNewDocument, setTitle, setContent } = useEditorStore();

  const [activeTab, setActiveTab] = useState<TabMode>("file");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [pasteContent, setPasteContent] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [urlFetching, setUrlFetching] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [fetchedContent, setFetchedContent] = useState<string | null>(null);

  // Preview state
  const [previewMode, setPreviewMode] = useState<PreviewMode>("preview");
  const [importTitle, setImportTitle] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [imported, setImported] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Derived state ─────────────────────────────────────────────────────────

  const activeContent = useMemo(() => {
    if (activeTab === "file" && files.length === 1) return files[0].content;
    if (activeTab === "paste" && pasteContent.trim()) return pasteContent;
    if (activeTab === "url" && fetchedContent) return fetchedContent;
    return null;
  }, [activeTab, files, pasteContent, fetchedContent]);

  const previewHtml = useMemo(() => {
    if (!activeContent) return "";
    return markdownToHtml(activeContent);
  }, [activeContent]);

  const canImport = useMemo(() => {
    if (activeTab === "file") return files.length > 0;
    if (activeTab === "paste") return pasteContent.trim().length > 0;
    if (activeTab === "url") return !!fetchedContent;
    return false;
  }, [activeTab, files, pasteContent, fetchedContent]);

  const importLabel = useMemo(() => {
    if (activeTab === "file" && files.length > 1) return `Import ${files.length} Files`;
    return "Import as New Draft";
  }, [activeTab, files]);

  // ─── Auto-detect title ─────────────────────────────────────────────────────

  const detectedTitle = useMemo(() => {
    if (activeTab === "file" && files.length === 1) {
      return extractTitle(files[0].content, files[0].name);
    }
    if (activeTab === "paste" && pasteContent.trim()) {
      return extractTitle(pasteContent);
    }
    if (activeTab === "url" && fetchedContent) {
      return extractTitle(fetchedContent);
    }
    return "";
  }, [activeTab, files, pasteContent, fetchedContent]);

  // Sync detected title when content changes
  const effectiveTitle = importTitle || detectedTitle;

  // ─── File handlers ─────────────────────────────────────────────────────────

  const readFileAsText = useCallback((file: File): Promise<FileEntry> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          name: file.name,
          size: file.size,
          content: reader.result as string,
        });
      };
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsText(file);
    });
  }, []);

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      const validExtensions = [".md", ".markdown", ".txt", ".html"];
      const validFiles = Array.from(fileList).filter((f) =>
        validExtensions.some((ext) => f.name.toLowerCase().endsWith(ext))
      );
      if (validFiles.length === 0) return;

      const entries = await Promise.all(validFiles.map(readFileAsText));
      setFiles((prev) => [...prev, ...entries]);

      // Auto-set title from first file if not yet set
      if (entries.length === 1 && !importTitle) {
        setImportTitle(extractTitle(entries[0].content, entries[0].name));
      }
    },
    [readFileAsText, importTitle]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleBrowse = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
      // Reset so the same file can be re-selected
      e.target.value = "";
    },
    [handleFiles]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ─── URL fetch handler ─────────────────────────────────────────────────────

  const handleFetchUrl = useCallback(async () => {
    const url = urlValue.trim();
    if (!url) return;

    setUrlFetching(true);
    setUrlError(null);
    setFetchedContent(null);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();

      // If it looks like HTML, extract the body text content
      if (text.trim().startsWith("<!") || text.trim().startsWith("<html")) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");
        // Try to get article content, fall back to body
        const article = doc.querySelector("article") || doc.querySelector("main") || doc.body;
        const cleaned = article?.innerHTML || text;
        setFetchedContent(cleaned);
      } else {
        setFetchedContent(text);
      }
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : "Failed to fetch URL");
    } finally {
      setUrlFetching(false);
    }
  }, [urlValue]);

  // ─── Import handler ────────────────────────────────────────────────────────

  const handleImport = useCallback(() => {
    if (activeTab === "file" && files.length > 0) {
      for (const file of files) {
        const title = files.length === 1 ? effectiveTitle : extractTitle(file.content, file.name);
        const html = markdownToHtml(file.content);
        createNewDocument();
        setTitle(title || "Imported Document");
        // Set content with a minimal JSONContent structure and the HTML
        setContent(
          { type: "doc", content: [{ type: "paragraph" }] },
          html
        );
      }
    } else if (activeTab === "paste" && pasteContent.trim()) {
      const html = markdownToHtml(pasteContent);
      createNewDocument();
      setTitle(effectiveTitle || "Imported Document");
      setContent(
        { type: "doc", content: [{ type: "paragraph" }] },
        html
      );
    } else if (activeTab === "url" && fetchedContent) {
      // URL-fetched content may already be HTML
      const html = fetchedContent.trim().startsWith("<")
        ? fetchedContent
        : markdownToHtml(fetchedContent);
      createNewDocument();
      setTitle(effectiveTitle || "Imported Document");
      setContent(
        { type: "doc", content: [{ type: "paragraph" }] },
        html
      );
    }

    setImported(true);
    setTimeout(() => onClose(), 600);
  }, [activeTab, files, pasteContent, fetchedContent, effectiveTitle, createNewDocument, setTitle, setContent, onClose]);

  // ─── Tab definitions ──────────────────────────────────────────────────────

  const tabs: { id: TabMode; label: string; icon: typeof Import }[] = [
    { id: "file", label: "File", icon: Upload },
    { id: "paste", label: "Paste", icon: ClipboardPaste },
    { id: "url", label: "URL", icon: Import },
  ];

  // ─── Show preview panel? ──────────────────────────────────────────────────

  const showPreview = activeContent !== null && activeContent.length > 0;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.txt,.html"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <Import className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Import Content</h2>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-5 pt-3 pb-0 shrink-0">
          <div className="flex items-center gap-1 p-0.5 bg-muted rounded-lg w-fit">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-1.5 h-7 px-3 rounded-md text-[11px] font-medium transition-all",
                  activeTab === id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content area — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* ─── File mode ──────────────────────────────────────────────── */}
          {activeTab === "file" && (
            <div className="space-y-3">
              {/* Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBrowse}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 py-10 rounded-xl border-2 border-dashed cursor-pointer transition-all",
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border/50 hover:border-primary/40 hover:bg-muted/30"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                  isDragging ? "bg-primary/10" : "bg-muted"
                )}>
                  <Upload className={cn(
                    "w-5 h-5 transition-colors",
                    isDragging ? "text-primary" : "text-muted-foreground/50"
                  )} />
                </div>
                <div className="text-center">
                  <p className="text-[12px] text-foreground font-medium">
                    Drop .md, .txt, or .html files here
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                    or click to browse
                  </p>
                </div>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                    {files.length} file{files.length !== 1 ? "s" : ""} selected
                  </span>
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40 bg-muted/20"
                    >
                      <FileText className="w-4 h-4 text-primary/60 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-foreground truncate">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50">
                          {formatFileSize(file.size)} &middot; {file.content.split("\n").length} lines
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Paste mode ─────────────────────────────────────────────── */}
          {activeTab === "paste" && (
            <div className="space-y-2">
              <div className="relative">
                <textarea
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder="Paste your markdown, HTML, or plain text here..."
                  className="w-full h-48 rounded-xl border border-border/50 bg-background px-4 py-3 text-[12px] text-foreground font-mono placeholder:text-muted-foreground/30 outline-none focus:border-primary/40 resize-none transition-colors"
                />
                <span className="absolute bottom-2.5 right-3 text-[9px] text-muted-foreground/30 tabular-nums">
                  {pasteContent.length.toLocaleString()} chars
                </span>
              </div>
            </div>
          )}

          {/* ─── URL mode ───────────────────────────────────────────────── */}
          {activeTab === "url" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  placeholder="https://example.com/blog-post"
                  onKeyDown={(e) => e.key === "Enter" && handleFetchUrl()}
                  className="flex-1 h-9 px-3 rounded-lg border border-border/50 bg-background text-[12px] text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/40 transition-colors"
                />
                <button
                  onClick={handleFetchUrl}
                  disabled={!urlValue.trim() || urlFetching}
                  className="h-9 px-4 rounded-lg bg-muted text-[11px] font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {urlFetching ? "Fetching..." : "Fetch"}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/40">
                Import from a public URL (blog post, article)
              </p>
              {urlError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-[11px] text-destructive/80">{urlError}</p>
                </div>
              )}
              {fetchedContent && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border/40 bg-muted/20">
                  <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  <p className="text-[11px] text-foreground/80">
                    Content fetched ({fetchedContent.length.toLocaleString()} characters)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ─── Preview section ────────────────────────────────────────── */}
          {showPreview && (
            <div className="space-y-3 pt-1">
              <div className="h-px bg-border/30" />

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                  Title
                </label>
                <input
                  type="text"
                  value={importTitle || detectedTitle}
                  onChange={(e) => setImportTitle(e.target.value)}
                  placeholder="Document title..."
                  className="w-full h-8 px-3 rounded-lg border border-border/50 bg-background text-[12px] text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/40 transition-colors"
                />
              </div>

              {/* Preview toggle */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                  Preview
                </span>
                <div className="flex items-center gap-1 p-0.5 bg-muted rounded-md">
                  <button
                    onClick={() => setPreviewMode("preview")}
                    className={cn(
                      "flex items-center gap-1 h-5.5 px-2 rounded text-[10px] font-medium transition-all",
                      previewMode === "preview"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Eye className="w-2.5 h-2.5" />
                    Preview
                  </button>
                  <button
                    onClick={() => setPreviewMode("source")}
                    className={cn(
                      "flex items-center gap-1 h-5.5 px-2 rounded text-[10px] font-medium transition-all",
                      previewMode === "source"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Code className="w-2.5 h-2.5" />
                    Source
                  </button>
                </div>
              </div>

              {/* Preview content */}
              <div className="rounded-xl border border-border/40 bg-background overflow-hidden">
                {previewMode === "preview" ? (
                  <div
                    className="prose prose-sm prose-invert max-w-none p-4 text-[12px] leading-relaxed text-foreground/90 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_li]:mb-0.5 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px] [&_pre]:bg-muted [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_a]:text-primary [&_a]:underline [&_hr]:border-border/30 [&_img]:max-w-full [&_img]:rounded-lg [&_.wiki-link]:text-primary/60 [&_.wiki-link]:underline [&_.wiki-link]:decoration-dotted"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                    style={{ maxHeight: 240, overflowY: "auto" }}
                  />
                ) : (
                  <pre
                    className="p-4 text-[11px] font-mono text-foreground/70 whitespace-pre-wrap break-words"
                    style={{ maxHeight: 240, overflowY: "auto" }}
                  >
                    {activeContent}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-border/30 shrink-0">
          <button
            onClick={handleImport}
            disabled={!canImport || imported}
            className={cn(
              "w-full h-9 rounded-lg text-[12px] font-medium transition-all flex items-center justify-center gap-2",
              imported
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {imported ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Imported Successfully
              </>
            ) : (
              <>
                <Import className="w-3.5 h-3.5" />
                {importLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
