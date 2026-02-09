import {
  FileText,
  Paintbrush,
  BarChart3,
  Users,
  Eye,
  Sun,
  Moon,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore, type WorkspaceId } from "@/stores/workspace-store";
import { useThemeStore } from "@/stores/theme-store";
import { useCommandStore } from "@/stores/command-store";

const NAV_ITEMS: {
  id: WorkspaceId;
  icon: typeof FileText;
  label: string;
  shortcut: string;
}[] = [
  { id: "editor", icon: FileText, label: "Editor", shortcut: "1" },
  { id: "canvas", icon: Paintbrush, label: "Canvas", shortcut: "2" },
  { id: "analytics", icon: BarChart3, label: "Analytics", shortcut: "3" },
  { id: "accounts", icon: Users, label: "Accounts", shortcut: "4" },
  { id: "social-preview", icon: Eye, label: "Social Preview", shortcut: "5" },
];

export function Sidebar() {
  const { activeWorkspace, setActiveWorkspace } = useWorkspaceStore();
  const { theme, toggleTheme } = useThemeStore();
  const { open: openCommandPalette } = useCommandStore();

  return (
    <aside className="w-12 flex flex-col items-center py-2 bg-background border-r border-border shrink-0">
      {/* Workspace navigation */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {NAV_ITEMS.map(({ id, icon: Icon, label, shortcut }) => (
          <button
            key={id}
            onClick={() => setActiveWorkspace(id)}
            title={`${label} (Ctrl+${shortcut})`}
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150",
              activeWorkspace === id
                ? "bg-primary/15 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </button>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={openCommandPalette}
          title="Command Palette (Ctrl+K)"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Command className="w-[18px] h-[18px]" strokeWidth={1.75} />
        </button>
        <button
          onClick={toggleTheme}
          title="Toggle Theme"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="w-[18px] h-[18px]" strokeWidth={1.75} />
          ) : (
            <Moon className="w-[18px] h-[18px]" strokeWidth={1.75} />
          )}
        </button>
      </div>
    </aside>
  );
}
