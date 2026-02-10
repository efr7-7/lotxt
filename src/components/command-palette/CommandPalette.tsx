import { useEffect, useRef } from "react";
import { useCommandStore } from "@/stores/command-store";
import {
  ArrowRight,
  Navigation,
  FileText,
  Eye as EyeIcon,
  Settings,
  Zap,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, typeof ArrowRight> = {
  navigation: Navigation,
  editor: FileText,
  view: EyeIcon,
  platform: Settings,
  general: Zap,
};

export function CommandPalette() {
  const { isOpen, close, search, setSearch, filteredCommands } = useCommandStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = filteredCommands();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={close}
      />

      {/* Palette — glass-morphism overlay */}
      <div className="relative w-full max-w-lg bg-popover/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-overlay overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
        {/* Search input */}
        <div className="flex items-center border-b border-border/40 px-4">
          <svg
            className="w-4 h-4 text-muted-foreground shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command..."
            className="flex-1 h-12 px-3 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div className="max-h-72 overflow-y-auto p-1.5">
          {commands.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No commands found
            </div>
          ) : (
            commands.map((cmd) => {
              const CategoryIcon = CATEGORY_ICONS[cmd.category] || Zap;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    close();
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors group"
                >
                  <CategoryIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">
                      {cmd.label}
                    </div>
                    {cmd.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {cmd.description}
                      </div>
                    )}
                  </div>
                  {cmd.shortcut && (
                    <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                      {cmd.shortcut}
                    </kbd>
                  )}
                  <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
