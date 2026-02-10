import { useState, useRef, useEffect, useCallback } from "react";
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
  accentColor: string;
  activeIconColor: string;
}[] = [
  { id: "home", icon: Home, label: "Home", shortcut: "0", accentColor: "hsl(252, 56%, 57%)", activeIconColor: "text-primary" },
  { id: "editor", icon: FileText, label: "Editor", shortcut: "1", accentColor: "hsl(217, 91%, 60%)", activeIconColor: "text-blue-500" },
  { id: "canvas", icon: Paintbrush, label: "Canvas", shortcut: "2", accentColor: "hsl(271, 60%, 55%)", activeIconColor: "text-violet-500" },
  { id: "analytics", icon: BarChart3, label: "Analytics", shortcut: "3", accentColor: "hsl(172, 66%, 42%)", activeIconColor: "text-teal-500" },
  { id: "accounts", icon: Users, label: "Accounts", shortcut: "4", accentColor: "hsl(252, 56%, 57%)", activeIconColor: "text-primary" },
  { id: "distribute", icon: Sparkles, label: "Distribute", shortcut: "5", accentColor: "hsl(38, 92%, 50%)", activeIconColor: "text-amber-500" },
  { id: "calendar", icon: CalendarDays, label: "Calendar", shortcut: "6", accentColor: "hsl(0, 72%, 51%)", activeIconColor: "text-rose-500" },
];

export function Sidebar() {
  const { activeWorkspace, setActiveWorkspace } = useWorkspaceStore();
  const { theme, toggleTheme } = useThemeStore();
  const { open: openCommandPalette } = useCommandStore();
  const [showSettings, setShowSettings] = useState(false);
  const [themeRotation, setThemeRotation] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Refs for measuring active indicator position
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Map<WorkspaceId, HTMLButtonElement>>(new Map());
  const [indicatorY, setIndicatorY] = useState<number | null>(null);

  // Mark mounted for staggered entrance animation
  useEffect(() => {
    // Small delay so the initial render happens first, then animation triggers
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Compute the active indicator's Y position relative to the nav container
  const updateIndicatorPosition = useCallback(() => {
    const nav = navRef.current;
    const btn = itemRefs.current.get(activeWorkspace);
    if (!nav || !btn) return;
    const navRect = nav.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setIndicatorY(btnRect.top - navRect.top + btnRect.height / 2);
  }, [activeWorkspace]);

  useEffect(() => {
    updateIndicatorPosition();
  }, [updateIndicatorPosition]);

  // Also recalculate on resize
  useEffect(() => {
    window.addEventListener("resize", updateIndicatorPosition);
    return () => window.removeEventListener("resize", updateIndicatorPosition);
  }, [updateIndicatorPosition]);

  const handleThemeToggle = () => {
    setThemeRotation((r) => r + 180);
    toggleTheme();
  };

  const setItemRef = useCallback(
    (id: WorkspaceId) => (el: HTMLButtonElement | null) => {
      if (el) {
        itemRefs.current.set(id, el);
      } else {
        itemRefs.current.delete(id);
      }
    },
    [],
  );

  return (
    <aside className="w-[52px] flex flex-col items-center bg-card/50 border-r border-border/50 shrink-0 relative">
      {/* Top: Brand mark */}
      <div
        className="w-full flex items-center justify-center h-10 shrink-0"
        data-tauri-drag-region
      >
        {/* Enhancement 7: Pulsing glow on hover */}
        <div className="group/brand relative">
          <div
            className={cn(
              "w-[26px] h-[26px] rounded-[7px] bg-gradient-to-br from-[hsl(252,56%,62%)] to-[hsl(270,60%,52%)]",
              "flex items-center justify-center",
              "shadow-[0_1px_3px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]",
              "transition-shadow duration-500 ease-out",
              "group-hover/brand:shadow-[0_1px_3px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.1),0_0_12px_rgba(139,92,246,0.35)]",
            )}
          >
            <span
              className="text-[11px] font-extrabold text-white leading-none"
              style={{ letterSpacing: "-0.05em" }}
            >
              S
            </span>
          </div>
          {/* Glow layer behind the mark */}
          <div
            className={cn(
              "absolute inset-0 rounded-[7px] opacity-0 group-hover/brand:opacity-100",
              "bg-[hsl(252,56%,62%)] blur-[8px]",
              "transition-opacity duration-500 ease-out",
              "-z-10",
            )}
          />
        </div>
      </div>

      {/* Workspace navigation */}
      <nav
        ref={navRef}
        className="flex flex-col items-center gap-[2px] flex-1 pt-2 pb-1 relative"
      >
        {/* Enhancement 1: Animated sliding active indicator pill with workspace accent */}
        <div
          className="absolute left-0 w-[2.5px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            top: indicatorY !== null ? indicatorY - 7 : 0,
            height: 14,
            opacity: indicatorY !== null ? 1 : 0,
          }}
        >
          <div
            className="w-full h-full rounded-r-full transition-colors duration-300"
            style={{ backgroundColor: NAV_ITEMS.find((n) => n.id === activeWorkspace)?.accentColor ?? "hsl(var(--foreground) / 0.7)" }}
          />
        </div>

        {NAV_ITEMS.map(({ id, icon: Icon, label, shortcut, activeIconColor }, index) => {
          const isActive = activeWorkspace === id;
          return (
            <div
              key={id}
              className="relative group"
              /* Enhancement 8: Staggered fade-in on mount */
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(4px)",
                transition: `opacity 350ms ease-out ${index * 40}ms, transform 350ms ease-out ${index * 40}ms`,
              }}
            >
              <button
                ref={setItemRef(id)}
                onClick={() => setActiveWorkspace(id)}
                title={`${label} (Ctrl+${shortcut})`}
                className={cn(
                  "w-[34px] h-[34px] rounded-[8px] flex items-center justify-center",
                  /* Enhancement 3: Hover translateY lift */
                  "transition-all duration-200 ease-out",
                  "hover:-translate-y-[1px]",
                  isActive
                    ? "bg-accent text-foreground shadow-[0_0_0_1px_hsl(var(--border))]"
                    : "text-muted-foreground/50 hover:text-foreground/80 hover:bg-accent/60",
                )}
              >
                {/* Enhancement 2: Icon scale + accent color per workspace */}
                <Icon
                  className={cn(
                    "w-[15px] h-[15px] transition-all duration-200 ease-out",
                    isActive ? `scale-105 ${activeIconColor}` : "",
                  )}
                  strokeWidth={isActive ? 2 : 1.5}
                />
              </button>

              {/* Enhancement 4: Tooltip with translateX entrance */}
              <div
                className={cn(
                  "absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2 py-1",
                  "bg-[hsl(0,0%,10%)] border border-white/[0.08] rounded-md shadow-overlay",
                  "opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0",
                  "pointer-events-none transition-all duration-150 ease-out whitespace-nowrap z-50",
                )}
              >
                <span className="text-[11px] font-medium text-white/90">
                  {label}
                </span>
                <span className="text-[10px] text-white/30 ml-2">
                  ^{shortcut}
                </span>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-[2px] pb-3">
        {/* Enhancement 5: Gradient fading separator */}
        <div
          className="w-5 h-px mb-1"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, hsl(var(--border) / 0.5) 30%, hsl(var(--border) / 0.5) 70%, transparent 100%)",
          }}
        />

        <button
          onClick={openCommandPalette}
          title="Command Palette (Ctrl+K)"
          className={cn(
            "w-[34px] h-[34px] rounded-[8px] flex items-center justify-center",
            "text-muted-foreground/40 hover:text-foreground/80 hover:bg-accent/60",
            "transition-all duration-200 ease-out hover:-translate-y-[1px]",
          )}
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? undefined : "translateY(4px)",
            transition: `opacity 350ms ease-out ${NAV_ITEMS.length * 40 + 60}ms, transform 350ms ease-out ${NAV_ITEMS.length * 40 + 60}ms, color 200ms ease-out, background-color 200ms ease-out`,
          }}
        >
          <Command className="w-[15px] h-[15px]" strokeWidth={1.5} />
        </button>

        <button
          onClick={() => setShowSettings(true)}
          title="Settings"
          className={cn(
            "w-[34px] h-[34px] rounded-[8px] flex items-center justify-center",
            "text-muted-foreground/40 hover:text-foreground/80 hover:bg-accent/60",
            "transition-all duration-200 ease-out hover:-translate-y-[1px]",
          )}
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? undefined : "translateY(4px)",
            transition: `opacity 350ms ease-out ${NAV_ITEMS.length * 40 + 100}ms, transform 350ms ease-out ${NAV_ITEMS.length * 40 + 100}ms, color 200ms ease-out, background-color 200ms ease-out`,
          }}
        >
          <Settings className="w-[15px] h-[15px]" strokeWidth={1.5} />
        </button>

        {/* Enhancement 6: Theme toggle with rotation animation */}
        <button
          onClick={handleThemeToggle}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
          className={cn(
            "w-[34px] h-[34px] rounded-[8px] flex items-center justify-center",
            "text-muted-foreground/40 hover:text-foreground/80 hover:bg-accent/60",
            "transition-all duration-200 ease-out hover:-translate-y-[1px]",
          )}
          style={{
            opacity: mounted ? 1 : 0,
            transition: `opacity 350ms ease-out ${NAV_ITEMS.length * 40 + 140}ms, transform 350ms ease-out ${NAV_ITEMS.length * 40 + 140}ms, color 200ms ease-out, background-color 200ms ease-out`,
          }}
        >
          <div
            className="transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ transform: `rotate(${themeRotation}deg)` }}
          >
            {theme === "dark" ? (
              <Sun className="w-[15px] h-[15px]" strokeWidth={1.5} />
            ) : (
              <Moon className="w-[15px] h-[15px]" strokeWidth={1.5} />
            )}
          </div>
        </button>
      </div>

      {showSettings && (
        <SettingsDialog onClose={() => setShowSettings(false)} />
      )}
    </aside>
  );
}
