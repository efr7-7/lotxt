import { useState } from "react";
import {
  Home,
  FileText,
  Paintbrush,
  BarChart3,
  Users,
  Sun,
  Moon,
  Command,
  Sparkles,
  Settings,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore, type WorkspaceId } from "@/stores/workspace-store";
import { useThemeStore } from "@/stores/theme-store";
import { useCommandStore } from "@/stores/command-store";
import { SettingsDialog } from "@/components/settings/SettingsDialog";

const NAV_ITEMS: {
  id: WorkspaceId;
  icon: typeof FileText;
  label: string;
  shortcut: string;
}[] = [
  { id: "home", icon: Home, label: "Home", shortcut: "0" },
  { id: "editor", icon: FileText, label: "Editor", shortcut: "1" },
  { id: "canvas", icon: Paintbrush, label: "Canvas", shortcut: "2" },
  { id: "analytics", icon: BarChart3, label: "Analytics", shortcut: "3" },
  { id: "accounts", icon: Users, label: "Accounts", shortcut: "4" },
  { id: "distribute", icon: Sparkles, label: "Distribute", shortcut: "5" },
  { id: "calendar", icon: CalendarDays, label: "Calendar", shortcut: "6" },
];

export function Sidebar() {
  const { activeWorkspace, setActiveWorkspace } = useWorkspaceStore();
  const { theme, toggleTheme } = useThemeStore();
  const { open: openCommandPalette } = useCommandStore();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <aside className="w-[52px] flex flex-col items-center bg-card/50 border-r border-border/50 shrink-0 relative">
      {/* Top: Brand mark */}
      <div className="w-full flex items-center justify-center h-10 shrink-0" data-tauri-drag-region>
        <div className="w-[26px] h-[26px] rounded-[7px] bg-gradient-to-br from-[hsl(252,56%,62%)] to-[hsl(270,60%,52%)] flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]">
          <span className="text-[11px] font-extrabold text-white leading-none" style={{ letterSpacing: "-0.05em" }}>S</span>
        </div>
      </div>

      {/* Workspace navigation */}
      <nav className="flex flex-col items-center gap-[2px] flex-1 pt-2 pb-1">
        {NAV_ITEMS.map(({ id, icon: Icon, label, shortcut }) => {
          const isActive = activeWorkspace === id;
          return (
            <div key={id} className="relative group">
              <button
                onClick={() => setActiveWorkspace(id)}
                title={`${label} (Ctrl+${shortcut})`}
                className={cn(
                  "w-[34px] h-[34px] rounded-[8px] flex items-center justify-center transition-all duration-100",
                  isActive
                    ? "bg-accent text-foreground shadow-[0_0_0_1px_hsl(var(--border))]"
                    : "text-muted-foreground/50 hover:text-foreground/80 hover:bg-accent/60",
                )}
              >
                <Icon className="w-[15px] h-[15px]" strokeWidth={isActive ? 2 : 1.5} />
              </button>

              {/* Active indicator — 2px pill on left edge */}
              {isActive && (
                <div className="absolute left-[-9px] top-1/2 -translate-y-1/2 w-[2.5px] h-[14px] bg-foreground/70 rounded-r-full" />
              )}

              {/* Tooltip */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2 py-1 bg-[hsl(0,0%,10%)] border border-white/[0.08] rounded-md shadow-overlay opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-75 whitespace-nowrap z-50">
                <span className="text-[11px] font-medium text-white/90">{label}</span>
                <span className="text-[10px] text-white/30 ml-2">^{shortcut}</span>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-[2px] pb-3">
        <div className="w-5 h-px bg-border/40 mb-1" />

        <button
          onClick={openCommandPalette}
          title="Command Palette (Ctrl+K)"
          className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center text-muted-foreground/40 hover:text-foreground/80 hover:bg-accent/60 transition-all duration-100"
        >
          <Command className="w-[15px] h-[15px]" strokeWidth={1.5} />
        </button>

        <button
          onClick={() => setShowSettings(true)}
          title="Settings"
          className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center text-muted-foreground/40 hover:text-foreground/80 hover:bg-accent/60 transition-all duration-100"
        >
          <Settings className="w-[15px] h-[15px]" strokeWidth={1.5} />
        </button>

        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
          className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center text-muted-foreground/40 hover:text-foreground/80 hover:bg-accent/60 transition-all duration-100"
        >
          {theme === "dark" ? (
            <Sun className="w-[15px] h-[15px]" strokeWidth={1.5} />
          ) : (
            <Moon className="w-[15px] h-[15px]" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
    </aside>
  );
}
