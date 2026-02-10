import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useEditorStore, type DocumentStatus } from "@/stores/editor-store";
import { useProjectsStore } from "@/stores/projects-store";
import { toast } from "@/stores/toast-store";
import {
  Plus,
  FileText,
  Trash2,
  Pencil,
  Check,
  X,
  Download,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Search,
  ArrowUpDown,
  LayoutGrid,
  LayoutList,
  FolderInput,
  ChevronDown,
  GripVertical,
  Tag,
} from "lucide-react";
import { ImportDialog } from "./ImportDialog";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { TagFilter } from "./TagFilter";
import { TagEditor } from "./TagEditor";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────

interface DocMeta {
  id: string;
  title: string;
  updatedAt: string;
  wordCount: number;
  projectId: string | null;
  status: DocumentStatus;
  tags: string[];
}

type SortKey = "name" | "date" | "words";
type ViewMode = "list" | "grid";

// ─── Helpers ─────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
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

// ─── localStorage persistence for pins & archive ─────────────────────

const PINS_KEY = "station:doc-pins";
const ARCHIVE_KEY = "station:doc-archived";

function loadSetFromStorage(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    // ignore
  }
  return new Set();
}

function saveSetToStorage(key: string, s: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...s]));
}

// ─── Sort comparators ────────────────────────────────────────────────

function sortDocs(docs: DocMeta[], key: SortKey): DocMeta[] {
  const sorted = [...docs];
  switch (key) {
    case "name":
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "date":
      sorted.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
      break;
    case "words":
      sorted.sort((a, b) => b.wordCount - a.wordCount);
      break;
  }
  return sorted;
}

// ─── Main Component ──────────────────────────────────────────────────

export function DocumentList({ onClose }: { onClose: () => void }) {
  const {
    currentDocument,
    documents,
    loadDocument,
    createNewDocument,
    deleteDocument,
    renameDocument,
  } = useEditorStore();
  const { activeFilter, projects, moveDocument } = useProjectsStore();

  // ── Local UI state ──

  const [diskDocs, setDiskDocs] = useState<DocMeta[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showImport, setShowImport] = useState(false);

  // Tag filter + editor state
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [editingTagDocId, setEditingTagDocId] = useState<string | null>(null);

  // New feature states
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() =>
    loadSetFromStorage(PINS_KEY),
  );
  const [archivedIds, setArchivedIds] = useState<Set<string>>(() =>
    loadSetFromStorage(ARCHIVE_KEY),
  );
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);

  // Batch actions
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Drag & drop
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [manualOrder, setManualOrder] = useState<string[]>([]);

  // Refs
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const moveMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // ── Persist pin/archive changes ──

  useEffect(() => {
    saveSetToStorage(PINS_KEY, pinnedIds);
  }, [pinnedIds]);

  useEffect(() => {
    saveSetToStorage(ARCHIVE_KEY, archivedIds);
  }, [archivedIds]);

  // ── Close menus on outside click ──

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(e.target as Node)
      ) {
        setShowSortMenu(false);
      }
      if (
        moveMenuRef.current &&
        !moveMenuRef.current.contains(e.target as Node)
      ) {
        setShowMoveMenu(false);
      }
      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(e.target as Node)
      ) {
        setShowStatusMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Load document list from disk on mount ──

  useEffect(() => {
    (async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const metas = await invoke<any[]>("list_documents");
        setDiskDocs(
          metas.map((m: any) => ({
            id: m.id,
            title: m.title,
            updatedAt: m.updated_at,
            wordCount: m.word_count,
            projectId: m.project_id || null,
            status: (m.status as DocumentStatus) || "draft",
            tags: m.tags ?? [],
          })),
        );
      } catch {
        // Not in Tauri or no docs
      }
    })();
  }, []);

  // ── Merge in-memory + disk docs ──

  const allDocs: DocMeta[] = useMemo(() => {
    const result: DocMeta[] = [];
    const seenIds = new Set<string>();

    // Current document first
    result.push({
      id: currentDocument.id,
      title: currentDocument.title || "Untitled",
      updatedAt: currentDocument.updatedAt,
      wordCount: currentDocument.wordCount,
      projectId: currentDocument.projectId,
      status: currentDocument.status,
      tags: currentDocument.tags ?? [],
    });
    seenIds.add(currentDocument.id);

    // In-memory documents
    for (const doc of documents) {
      if (!seenIds.has(doc.id)) {
        result.push({
          id: doc.id,
          title: doc.title || "Untitled",
          updatedAt: doc.updatedAt,
          wordCount: doc.wordCount,
          projectId: doc.projectId,
          status: doc.status,
          tags: doc.tags ?? [],
        });
        seenIds.add(doc.id);
      }
    }

    // Disk documents
    for (const doc of diskDocs) {
      if (!seenIds.has(doc.id)) {
        result.push(doc);
        seenIds.add(doc.id);
      }
    }

    return result;
  }, [currentDocument, documents, diskDocs]);

  // ── Apply project filter ──

  const projectFiltered = useMemo(() => {
    return allDocs.filter((doc) => {
      switch (activeFilter) {
        case "all":
          return true;
        case "recent": {
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          return new Date(doc.updatedAt).getTime() > sevenDaysAgo;
        }
        case "drafts":
          return doc.status === "draft";
        case "scheduled":
          return doc.status === "scheduled";
        case "published":
          return doc.status === "published";
        default:
          return doc.projectId === activeFilter;
      }
    });
  }, [allDocs, activeFilter]);

  // ── Apply search, archive filter, sort, pin ordering ──

  const displayDocs = useMemo(() => {
    let docs = projectFiltered;

    // Filter by archive visibility
    if (!showArchived) {
      docs = docs.filter((d) => !archivedIds.has(d.id));
    }

    // Tag filter
    if (activeTag) {
      docs = docs.filter((d) => d.tags.includes(activeTag));
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      docs = docs.filter((d) => d.title.toLowerCase().includes(q));
    }

    // Sort
    docs = sortDocs(docs, sortKey);

    // Apply manual reorder if present and sort is by date (default)
    if (manualOrder.length > 0) {
      const orderMap = new Map(manualOrder.map((id, i) => [id, i]));
      const ordered = [...docs].sort((a, b) => {
        const aIdx = orderMap.get(a.id);
        const bIdx = orderMap.get(b.id);
        if (aIdx !== undefined && bIdx !== undefined) return aIdx - bIdx;
        if (aIdx !== undefined) return -1;
        if (bIdx !== undefined) return 1;
        return 0;
      });
      docs = ordered;
    }

    // Separate pinned from unpinned
    const pinned = docs.filter((d) => pinnedIds.has(d.id));
    const unpinned = docs.filter((d) => !pinnedIds.has(d.id));

    return { pinned, unpinned, all: [...pinned, ...unpinned] };
  }, [
    projectFiltered,
    showArchived,
    archivedIds,
    activeTag,
    searchQuery,
    sortKey,
    pinnedIds,
    manualOrder,
  ]);

  // ── Flat list for range selection ──
  const flatList = displayDocs.all;

  // ── Handlers ──

  const handleDelete = useCallback(
    async (id: string) => {
      if (id === currentDocument.id) {
        toast.warning("Cannot delete the active document");
        setDeletingId(null);
        return;
      }
      deleteDocument(id);
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("delete_document", { id });
      } catch {
        // best-effort
      }
      setDeletingId(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success("Document deleted");
    },
    [currentDocument.id, deleteDocument],
  );

  const handleRename = useCallback(
    (id: string) => {
      if (!renameValue.trim()) {
        setRenamingId(null);
        return;
      }
      renameDocument(id, renameValue.trim());
      setRenamingId(null);
      toast.success("Document renamed");
    },
    [renameValue, renameDocument],
  );

  const handleStatusChange = useCallback(
    async (id: string, newStatus: DocumentStatus) => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("set_document_status", {
          documentId: id,
          status: newStatus,
        });
        setDiskDocs((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d)),
        );
      } catch {
        // best-effort
      }
    },
    [],
  );

  // ── Pin / Unpin ──

  const togglePin = useCallback((id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // ── Archive / Unarchive ──

  const toggleArchive = useCallback((id: string) => {
    setArchivedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // ── Multi-select click handler ──

  const handleSelectClick = useCallback(
    (id: string, e: React.MouseEvent) => {
      if (e.shiftKey && lastClickedId) {
        // Range select
        const startIdx = flatList.findIndex((d) => d.id === lastClickedId);
        const endIdx = flatList.findIndex((d) => d.id === id);
        if (startIdx !== -1 && endIdx !== -1) {
          const lo = Math.min(startIdx, endIdx);
          const hi = Math.max(startIdx, endIdx);
          setSelectedIds((prev) => {
            const next = new Set(prev);
            for (let i = lo; i <= hi; i++) {
              next.add(flatList[i].id);
            }
            return next;
          });
        }
      } else if (e.ctrlKey || e.metaKey) {
        // Toggle
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
      } else {
        // Single toggle via checkbox area
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
      }
      setLastClickedId(id);
    },
    [flatList, lastClickedId],
  );

  // ── Batch actions ──

  const batchDelete = useCallback(async () => {
    const ids = [...selectedIds].filter((id) => id !== currentDocument.id);
    if (ids.length === 0) {
      toast.warning("Cannot delete the active document");
      return;
    }
    for (const id of ids) {
      deleteDocument(id);
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("delete_document", { id });
      } catch {
        // best-effort
      }
    }
    setSelectedIds(new Set());
    toast.success(`Deleted ${ids.length} document${ids.length > 1 ? "s" : ""}`);
  }, [selectedIds, currentDocument.id, deleteDocument]);

  const batchArchive = useCallback(() => {
    setArchivedIds((prev) => {
      const next = new Set(prev);
      for (const id of selectedIds) {
        next.add(id);
      }
      return next;
    });
    toast.success(`Archived ${selectedIds.size} document${selectedIds.size > 1 ? "s" : ""}`);
    setSelectedIds(new Set());
  }, [selectedIds]);

  const batchMoveToProject = useCallback(
    async (projectId: string | null) => {
      for (const docId of selectedIds) {
        try {
          await moveDocument(docId, projectId);
        } catch {
          // best-effort
        }
      }
      toast.success(
        `Moved ${selectedIds.size} document${selectedIds.size > 1 ? "s" : ""} to ${projectId ? projects.find((p) => p.id === projectId)?.name || "project" : "no project"}`,
      );
      setSelectedIds(new Set());
      setShowMoveMenu(false);
    },
    [selectedIds, moveDocument, projects],
  );

  const batchSetStatus = useCallback(
    async (newStatus: DocumentStatus) => {
      for (const id of selectedIds) {
        await handleStatusChange(id, newStatus);
      }
      toast.success(
        `Set ${selectedIds.size} document${selectedIds.size > 1 ? "s" : ""} to ${newStatus}`,
      );
      setSelectedIds(new Set());
      setShowStatusMenu(false);
    },
    [selectedIds, handleStatusChange],
  );

  // ── Drag & drop reorder ──

  const handleDragStart = useCallback(
    (e: React.DragEvent, id: string) => {
      setDraggedId(id);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", id);
      // If the doc is in the selection, drag all selected
      if (selectedIds.has(id)) {
        e.dataTransfer.setData(
          "application/x-station-docs",
          JSON.stringify([...selectedIds]),
        );
      } else {
        e.dataTransfer.setData(
          "application/x-station-docs",
          JSON.stringify([id]),
        );
      }
    },
    [selectedIds],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, id: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (id !== draggedId) {
        setDragOverId(id);
      }
    },
    [draggedId],
  );

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      setDragOverId(null);
      setDraggedId(null);

      if (!draggedId || draggedId === targetId) return;

      // Reorder: move dragged item to the position of target
      const currentOrder =
        manualOrder.length > 0 ? [...manualOrder] : flatList.map((d) => d.id);

      const dragIdx = currentOrder.indexOf(draggedId);
      const targetIdx = currentOrder.indexOf(targetId);

      if (dragIdx === -1 || targetIdx === -1) return;

      currentOrder.splice(dragIdx, 1);
      currentOrder.splice(targetIdx, 0, draggedId);

      setManualOrder(currentOrder);
    },
    [draggedId, manualOrder, flatList],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  // ── Sort label ──

  const sortLabel = sortKey === "name" ? "Name" : sortKey === "date" ? "Date" : "Words";

  // ── Count of archived docs in current filter ──
  const archivedCount = projectFiltered.filter((d) =>
    archivedIds.has(d.id),
  ).length;

  // ── Render document row (list view) ──

  const renderListItem = (doc: DocMeta) => {
    const isActive = doc.id === currentDocument.id;
    const isDeleting = deletingId === doc.id;
    const isRenaming = renamingId === doc.id;
    const isSelected = selectedIds.has(doc.id);
    const isPinned = pinnedIds.has(doc.id);
    const isArchived = archivedIds.has(doc.id);
    const isDragging = draggedId === doc.id;
    const isDragOver = dragOverId === doc.id;

    return (
      <div
        key={doc.id}
        draggable
        onDragStart={(e) => handleDragStart(e, doc.id)}
        onDragOver={(e) => handleDragOver(e, doc.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, doc.id)}
        onDragEnd={handleDragEnd}
        className={cn(
          "group relative px-3 py-2 cursor-pointer transition-all",
          isActive
            ? "bg-primary/10 text-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          isSelected && "bg-primary/8 ring-1 ring-primary/20",
          isArchived && "opacity-50",
          isDragging && "opacity-30",
          isDragOver && "border-t-2 border-primary/60",
        )}
        onClick={(e) => {
          if (isRenaming || isDeleting) return;
          // If clicking on the checkbox area, don't load document
          const target = e.target as HTMLElement;
          if (target.closest("[data-checkbox]")) return;
          if (e.ctrlKey || e.metaKey || e.shiftKey) {
            handleSelectClick(doc.id, e);
            return;
          }
          if (!isActive) {
            loadDocument(doc.id);
          }
        }}
      >
        {isDeleting ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-destructive">Delete?</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(doc.id);
              }}
              className="h-5 px-2 rounded bg-destructive/10 text-destructive text-[10px] font-medium hover:bg-destructive/20"
            >
              Yes
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeletingId(null);
              }}
              className="h-5 px-2 rounded bg-accent text-muted-foreground text-[10px] font-medium hover:bg-accent/80"
            >
              No
            </button>
          </div>
        ) : isRenaming ? (
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename(doc.id);
                if (e.key === "Escape") setRenamingId(null);
              }}
              className="flex-1 h-6 px-1.5 rounded border border-border bg-background text-xs outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={() => handleRename(doc.id)}
              className="h-5 w-5 rounded flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={() => setRenamingId(null)}
              className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:bg-accent"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              {/* Drag handle */}
              <GripVertical className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-30 cursor-grab" />

              {/* Checkbox */}
              <button
                data-checkbox
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectClick(doc.id, e);
                }}
                className={cn(
                  "w-3.5 h-3.5 shrink-0 rounded-[3px] border flex items-center justify-center transition-colors",
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/30 opacity-0 group-hover:opacity-100",
                )}
              >
                {isSelected && <Check className="w-2.5 h-2.5" />}
              </button>

              <FileText className="w-3.5 h-3.5 shrink-0 opacity-40" />
              <span className="text-[12px] font-medium truncate flex-1">
                {doc.title}
              </span>

              {isPinned && (
                <Pin className="w-3 h-3 shrink-0 text-primary/60 fill-primary/30" />
              )}

              <DocumentStatusBadge
                status={doc.status}
                onClick={(newStatus) => handleStatusChange(doc.id, newStatus)}
              />
            </div>

            <div className="flex items-center gap-2 mt-0.5 pl-[68px]">
              <span className="text-[10px] text-muted-foreground/40">
                {timeAgo(doc.updatedAt)}
              </span>
              <span className="text-[10px] text-muted-foreground/30">
                &middot;
              </span>
              <span className="text-[10px] text-muted-foreground/40">
                {doc.wordCount.toLocaleString()} words
              </span>
              {isArchived && (
                <>
                  <span className="text-[10px] text-muted-foreground/30">
                    &middot;
                  </span>
                  <span className="text-[9px] text-amber-500/60 font-medium">
                    Archived
                  </span>
                </>
              )}
            </div>

            {/* Hover actions */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-card/80 backdrop-blur-sm rounded-md px-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(doc.id);
                }}
                className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/50 hover:text-primary hover:bg-primary/10"
                title={isPinned ? "Unpin" : "Pin"}
              >
                {isPinned ? (
                  <PinOff className="w-2.5 h-2.5" />
                ) : (
                  <Pin className="w-2.5 h-2.5" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleArchive(doc.id);
                }}
                className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/50 hover:text-amber-500 hover:bg-amber-500/10"
                title={isArchived ? "Unarchive" : "Archive"}
              >
                {isArchived ? (
                  <ArchiveRestore className="w-2.5 h-2.5" />
                ) : (
                  <Archive className="w-2.5 h-2.5" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTagDocId(editingTagDocId === doc.id ? null : doc.id);
                }}
                className={cn(
                  "h-5 w-5 rounded flex items-center justify-center transition-colors",
                  editingTagDocId === doc.id
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground/50 hover:text-primary hover:bg-primary/10",
                )}
                title="Tags"
              >
                <Tag className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRenamingId(doc.id);
                  setRenameValue(doc.title);
                }}
                className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-accent"
                title="Rename"
              >
                <Pencil className="w-2.5 h-2.5" />
              </button>
              {!isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingId(doc.id);
                  }}
                  className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                  title="Delete"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            {/* Inline tag editor */}
            {editingTagDocId === doc.id && (
              <div className="mt-1.5 pl-[28px]" onClick={(e) => e.stopPropagation()}>
                <TagEditor docId={doc.id} tags={doc.tags} onClose={() => setEditingTagDocId(null)} />
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ── Render document card (grid view) ──

  const renderGridItem = (doc: DocMeta) => {
    const isActive = doc.id === currentDocument.id;
    const isSelected = selectedIds.has(doc.id);
    const isPinned = pinnedIds.has(doc.id);
    const isArchived = archivedIds.has(doc.id);
    const isDragging = draggedId === doc.id;
    const isDragOver = dragOverId === doc.id;

    return (
      <div
        key={doc.id}
        draggable
        onDragStart={(e) => handleDragStart(e, doc.id)}
        onDragOver={(e) => handleDragOver(e, doc.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, doc.id)}
        onDragEnd={handleDragEnd}
        className={cn(
          "group relative rounded-lg border p-2.5 cursor-pointer transition-all",
          isActive
            ? "bg-primary/10 border-primary/30 text-foreground"
            : "border-border/30 text-muted-foreground hover:bg-accent/50 hover:text-foreground hover:border-border/60",
          isSelected && "ring-1 ring-primary/30 bg-primary/5",
          isArchived && "opacity-50",
          isDragging && "opacity-30",
          isDragOver && "ring-2 ring-primary/60",
        )}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("[data-checkbox]")) return;
          if (e.ctrlKey || e.metaKey || e.shiftKey) {
            handleSelectClick(doc.id, e);
            return;
          }
          if (!isActive) {
            loadDocument(doc.id);
          }
        }}
      >
        {/* Checkbox top-left */}
        <button
          data-checkbox
          onClick={(e) => {
            e.stopPropagation();
            handleSelectClick(doc.id, e);
          }}
          className={cn(
            "absolute top-1.5 left-1.5 w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-all z-10",
            isSelected
              ? "bg-primary border-primary text-primary-foreground"
              : "border-muted-foreground/30 opacity-0 group-hover:opacity-100",
          )}
        >
          {isSelected && <Check className="w-2.5 h-2.5" />}
        </button>

        {/* Pin indicator top-right */}
        {isPinned && (
          <Pin className="absolute top-1.5 right-1.5 w-3 h-3 text-primary/60 fill-primary/30" />
        )}

        <div className="flex items-center gap-1.5 mb-1.5">
          <FileText className="w-3.5 h-3.5 shrink-0 opacity-40" />
          <span className="text-[11px] font-medium truncate flex-1">
            {doc.title}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-muted-foreground/40">
              {timeAgo(doc.updatedAt)}
            </span>
            <span className="text-[9px] text-muted-foreground/30">
              &middot;
            </span>
            <span className="text-[9px] text-muted-foreground/40">
              {doc.wordCount.toLocaleString()}w
            </span>
          </div>
          <DocumentStatusBadge
            status={doc.status}
            onClick={(newStatus) => handleStatusChange(doc.id, newStatus)}
          />
        </div>

        {isArchived && (
          <span className="text-[8px] text-amber-500/60 font-medium mt-1 block">
            Archived
          </span>
        )}

        {/* Hover actions overlay for grid */}
        <div className="absolute top-0 right-0 bottom-0 left-0 hidden group-hover:flex items-end justify-end p-1 pointer-events-none">
          <div className="flex items-center gap-0.5 pointer-events-auto bg-card/90 backdrop-blur-sm rounded-md px-0.5 py-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePin(doc.id);
              }}
              className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/50 hover:text-primary hover:bg-primary/10"
              title={isPinned ? "Unpin" : "Pin"}
            >
              {isPinned ? (
                <PinOff className="w-2.5 h-2.5" />
              ) : (
                <Pin className="w-2.5 h-2.5" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleArchive(doc.id);
              }}
              className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/50 hover:text-amber-500 hover:bg-amber-500/10"
              title={isArchived ? "Unarchive" : "Archive"}
            >
              {isArchived ? (
                <ArchiveRestore className="w-2.5 h-2.5" />
              ) : (
                <Archive className="w-2.5 h-2.5" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRenamingId(doc.id);
                setRenameValue(doc.title);
              }}
              className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-accent"
              title="Rename"
            >
              <Pencil className="w-2.5 h-2.5" />
            </button>
            {doc.id !== currentDocument.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingId(doc.id);
                }}
                className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                title="Delete"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Render ──

  return (
    <div className="w-[280px] border-r border-border/40 bg-card/30 flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Documents
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowImport(true)}
            className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-accent/80 transition-colors"
            title="Import Posts"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              createNewDocument();
              toast.success("New document created");
            }}
            className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-accent/80 transition-colors"
            title="New Document"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-accent/80 transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search + controls bar */}
      <div className="px-2 pt-2 pb-1 space-y-1.5 border-b border-border/20">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/40" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-7 pl-7 pr-2 rounded-md border border-border/30 bg-background/50 text-[11px] text-foreground placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-ring/40 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-4 w-4 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        {/* Tag filter pills */}
        <TagFilter activeTag={activeTag} onTagSelect={setActiveTag} />

        {/* Controls row: Sort, View toggle, Archive toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Sort dropdown */}
            <div className="relative" ref={sortMenuRef}>
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="h-6 px-1.5 rounded-md flex items-center gap-1 text-muted-foreground/60 hover:text-foreground hover:bg-accent/80 transition-colors"
                title="Sort by"
              >
                <ArrowUpDown className="w-3 h-3" />
                <span className="text-[10px]">{sortLabel}</span>
                <ChevronDown className="w-2.5 h-2.5" />
              </button>

              {showSortMenu && (
                <div className="absolute left-0 top-full mt-1 z-50 w-32 rounded-lg border border-border/40 bg-card shadow-lg py-1">
                  {(
                    [
                      { key: "date", label: "Date Modified" },
                      { key: "name", label: "Name" },
                      { key: "words", label: "Word Count" },
                    ] as { key: SortKey; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setSortKey(opt.key);
                        setManualOrder([]); // reset manual order on sort change
                        setShowSortMenu(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-[11px] hover:bg-accent/60 transition-colors",
                        sortKey === opt.key
                          ? "text-foreground font-medium"
                          : "text-muted-foreground",
                      )}
                    >
                      {opt.label}
                      {sortKey === opt.key && (
                        <Check className="w-3 h-3 inline-block ml-1 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            {/* Archive toggle */}
            {archivedCount > 0 && (
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={cn(
                  "h-6 px-1.5 rounded-md flex items-center gap-1 transition-colors",
                  showArchived
                    ? "text-amber-500 bg-amber-500/10"
                    : "text-muted-foreground/60 hover:text-foreground hover:bg-accent/80",
                )}
                title={showArchived ? "Hide archived" : "Show archived"}
              >
                <Archive className="w-3 h-3" />
                <span className="text-[10px]">{archivedCount}</span>
              </button>
            )}

            {/* View mode toggle */}
            <button
              onClick={() =>
                setViewMode((v) => (v === "list" ? "grid" : "list"))
              }
              className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-accent/80 transition-colors"
              title={viewMode === "list" ? "Grid view" : "List view"}
            >
              {viewMode === "list" ? (
                <LayoutGrid className="w-3 h-3" />
              ) : (
                <LayoutList className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Document list / grid */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === "list" ? (
          <div className="py-1">
            {/* Pinned section */}
            {displayDocs.pinned.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-1">
                  <span className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                    Pinned
                  </span>
                </div>
                {displayDocs.pinned.map(renderListItem)}

                {/* Divider if there are unpinned docs too */}
                {displayDocs.unpinned.length > 0 && (
                  <div className="mx-3 my-1 border-b border-border/20" />
                )}
              </>
            )}

            {/* Unpinned section */}
            {displayDocs.unpinned.length > 0 && (
              <>
                {displayDocs.pinned.length > 0 && (
                  <div className="px-3 pt-1 pb-1">
                    <span className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                      Documents
                    </span>
                  </div>
                )}
                {displayDocs.unpinned.map(renderListItem)}
              </>
            )}

            {displayDocs.all.length === 0 && (
              <p className="text-xs text-muted-foreground/40 text-center mt-8 px-4">
                {searchQuery
                  ? "No documents match your search."
                  : "No documents found. Click + to create one."}
              </p>
            )}
          </div>
        ) : (
          <div className="p-2">
            {/* Grid: pinned section */}
            {displayDocs.pinned.length > 0 && (
              <>
                <div className="px-1 pt-1 pb-1.5">
                  <span className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                    Pinned
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {displayDocs.pinned.map(renderGridItem)}
                </div>
              </>
            )}

            {/* Grid: unpinned section */}
            {displayDocs.unpinned.length > 0 && (
              <>
                {displayDocs.pinned.length > 0 && (
                  <div className="px-1 pt-0.5 pb-1.5">
                    <span className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                      Documents
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-1.5">
                  {displayDocs.unpinned.map(renderGridItem)}
                </div>
              </>
            )}

            {displayDocs.all.length === 0 && (
              <p className="text-xs text-muted-foreground/40 text-center mt-8 px-4">
                {searchQuery
                  ? "No documents match your search."
                  : "No documents found. Click + to create one."}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Batch actions toolbar - shown when 2+ docs selected */}
      {selectedIds.size >= 2 && (
        <div className="border-t border-border/40 bg-card/80 backdrop-blur-sm px-2 py-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground font-medium">
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center gap-1">
            {/* Move to Project */}
            <div className="relative" ref={moveMenuRef}>
              <button
                onClick={() => {
                  setShowMoveMenu(!showMoveMenu);
                  setShowStatusMenu(false);
                }}
                className="h-7 px-2 rounded-md flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-accent/60 hover:bg-accent hover:text-foreground transition-colors"
                title="Move to project"
              >
                <FolderInput className="w-3 h-3" />
                <span>Move</span>
              </button>

              {showMoveMenu && (
                <div className="absolute bottom-full left-0 mb-1 z-50 w-44 rounded-lg border border-border/40 bg-card shadow-lg py-1">
                  <button
                    onClick={() => batchMoveToProject(null)}
                    className="w-full text-left px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-accent/60 transition-colors"
                  >
                    No Project
                  </button>
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => batchMoveToProject(p.id)}
                      className="w-full text-left px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-accent/60 transition-colors flex items-center gap-2"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: p.color || "#888" }}
                      />
                      {p.name}
                    </button>
                  ))}
                  {projects.length === 0 && (
                    <span className="block px-3 py-1.5 text-[10px] text-muted-foreground/40">
                      No projects yet
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Set Status */}
            <div className="relative" ref={statusMenuRef}>
              <button
                onClick={() => {
                  setShowStatusMenu(!showStatusMenu);
                  setShowMoveMenu(false);
                }}
                className="h-7 px-2 rounded-md flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-accent/60 hover:bg-accent hover:text-foreground transition-colors"
                title="Set status"
              >
                <ChevronDown className="w-3 h-3" />
                <span>Status</span>
              </button>

              {showStatusMenu && (
                <div className="absolute bottom-full left-0 mb-1 z-50 w-32 rounded-lg border border-border/40 bg-card shadow-lg py-1">
                  {(
                    ["draft", "review", "scheduled", "published"] as DocumentStatus[]
                  ).map((s) => (
                    <button
                      key={s}
                      onClick={() => batchSetStatus(s)}
                      className="w-full text-left px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-accent/60 transition-colors capitalize"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Archive */}
            <button
              onClick={batchArchive}
              className="h-7 px-2 rounded-md flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-accent/60 hover:bg-amber-500/15 hover:text-amber-600 transition-colors"
              title="Archive selected"
            >
              <Archive className="w-3 h-3" />
            </button>

            {/* Delete */}
            <button
              onClick={batchDelete}
              className="h-7 px-2 rounded-md flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-accent/60 hover:bg-destructive/15 hover:text-destructive transition-colors ml-auto"
              title="Delete selected"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {showImport && <ImportDialog onClose={() => setShowImport(false)} />}
    </div>
  );
}
