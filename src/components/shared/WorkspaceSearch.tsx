import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Search, FileText, Folder, Paintbrush, BarChart3, Clock,
  ArrowRight, Command, Hash, X, Calendar, Zap, Import, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

// ─── Types ───────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  type: "document" | "project" | "action";
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor?: string;
  action: () => void;
}

// ─── localStorage persistence ────────────────────────────────────────

const RECENT_KEY = "station:recent-searches";
const MAX_RECENT = 5;

function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveRecentSearch(query: string) {
  const recent = loadRecentSearches();
  const filtered = recent.filter((r) => r !== query);
  const updated = [query, ...filtered].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}

// ─── Fuzzy match helper ──────────────────────────────────────────────

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;

  // Character-by-character fuzzy
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  // Exact match at start = highest
  if (t.startsWith(q)) return 100;
  // Contains = high
  if (t.includes(q)) return 80;

  // Fuzzy score based on consecutive matches
  let score = 0;
  let qi = 0;
  let consecutive = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++;
      consecutive++;
      score += consecutive * 2;
    } else {
      consecutive = 0;
    }
  }
  return qi === q.length ? score : 0;
}

// ─── Relative time ───────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Component ───────────────────────────────────────────────────────

export function WorkspaceSearch({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecentSearches);

  const { documents, currentDocument, loadDocument, createNewDocument, setShowImportDialog } = useEditorStore();
  const { projects } = useProjectsStore();
  const { setActiveWorkspace } = useWorkspaceStore();

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setRecentSearches(loadRecentSearches());
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // All documents merged
  const allDocuments = useMemo(() => {
    const stored = documents ?? [];
    const ids = new Set(stored.map((d) => d.id));
    if (currentDocument && !ids.has(currentDocument.id)) {
      return [currentDocument, ...stored];
    }
    return stored;
  }, [documents, currentDocument]);

  // Quick actions
  const quickActions: SearchResult[] = useMemo(
    () => [
      {
        id: "action-new-doc",
        type: "action" as const,
        title: "New Document",
        subtitle: "Create a new draft",
        icon: Plus,
        iconColor: "text-emerald-500",
        action: () => {
          createNewDocument();
          setActiveWorkspace("editor");
          onClose();
        },
      },
      {
        id: "action-canvas",
        type: "action" as const,
        title: "Open Canvas",
        subtitle: "Design workspace",
        icon: Paintbrush,
        iconColor: "text-violet-500",
        action: () => {
          setActiveWorkspace("canvas");
          onClose();
        },
      },
      {
        id: "action-analytics",
        type: "action" as const,
        title: "Open Analytics",
        subtitle: "View performance",
        icon: BarChart3,
        iconColor: "text-blue-500",
        action: () => {
          setActiveWorkspace("analytics");
          onClose();
        },
      },
      {
        id: "action-import",
        type: "action" as const,
        title: "Import Content",
        subtitle: "Markdown, HTML, or URL",
        icon: Import,
        iconColor: "text-amber-500",
        action: () => {
          setShowImportDialog(true);
          setActiveWorkspace("editor");
          onClose();
        },
      },
      {
        id: "action-calendar",
        type: "action" as const,
        title: "Open Calendar",
        subtitle: "Content schedule",
        icon: Calendar,
        iconColor: "text-cyan-500",
        action: () => {
          setActiveWorkspace("calendar");
          onClose();
        },
      },
      {
        id: "action-distribute",
        type: "action" as const,
        title: "Distribute",
        subtitle: "Share everywhere",
        icon: Zap,
        iconColor: "text-orange-500",
        action: () => {
          setActiveWorkspace("distribute");
          onClose();
        },
      },
    ],
    [createNewDocument, setActiveWorkspace, setShowImportDialog, onClose],
  );

  // Search results
  const results: SearchResult[] = useMemo(() => {
    if (!query.trim()) {
      // Show quick actions when no query
      return quickActions;
    }

    const q = query.trim();
    const items: (SearchResult & { score: number })[] = [];

    // Search documents
    for (const doc of allDocuments) {
      const title = doc.title || "Untitled";
      const score = fuzzyScore(q, title);
      if (score > 0) {
        items.push({
          id: `doc-${doc.id}`,
          type: "document",
          title,
          subtitle: `${doc.wordCount.toLocaleString()} words · ${relativeTime(doc.updatedAt)} · ${doc.status}`,
          icon: FileText,
          iconColor: "text-foreground/60",
          score,
          action: () => {
            loadDocument(doc.id);
            setActiveWorkspace("editor");
            saveRecentSearch(q);
            onClose();
          },
        });
      }
    }

    // Search projects
    for (const project of projects) {
      const score = fuzzyScore(q, project.name);
      if (score > 0) {
        items.push({
          id: `proj-${project.id}`,
          type: "project",
          title: project.name,
          subtitle: `${project.documentCount} documents`,
          icon: Folder,
          iconColor: "text-foreground/60",
          score,
          action: () => {
            // Navigate to editor with project filter
            const { setActiveFilter } = useProjectsStore.getState();
            setActiveFilter(project.id);
            setActiveWorkspace("editor");
            saveRecentSearch(q);
            onClose();
          },
        });
      }
    }

    // Search quick actions
    for (const action of quickActions) {
      const score = fuzzyScore(q, action.title);
      if (score > 0) {
        items.push({
          ...action,
          score,
          action: () => {
            saveRecentSearch(q);
            action.action();
          },
        });
      }
    }

    // Sort by score descending
    items.sort((a, b) => b.score - a.score);

    return items.slice(0, 20);
  }, [query, allDocuments, projects, quickActions, loadDocument, setActiveWorkspace, onClose]);

  // Group results
  const groupedResults = useMemo(() => {
    const groups: { label: string; items: SearchResult[] }[] = [];

    const docs = results.filter((r) => r.type === "document");
    const projs = results.filter((r) => r.type === "project");
    const actions = results.filter((r) => r.type === "action");

    if (docs.length > 0) groups.push({ label: "Documents", items: docs });
    if (projs.length > 0) groups.push({ label: "Projects", items: projs });
    if (actions.length > 0) groups.push({ label: query.trim() ? "Actions" : "Quick Actions", items: actions });

    return groups;
  }, [results, query]);

  // Flat indexed list for keyboard nav
  const flatResults = useMemo(
    () => groupedResults.flatMap((g) => g.items),
    [groupedResults],
  );

  // Reset index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (flatResults[selectedIndex]) {
            flatResults[selectedIndex].action();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [flatResults, selectedIndex, onClose],
  );

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector("[data-selected=true]");
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Handle recent search click
  const handleRecentClick = useCallback((search: string) => {
    setQuery(search);
  }, []);

  // Clear recent
  const clearRecent = useCallback(() => {
    localStorage.removeItem(RECENT_KEY);
    setRecentSearches([]);
  }, []);

  if (!isOpen) return null;

  let flatIdx = 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search dialog */}
      <div className="relative w-[560px] max-h-[60vh] bg-card border border-border/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30">
          <Search className="w-5 h-5 text-muted-foreground/50 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search documents, projects, actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-[16px] text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="h-5 px-1.5 rounded border border-border/50 text-[10px] text-muted-foreground/40 font-mono flex items-center">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="flex-1 overflow-y-auto py-2">
          {/* Recent searches (only when empty query) */}
          {!query.trim() && recentSearches.length > 0 && (
            <div className="px-3 pb-2 mb-1 border-b border-border/20">
              <div className="flex items-center justify-between px-2 pb-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                  Recent
                </span>
                <button
                  onClick={clearRecent}
                  className="text-[10px] text-muted-foreground/40 hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => handleRecentClick(search)}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left hover:bg-accent/60 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                  <span className="text-[13px] text-muted-foreground">
                    {search}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Grouped results */}
          {groupedResults.map((group) => (
            <div key={group.label} className="mb-1">
              <div className="px-5 pt-2 pb-1">
                <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                  {group.label}
                </span>
              </div>
              {group.items.map((result) => {
                const idx = flatIdx++;
                const isSelected = idx === selectedIndex;
                const Icon = result.icon;

                return (
                  <button
                    key={result.id}
                    data-selected={isSelected}
                    onClick={() => result.action()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      "w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors",
                      isSelected
                        ? "bg-primary/8 text-foreground"
                        : "text-muted-foreground hover:bg-accent/40",
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        isSelected ? "bg-primary/12" : "bg-accent/60",
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4",
                          result.iconColor || "text-foreground/60",
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-[13px] font-medium truncate",
                          isSelected ? "text-foreground" : "",
                        )}
                      >
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-[11px] text-muted-foreground/50 truncate mt-0.5">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1 shrink-0">
                        <kbd className="h-5 px-1.5 rounded border border-border/40 text-[10px] text-muted-foreground/40 font-mono flex items-center">
                          <ArrowRight className="w-2.5 h-2.5" />
                        </kbd>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {query.trim() && flatResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10">
              <Search className="w-8 h-8 text-muted-foreground/20 mb-3" />
              <p className="text-[13px] text-muted-foreground/50">
                No results for &ldquo;{query}&rdquo;
              </p>
              <p className="text-[11px] text-muted-foreground/30 mt-1">
                Try a different search term
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-border/20 bg-card/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <kbd className="h-4 px-1 rounded border border-border/40 text-[9px] text-muted-foreground/40 font-mono">
                ↑↓
              </kbd>
              <span className="text-[10px] text-muted-foreground/30">Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="h-4 px-1 rounded border border-border/40 text-[9px] text-muted-foreground/40 font-mono">
                ↵
              </kbd>
              <span className="text-[10px] text-muted-foreground/30">Open</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="h-4 px-1 rounded border border-border/40 text-[9px] text-muted-foreground/40 font-mono">
                esc
              </kbd>
              <span className="text-[10px] text-muted-foreground/30">Close</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Command className="w-3 h-3 text-muted-foreground/30" />
            <span className="text-[10px] text-muted-foreground/30">Station Search</span>
          </div>
        </div>
      </div>
    </div>
  );
}
