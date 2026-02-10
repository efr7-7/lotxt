import { useState, useEffect, useCallback, useRef } from "react";
import { X, Upload, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { useImageStore } from "@/stores/image-store";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string) => void;
}

export function ImageUploadDialog({ isOpen, onClose, onInsert }: Props) {
  const { images, isLoading, loadImages, uploadImage, deleteImage, getImageUrl } = useImageStore();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadImages().catch(() => {
        // Gracefully handle — image library just won't show in web mode
      });
    }
  }, [isOpen, loadImages]);

  const handleFilePick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Try Tauri native path first, fall back to object URL for web mode
      try {
        const tauriFile = file as unknown as { path?: string };
        if (tauriFile.path) {
          const entry = await uploadImage(tauriFile.path);
          toast.success("Image uploaded");
          onInsert(getImageUrl(entry));
          onClose();
          return;
        }
      } catch {
        // Not in Tauri — use blob URL
      }

      // Web fallback: use object URL
      const url = URL.createObjectURL(file);
      onInsert(url);
      onClose();
    },
    [uploadImage, getImageUrl, onInsert, onClose],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length === 0) return;

      const file = files[0];
      if (file) {
        try {
          // In Tauri, dropped files may have a path
          const path = (file as unknown as { path?: string }).path;
          if (path) {
            const entry = await uploadImage(path);
            toast.success("Image uploaded");
            onInsert(getImageUrl(entry));
            onClose();
            return;
          }
        } catch {
          // Not Tauri
        }

        // Web fallback
        const url = URL.createObjectURL(file);
        onInsert(url);
        onClose();
      }
    },
    [uploadImage, getImageUrl, onInsert, onClose],
  );

  const handleInsertExisting = useCallback(
    (entry: (typeof images)[0]) => {
      onInsert(getImageUrl(entry));
      onClose();
    },
    [getImageUrl, onInsert, onClose],
  );

  const handleDelete = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await deleteImage(id);
        toast.success("Image deleted");
      } catch {
        toast.error("Failed to delete image");
      }
    },
    [deleteImage],
  );

  if (!isOpen) return null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[560px] max-h-[80vh] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleFileSelected}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
          <h2 className="text-[14px] font-semibold text-foreground">Insert Image</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload zone */}
        <div className="px-5 pt-4 pb-2">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={handleFilePick}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-all",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border/60 hover:border-primary/40 hover:bg-muted/30",
            )}
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : (
              <Upload className="w-6 h-6 text-muted-foreground/50" />
            )}
            <p className="text-[12px] text-muted-foreground">
              <span className="font-medium text-foreground">Click to browse</span> or drag an image here
            </p>
            <p className="text-[10px] text-muted-foreground/50">PNG, JPG, GIF, WebP, SVG</p>
          </div>
        </div>

        {/* URL input */}
        <div className="px-5 py-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground/50">or</span>
            <input
              type="url"
              placeholder="Paste image URL..."
              className="flex-1 h-7 px-2.5 rounded-md bg-muted/50 border border-border/40 text-[12px] text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/40"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const url = (e.target as HTMLInputElement).value.trim();
                  if (url) { onInsert(url); onClose(); }
                }
              }}
            />
          </div>
        </div>

        {/* Image library */}
        {images.length > 0 && (
          <div className="flex-1 px-5 py-3 overflow-y-auto border-t border-border/30 mt-2">
            <p className="text-[11px] font-medium text-muted-foreground/60 mb-2">
              Library ({images.length})
            </p>
            <div className="grid grid-cols-4 gap-2">
              {images.map((img) => (
                <div
                  key={img.id}
                  onClick={() => handleInsertExisting(img)}
                  className="relative group rounded-lg overflow-hidden border border-border/40 cursor-pointer hover:border-primary/40 transition-colors aspect-square bg-muted/30"
                >
                  <img
                    src={getImageUrl(img)}
                    alt={img.filename}
                    className="w-full h-full object-cover"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-1.5">
                    <span className="text-[9px] text-white/80 truncate max-w-[80%]">
                      {formatSize(img.size)}
                    </span>
                    <button
                      onClick={(e) => handleDelete(img.id, e)}
                      className="p-1 rounded bg-red-500/80 hover:bg-red-500 text-white"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {images.length === 0 && !isLoading && (
          <div className="px-5 py-6 text-center">
            <ImageIcon className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-[11px] text-muted-foreground/40">No images uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
