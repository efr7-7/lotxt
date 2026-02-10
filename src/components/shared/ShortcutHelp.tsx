import { X } from "lucide-react";

interface ShortcutGroup {
  title: string;
  shortcuts: { label: string; keys: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Navigation",
    shortcuts: [
      { label: "Go to Editor", keys: "Ctrl+1" },
      { label: "Go to Canvas", keys: "Ctrl+2" },
      { label: "Go to Analytics", keys: "Ctrl+3" },
      { label: "Go to Accounts", keys: "Ctrl+4" },
      { label: "Go to Distribute", keys: "Ctrl+5" },
      { label: "Command Palette", keys: "Ctrl+K" },
    ],
  },
  {
    title: "Editor",
    shortcuts: [
      { label: "New Document", keys: "Ctrl+N" },
      { label: "Save Document", keys: "Ctrl+S" },
      { label: "Documents Panel", keys: "Ctrl+D" },
      { label: "Find & Replace", keys: "Ctrl+H" },
      { label: "AI Assistant", keys: "Ctrl+J" },
      { label: "Bold", keys: "Ctrl+B" },
      { label: "Italic", keys: "Ctrl+I" },
      { label: "Underline", keys: "Ctrl+U" },
      { label: "Undo", keys: "Ctrl+Z" },
      { label: "Redo", keys: "Ctrl+Shift+Z" },
    ],
  },
  {
    title: "View",
    shortcuts: [
      { label: "Toggle Theme", keys: "Ctrl+Shift+T" },
      { label: "Keyboard Shortcuts", keys: "Ctrl+/" },
    ],
  },
];

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center h-5 px-1.5 rounded border border-border/60 bg-muted/40 text-[10px] font-mono text-muted-foreground/70 shadow-[0_1px_0_hsl(var(--border))]">
      {children}
    </kbd>
  );
}

export function ShortcutHelp({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-[520px] max-h-[80vh] bg-card border border-border/50 rounded-xl shadow-overlay overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <h2 className="text-sm font-semibold text-foreground">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-2.5">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.label}
                    className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-accent/30 transition-colors"
                  >
                    <span className="text-[12px] text-foreground/80">{shortcut.label}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.split("+").map((key, i) => (
                        <span key={i} className="flex items-center gap-0.5">
                          {i > 0 && <span className="text-[10px] text-muted-foreground/30 mx-0.5">+</span>}
                          <Kbd>{key}</Kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/30 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/40">
            Press <Kbd>Esc</Kbd> or <Kbd>Ctrl</Kbd><span className="text-[10px] text-muted-foreground/30 mx-0.5">+</span><Kbd>/</Kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
