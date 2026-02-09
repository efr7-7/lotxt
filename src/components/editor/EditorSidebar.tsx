import { useEditorStore } from "@/stores/editor-store";
import { FileText, Clock, Hash, Type } from "lucide-react";

export function EditorSidebar() {
  const { currentDocument } = useEditorStore();

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <aside className="w-56 border-l border-border bg-card/50 shrink-0 overflow-y-auto">
      <div className="p-4 space-y-5">
        {/* Document info */}
        <div>
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Document
          </h3>
          <div className="space-y-2.5">
            <InfoRow icon={FileText} label="Title" value={currentDocument.title || "Untitled"} />
            <InfoRow icon={Clock} label="Updated" value={formatDate(currentDocument.updatedAt)} />
            <InfoRow icon={Hash} label="Words" value={currentDocument.wordCount.toString()} />
            <InfoRow icon={Type} label="Characters" value={currentDocument.characterCount.toString()} />
          </div>
        </div>

        {/* Reading time */}
        <div>
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Reading Time
          </h3>
          <p className="text-sm text-foreground">
            {Math.max(1, Math.ceil(currentDocument.wordCount / 238))} min read
          </p>
        </div>

        {/* Keyboard shortcuts */}
        <div>
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="space-y-1.5">
            <ShortcutRow keys="/" label="Slash commands" />
            <ShortcutRow keys="Ctrl+B" label="Bold" />
            <ShortcutRow keys="Ctrl+I" label="Italic" />
            <ShortcutRow keys="Ctrl+U" label="Underline" />
            <ShortcutRow keys="Ctrl+K" label="Command palette" />
          </div>
        </div>
      </div>
    </aside>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs text-foreground ml-auto truncate max-w-[100px]">{value}</span>
    </div>
  );
}

function ShortcutRow({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
        {keys}
      </kbd>
    </div>
  );
}
