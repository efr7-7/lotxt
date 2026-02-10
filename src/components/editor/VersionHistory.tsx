import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useEditorStore } from "@/stores/editor-store";
import { toast } from "@/stores/toast-store";
import {
  History, RotateCcw, Eye, X, Loader2, FileText, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentVersion {
  id: number;
  documentId: string;
  title: string;
  content: string;
  htmlContent: string;
  version: number;
  createdAt: string;
}

interface Props {
  onClose: () => void;
}

export function VersionHistory({ onClose }: Props) {
  const { currentDocument } = useEditorStore();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewVersion, setPreviewVersion] = useState<DocumentVersion | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    fetchVersions();
  }, [currentDocument.id]);

  const fetchVersions = async () => {
    setIsLoading(true);
    try {
      const result = await invoke<DocumentVersion[]>("get_document_versions", {
        documentId: currentDocument.id,
      });
      setVersions(result);
    } catch {
      // No versions yet is fine
      setVersions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (version: DocumentVersion) => {
    setIsRestoring(true);
    try {
      // Restore returns the updated document; reload via the store
      await invoke("restore_document_version", {
        documentId: currentDocument.id,
        version: version.version,
      });
      // Reload document from store (resets to restored version)
      useEditorStore.getState().loadDocument(currentDocument.id);
      toast.success(`Restored to version ${version.version}`);
      setPreviewVersion(null);
    } catch {
      toast.error("Failed to restore version");
    } finally {
      setIsRestoring(false);
    }
  };

  const wordCount = (text: string) => {
    return text.split(/\s+/).filter(Boolean).length;
  };

  const timeDiff = (a: string, b: string) => {
    const diff = wordCount(a) - wordCount(b);
    if (diff > 0) return `+${diff} words`;
    if (diff < 0) return `${diff} words`;
    return "no change";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-muted-foreground" />
          <h3 className="text-[12px] font-semibold text-foreground">Version History</h3>
        </div>
        <button
          onClick={onClose}
          className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-accent"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <History className="w-6 h-6 text-muted-foreground/20 mb-3" />
            <p className="text-[11px] text-muted-foreground/40 text-center">
              No version history yet. Versions are created each time you save.
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {/* Current version indicator */}
            <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-primary/5 border border-primary/10">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-medium text-primary">
                Current — v{versions.length + 1}
              </span>
            </div>

            {/* Version list */}
            {versions.map((v, i) => {
              const prevVersion = versions[i + 1];
              const delta = prevVersion ? timeDiff(v.content, prevVersion.content) : null;

              return (
                <div
                  key={v.id}
                  className={cn(
                    "group rounded-lg border border-transparent px-3 py-2.5 hover:bg-accent/30 hover:border-border/30 transition-colors cursor-pointer",
                    previewVersion?.id === v.id && "bg-accent/40 border-border/40"
                  )}
                  onClick={() => setPreviewVersion(v)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3 h-3 text-muted-foreground/40" />
                      <span className="text-[11px] font-medium text-foreground/80">
                        Version {v.version}
                      </span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-muted-foreground/20 group-hover:text-muted-foreground/40" />
                  </div>
                  <div className="flex items-center gap-3 mt-1 ml-5">
                    <span className="text-[9px] text-muted-foreground/40">
                      {new Date(v.createdAt).toLocaleString()}
                    </span>
                    {delta && (
                      <span className={cn(
                        "text-[9px]",
                        delta.startsWith("+") ? "text-green-500/50" :
                        delta.startsWith("-") ? "text-red-500/50" :
                        "text-muted-foreground/30"
                      )}>
                        {delta}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview panel */}
      {previewVersion && (
        <div className="border-t border-border/40 p-3 space-y-2 max-h-[40%] flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground">
              Preview — v{previewVersion.version}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleRestore(previewVersion)}
                disabled={isRestoring}
                className="h-6 px-2 rounded text-[10px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {isRestoring ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RotateCcw className="w-3 h-3" />
                )}
                Restore
              </button>
              <button
                onClick={() => setPreviewVersion(null)}
                className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-accent"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto rounded-md bg-muted/30 border border-border/20 p-3">
            <h4 className="text-[11px] font-medium text-foreground/70 mb-2">
              {previewVersion.title || "Untitled"}
            </h4>
            <p className="text-[10px] text-muted-foreground/60 whitespace-pre-wrap leading-relaxed">
              {previewVersion.content.slice(0, 1000)}
              {previewVersion.content.length > 1000 && "…"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
