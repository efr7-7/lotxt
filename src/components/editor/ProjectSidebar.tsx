import { useState, useEffect, useCallback, useMemo } from "react";
import { useProjectsStore, type Project } from "@/stores/projects-store";
import { useEditorStore } from "@/stores/editor-store";
import {
  FolderPlus, Folder, FileText, Clock, PenLine, CalendarDays,
  CheckCircle2, ChevronRight, ChevronDown, Trash2, Pencil,
  Check, X, MoreHorizontal, Pin, Archive, GripVertical, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/stores/toast-store";

// ─── Constants ───────────────────────────────────────────────────────

const PROJECT_COLORS = [
  "#7c3aed", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444",
  "#ec4899", "#06b6d4", "#8b5cf6", "#f97316", "#14b8a6",
];

const PINS_KEY = "station:doc-pins";
const ARCHIVE_KEY = "station:doc-archived";

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

// ─── Component ───────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

export function ProjectSidebar({ onClose }: Props) {
  const {
    projects, activeFilter, setActiveFilter,
    fetchProjects, createProject, updateProject, deleteProject, moveDocument,
  } = useProjectsStore();
  const { documents, currentDocument } = useEditorStore();

  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [contextMenu, setContextMenu] = useState<string | null>(null);

  // Collapsible sections
  const [foldersCollapsed, setFoldersCollapsed] = useState(false);
  const [projectsCollapsed, setProjectsCollapsed] = useState(false);

  // Drag targets
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null);
  const [dragOverSmartId, setDragOverSmartId] = useState<string | null>(null);

  // Project drag reorder
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [dragOverReorderId, setDragOverReorderId] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  // ── Smart folder counts ──

  const allDocs = useMemo(() => {
    const stored = documents ?? [];
    const ids = new Set(stored.map((d) => d.id));
    if (currentDocument && !ids.has(currentDocument.id)) {
      return [currentDocument, ...stored];
    }
    return stored;
  }, [documents, currentDocument]);

  const pinnedIds = useMemo(() => loadSet(PINS_KEY), []);
  const archivedIds = useMemo(() => loadSet(ARCHIVE_KEY), []);

  const smartCounts = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    return {
      all: allDocs.length,
      recent: allDocs.filter((d) => new Date(d.updatedAt).getTime() > sevenDaysAgo).length,
      drafts: allDocs.filter((d) => d.status === "draft").length,
      scheduled: allDocs.filter((d) => d.status === "scheduled").length,
      published: allDocs.filter((d) => d.status === "published").length,
      pinned: allDocs.filter((d) => pinnedIds.has(d.id)).length,
      archived: allDocs.filter((d) => archivedIds.has(d.id)).length,
    };
  }, [allDocs, pinnedIds, archivedIds]);

  const SMART_FOLDERS = useMemo(() => [
    { id: "all", label: "All Documents", icon: FileText, count: smartCounts.all },
    { id: "recent", label: "Recent", icon: Clock, count: smartCounts.recent },
    { id: "pinned", label: "Pinned", icon: Pin, count: smartCounts.pinned },
    { id: "drafts", label: "Drafts", icon: PenLine, count: smartCounts.drafts },
    { id: "scheduled", label: "Scheduled", icon: CalendarDays, count: smartCounts.scheduled },
    { id: "published", label: "Published", icon: CheckCircle2, count: smartCounts.published },
    { id: "archived", label: "Archived", icon: Archive, count: smartCounts.archived },
  ] as const, [smartCounts]);

  // ── Project actions ──

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      await createProject(newProjectName.trim(), selectedColor);
      setNewProjectName("");
      setShowNewProject(false);
      setSelectedColor(PROJECT_COLORS[(projects.length + 1) % PROJECT_COLORS.length]);
      toast.success("Project created");
    } catch {
      toast.error("Failed to create project");
    }
  };

  const handleRenameProject = async (project: Project) => {
    if (!editValue.trim() || editValue.trim() === project.name) {
      setEditingId(null);
      return;
    }
    try {
      await updateProject(project.id, { name: editValue.trim() });
      setEditingId(null);
      toast.success("Project renamed");
    } catch {
      toast.error("Failed to rename");
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject(id);
      toast.success("Project deleted — documents moved to All");
    } catch {
      toast.error("Failed to delete");
    }
    setContextMenu(null);
  };

  // ── Drag & Drop: documents onto projects ──

  const handleProjectDragOver = useCallback(
    (e: React.DragEvent, projectId: string) => {
      const hasDocData = e.dataTransfer.types.includes("application/x-station-docs") ||
        e.dataTransfer.types.includes("text/plain");
      if (hasDocData) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverProjectId(projectId);
      }
    },
    [],
  );

  const handleProjectDragLeave = useCallback(() => {
    setDragOverProjectId(null);
  }, []);

  const handleProjectDrop = useCallback(
    async (e: React.DragEvent, projectId: string) => {
      e.preventDefault();
      setDragOverProjectId(null);

      const docDataStr = e.dataTransfer.getData("application/x-station-docs");
      if (docDataStr) {
        try {
          const docIds = JSON.parse(docDataStr) as string[];
          for (const docId of docIds) {
            try {
              await moveDocument(docId, projectId);
            } catch {}
          }
          toast.success(`Moved ${docIds.length} document${docIds.length > 1 ? "s" : ""} to ${projects.find((p) => p.id === projectId)?.name || "project"}`);
        } catch {}
      } else {
        const singleId = e.dataTransfer.getData("text/plain");
        if (singleId) {
          try {
            await moveDocument(singleId, projectId);
            toast.success(`Moved document to ${projects.find((p) => p.id === projectId)?.name || "project"}`);
          } catch {}
        }
      }
    },
    [moveDocument, projects],
  );

  // ── Drag & Drop: smart folder "No Project" drop ──

  const handleSmartDragOver = useCallback(
    (e: React.DragEvent, folderId: string) => {
      if (folderId !== "all") return;
      const hasDocData = e.dataTransfer.types.includes("application/x-station-docs") ||
        e.dataTransfer.types.includes("text/plain");
      if (hasDocData) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverSmartId(folderId);
      }
    },
    [],
  );

  const handleSmartDragLeave = useCallback(() => {
    setDragOverSmartId(null);
  }, []);

  const handleSmartDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverSmartId(null);

      const docDataStr = e.dataTransfer.getData("application/x-station-docs");
      if (docDataStr) {
        try {
          const docIds = JSON.parse(docDataStr) as string[];
          for (const docId of docIds) {
            try {
              await moveDocument(docId, null);
            } catch {}
          }
          toast.success(`Removed ${docIds.length} document${docIds.length > 1 ? "s" : ""} from project`);
        } catch {}
      } else {
        const singleId = e.dataTransfer.getData("text/plain");
        if (singleId) {
          try {
            await moveDocument(singleId, null);
            toast.success("Removed document from project");
          } catch {}
        }
      }
    },
    [moveDocument],
  );

  // ── Project reorder drag ──

  const handleProjectReorderDragStart = useCallback(
    (e: React.DragEvent, projectId: string) => {
      e.stopPropagation();
      setDraggedProjectId(projectId);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("application/x-station-project", projectId);
    },
    [],
  );

  const handleProjectReorderDragOver = useCallback(
    (e: React.DragEvent, projectId: string) => {
      if (!e.dataTransfer.types.includes("application/x-station-project")) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverReorderId(projectId);
    },
    [],
  );

  const handleProjectReorderDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      setDragOverReorderId(null);
      setDraggedProjectId(null);

      const dragId = e.dataTransfer.getData("application/x-station-project");
      if (!dragId || dragId === targetId) return;

      // Reorder is visual only in current session — could be persisted later
      toast.info("Project reorder coming soon");
    },
    [],
  );

  const handleProjectReorderDragEnd = useCallback(() => {
    setDraggedProjectId(null);
    setDragOverReorderId(null);
  }, []);

  // ── Close context menu on outside click ──

  useEffect(() => {
    if (!contextMenu) return;
    const handler = (e: MouseEvent) => setContextMenu(null);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [contextMenu]);

  return (
    <div className="w-[220px] border-r border-border/40 bg-card/30 flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Workspace
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setShowNewProject(true);
              setProjectsCollapsed(false);
              setSelectedColor(PROJECT_COLORS[projects.length % PROJECT_COLORS.length]);
            }}
            className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-accent/80 transition-colors"
            title="New Project"
          >
            <FolderPlus className="w-3.5 h-3.5" />
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

      {/* Smart folders */}
      <div className="border-b border-border/20">
        <button
          onClick={() => setFoldersCollapsed(!foldersCollapsed)}
          className="w-full flex items-center gap-1.5 px-3 py-2 text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-wider hover:text-muted-foreground transition-colors"
        >
          {foldersCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
          Smart Folders
        </button>

        {!foldersCollapsed && (
          <div className="pb-1.5">
            {SMART_FOLDERS.map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => setActiveFilter(id)}
                onDragOver={(e) => handleSmartDragOver(e, id)}
                onDragLeave={handleSmartDragLeave}
                onDrop={(e) => id === "all" && handleSmartDrop(e)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-[11px] transition-all",
                  activeFilter === id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  dragOverSmartId === id && "bg-primary/15 ring-1 ring-primary/30",
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate flex-1 text-left">{label}</span>
                {count > 0 && (
                  <span className="text-[9px] text-muted-foreground/40 tabular-nums shrink-0">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User projects */}
      <div className="flex-1 overflow-y-auto">
        <button
          onClick={() => setProjectsCollapsed(!projectsCollapsed)}
          className="w-full flex items-center gap-1.5 px-3 py-2 text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-wider hover:text-muted-foreground transition-colors"
        >
          {projectsCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
          Projects
          <span className="text-[8px] text-muted-foreground/30 ml-auto tabular-nums">
            {projects.length}
          </span>
        </button>

        {!projectsCollapsed && (
          <div className="pb-1.5">
            {projects.map((project) => (
              <div
                key={project.id}
                className="relative"
                onDragOver={(e) => {
                  // Accept document drops
                  handleProjectDragOver(e, project.id);
                  // Accept project reorder drops
                  handleProjectReorderDragOver(e, project.id);
                }}
                onDragLeave={() => {
                  handleProjectDragLeave();
                  setDragOverReorderId(null);
                }}
                onDrop={(e) => {
                  if (e.dataTransfer.types.includes("application/x-station-project")) {
                    handleProjectReorderDrop(e, project.id);
                  } else {
                    handleProjectDrop(e, project.id);
                  }
                }}
              >
                {editingId === project.id ? (
                  <div className="flex items-center gap-1 px-3 py-1">
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameProject(project);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex-1 h-6 px-1.5 rounded border border-border bg-background text-[11px] outline-none focus:ring-1 focus:ring-ring min-w-0"
                    />
                    <button onClick={() => handleRenameProject(project)} className="text-emerald-500">
                      <Check className="w-3 h-3" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    draggable
                    onDragStart={(e) => handleProjectReorderDragStart(e, project.id)}
                    onDragEnd={handleProjectReorderDragEnd}
                    onClick={() => setActiveFilter(project.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-1.5 text-[11px] transition-all group",
                      activeFilter === project.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                      dragOverProjectId === project.id && "bg-primary/15 ring-1 ring-primary/30 scale-[1.02]",
                      dragOverReorderId === project.id && "border-t-2 border-primary/60",
                      draggedProjectId === project.id && "opacity-30",
                    )}
                  >
                    {/* Drag handle */}
                    <GripVertical className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-30 cursor-grab" />

                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="truncate flex-1 text-left">{project.name}</span>
                    <span className="text-[9px] text-muted-foreground/40 shrink-0 tabular-nums">
                      {project.documentCount}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu(contextMenu === project.id ? null : project.id);
                      }}
                      className="hidden group-hover:flex h-4 w-4 items-center justify-center rounded text-muted-foreground/40 hover:text-foreground"
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </button>
                  </button>
                )}

                {/* Drop zone indicator */}
                {dragOverProjectId === project.id && (
                  <div className="absolute inset-0 rounded border-2 border-dashed border-primary/40 bg-primary/5 pointer-events-none flex items-center justify-center">
                    <span className="text-[9px] font-medium text-primary/60">Drop here</span>
                  </div>
                )}

                {/* Context menu */}
                {contextMenu === project.id && (
                  <div className="absolute right-2 top-full z-10 w-36 py-1 bg-popover border border-border rounded-lg shadow-lg">
                    <button
                      onClick={() => {
                        setEditingId(project.id);
                        setEditValue(project.name);
                        setContextMenu(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      <Pencil className="w-3 h-3" />
                      Rename
                    </button>
                    <button
                      onClick={() => {
                        // Cycle color
                        const idx = PROJECT_COLORS.indexOf(project.color);
                        const nextColor = PROJECT_COLORS[(idx + 1) % PROJECT_COLORS.length];
                        updateProject(project.id, { color: nextColor });
                        setContextMenu(null);
                        toast.success("Color updated");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      <Star className="w-3 h-3" />
                      Change Color
                    </button>
                    <div className="h-px bg-border/30 my-1 mx-2" />
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}

            {projects.length === 0 && !showNewProject && (
              <p className="text-[10px] text-muted-foreground/40 text-center px-3 mt-2">
                No projects yet. Create one or drag documents here.
              </p>
            )}

            {/* New project input with color picker */}
            {showNewProject && (
              <div className="px-3 py-1 mt-1 space-y-1.5">
                <div className="flex items-center gap-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <input
                    autoFocus
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateProject();
                      if (e.key === "Escape") {
                        setShowNewProject(false);
                        setNewProjectName("");
                      }
                    }}
                    placeholder="Project name..."
                    className="flex-1 h-6 px-1.5 rounded border border-border bg-background text-[11px] outline-none focus:ring-1 focus:ring-ring min-w-0"
                  />
                </div>

                {/* Color picker row */}
                <div className="flex items-center gap-1 pl-4">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "w-4 h-4 rounded-full transition-all",
                        selectedColor === color
                          ? "ring-2 ring-offset-1 ring-offset-background ring-primary scale-110"
                          : "hover:scale-110",
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1 pl-4">
                  <button
                    onClick={handleCreateProject}
                    disabled={!newProjectName.trim()}
                    className="h-5 px-2 rounded text-[10px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowNewProject(false);
                      setNewProjectName("");
                    }}
                    className="h-5 px-2 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
