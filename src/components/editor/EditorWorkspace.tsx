import { useState, useCallback, useEffect } from "react";
import { TiptapEditor } from "./TiptapEditor";
import { EditorToolbar } from "./EditorToolbar";
import { FindReplace } from "./FindReplace";
import { EditorSidebar } from "./EditorSidebar";
import { AiAssistant } from "./AiAssistant";
import { EditorProvider } from "./EditorContext";
import { DocumentList } from "./DocumentList";
import { ProjectSidebar } from "./ProjectSidebar";
import { VersionHistory } from "./VersionHistory";
import { ImportDialog } from "./ImportDialog";
import { useEditorStore } from "@/stores/editor-store";
import { useSettingsStore } from "@/stores/settings-store";
import { X, Sparkles, BarChart3, Send } from "lucide-react";

// ─── First-Run Hints ───

function WelcomeBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="mx-auto max-w-[720px] px-10 mt-4">
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/5 border border-primary/15 text-sm">
        <span className="text-base">👋</span>
        <p className="flex-1 text-foreground/80">
          <span className="font-medium text-foreground">Welcome!</span> This is a sample post.
          Edit it, explore the tabs on the right, or create a new document to start fresh.
        </p>
        <button
          onClick={onDismiss}
          className="shrink-0 p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function HintBadge({ label, icon: Icon, onDismiss }: { label: string; icon: typeof Sparkles; onDismiss: () => void }) {
  return (
    <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full z-50 pointer-events-auto animate-in fade-in slide-in-from-bottom-1 duration-300">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-popover border border-border shadow-lg text-[11px] text-muted-foreground whitespace-nowrap">
        <Icon className="w-3 h-3 text-primary shrink-0" />
        <span>{label}</span>
        <button onClick={onDismiss} className="ml-1 p-0.5 rounded hover:bg-muted text-muted-foreground/60 hover:text-foreground">
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
}

export default function EditorWorkspace() {
  const { currentDocument, setTitle, showImportDialog, setShowImportDialog } = useEditorStore();
  const { editorFontSize, editorLineHeight } = useSettingsStore();
  const [showFind, setShowFind] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [showDocList, setShowDocList] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // First-run hints state
  const [showWelcome, setShowWelcome] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("station:welcome-dismissed");
  });
  const [hintsState, setHintsState] = useState(() => {
    if (typeof window === "undefined") return { publish: false, ai: false, insights: false };
    const dismissed = localStorage.getItem("station:hints-dismissed");
    if (dismissed) return { publish: false, ai: false, insights: false };
    return { publish: true, ai: true, insights: true };
  });

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
    localStorage.setItem("station:welcome-dismissed", "1");
  }, []);

  const dismissHint = useCallback((key: "publish" | "ai" | "insights") => {
    setHintsState((prev) => {
      const next = { ...prev, [key]: false };
      // If all dismissed, persist
      if (!next.publish && !next.ai && !next.insights) {
        localStorage.setItem("station:hints-dismissed", "1");
      }
      return next;
    });
  }, []);

  const toggleFind = useCallback(() => setShowFind((v) => !v), []);
  const toggleAi = useCallback(() => setShowAi((v) => !v), []);

  // Ctrl+H / Ctrl+F global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "h" || e.key === "f")) {
        e.preventDefault();
        setShowFind(true);
      }
      // Ctrl+J for AI assistant
      if ((e.ctrlKey || e.metaKey) && e.key === "j") {
        e.preventDefault();
        setShowAi((v) => !v);
      }
      // Ctrl+D for document list
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        setShowDocList((v) => !v);
      }
      // Ctrl+Shift+P for projects sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === "p" && e.shiftKey) {
        e.preventDefault();
        setShowProjects((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <EditorProvider>
      <div className="h-full flex">
        {/* Projects sidebar */}
        {showProjects && <ProjectSidebar onClose={() => setShowProjects(false)} />}

        {/* Document list panel */}
        {showDocList && <DocumentList onClose={() => setShowDocList(false)} />}

        {/* Main editor area */}
        <div className="flex-1 flex flex-col min-w-0">
          <EditorToolbar
            onToggleFind={toggleFind}
            onToggleAi={toggleAi}
            showAi={showAi}
            onToggleDocList={() => setShowDocList((v) => !v)}
            showDocList={showDocList}
            onToggleProjects={() => setShowProjects((v) => !v)}
            showProjects={showProjects}
            onToggleVersionHistory={() => setShowVersionHistory((v) => !v)}
            showVersionHistory={showVersionHistory}
          />

          {/* First-run feature hints */}
          {(hintsState.publish || hintsState.ai || hintsState.insights) && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-muted/30 border-b border-border/20">
              <span className="text-[10px] text-muted-foreground/40 font-medium mr-1">Tips:</span>
              {hintsState.publish && (
                <button
                  onClick={() => dismissHint("publish")}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/8 border border-primary/15 text-[10.5px] text-foreground/70 hover:bg-primary/12 transition-colors group"
                >
                  <Send className="w-3 h-3 text-primary" />
                  <span>Publish to Beehiiv, Substack, or Ghost</span>
                  <X className="w-2.5 h-2.5 text-muted-foreground/40 group-hover:text-foreground/60" />
                </button>
              )}
              {hintsState.ai && (
                <button
                  onClick={() => dismissHint("ai")}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/8 border border-primary/15 text-[10.5px] text-foreground/70 hover:bg-primary/12 transition-colors group"
                >
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span>AI writing assistant — Ctrl+J</span>
                  <X className="w-2.5 h-2.5 text-muted-foreground/40 group-hover:text-foreground/60" />
                </button>
              )}
              {hintsState.insights && (
                <button
                  onClick={() => dismissHint("insights")}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/8 border border-primary/15 text-[10.5px] text-foreground/70 hover:bg-primary/12 transition-colors group"
                >
                  <BarChart3 className="w-3 h-3 text-primary" />
                  <span>Live readability scores in Insights tab →</span>
                  <X className="w-2.5 h-2.5 text-muted-foreground/40 group-hover:text-foreground/60" />
                </button>
              )}
            </div>
          )}

          {/* Editor content area with relative positioning for FindReplace overlay */}
          <div className="flex-1 relative overflow-y-auto">
            <FindReplace isOpen={showFind} onClose={() => setShowFind(false)} />

            {/* Welcome banner for first-time users */}
            {showWelcome && <WelcomeBanner onDismiss={dismissWelcome} />}

            <div
              className="max-w-[720px] mx-auto px-10 py-8"
              style={{ fontSize: `${editorFontSize}px`, lineHeight: editorLineHeight }}
            >
              {/* Document title — professional treatment */}
              <input
                value={currentDocument.title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled"
                className="w-full text-[32px] font-bold bg-transparent outline-none placeholder:text-muted-foreground/25 mb-1 text-foreground tracking-tight leading-tight"
                style={{ letterSpacing: "-0.025em" }}
              />
              <div className="h-px bg-border/40 mb-6" />

              {/* Rich text editor */}
              <TiptapEditor />
            </div>
          </div>
        </div>

        {/* Version History panel */}
        {showVersionHistory && !showAi && (
          <div className="w-64 border-l border-border bg-card/50 shrink-0">
            <VersionHistory onClose={() => setShowVersionHistory(false)} />
          </div>
        )}

        {/* AI Assistant panel */}
        <AiAssistant isOpen={showAi} onClose={() => setShowAi(false)} />

        {/* Right sidebar (outline/details) */}
        {!showAi && !showVersionHistory && <EditorSidebar />}

        {/* Import dialog */}
        {showImportDialog && (
          <ImportDialog onClose={() => setShowImportDialog(false)} />
        )}
      </div>
    </EditorProvider>
  );
}
