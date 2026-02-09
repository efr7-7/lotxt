import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useThemeStore } from "@/stores/theme-store";
import { useCommandStore } from "@/stores/command-store";
import { useWorkspaceStore, type WorkspaceId } from "@/stores/workspace-store";

export default function App() {
  const { theme } = useThemeStore();
  const { toggle: toggleCommandPalette, registerCommands } = useCommandStore();
  const { setActiveWorkspace } = useWorkspaceStore();

  // Register global commands
  useEffect(() => {
    registerCommands([
      {
        id: "nav:editor",
        label: "Go to Editor",
        description: "Open the newsletter editor",
        shortcut: "Ctrl+1",
        category: "navigation",
        action: () => setActiveWorkspace("editor"),
      },
      {
        id: "nav:canvas",
        label: "Go to Canvas",
        description: "Open the design canvas",
        shortcut: "Ctrl+2",
        category: "navigation",
        action: () => setActiveWorkspace("canvas"),
      },
      {
        id: "nav:analytics",
        label: "Go to Analytics",
        description: "Open the analytics dashboard",
        shortcut: "Ctrl+3",
        category: "navigation",
        action: () => setActiveWorkspace("analytics"),
      },
      {
        id: "nav:accounts",
        label: "Go to Accounts",
        description: "Manage connected accounts",
        shortcut: "Ctrl+4",
        category: "navigation",
        action: () => setActiveWorkspace("accounts"),
      },
      {
        id: "nav:social",
        label: "Go to Social Preview",
        description: "Preview content on social platforms",
        shortcut: "Ctrl+5",
        category: "navigation",
        action: () => setActiveWorkspace("social-preview"),
      },
      {
        id: "view:theme",
        label: "Toggle Theme",
        description: "Switch between dark and light mode",
        shortcut: "Ctrl+Shift+T",
        category: "view",
        action: () => useThemeStore.getState().toggleTheme(),
      },
    ]);
  }, [registerCommands, setActiveWorkspace]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K => Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleCommandPalette();
      }

      // Ctrl+1-5 for workspace switching
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        const workspaceMap: Record<string, WorkspaceId> = {
          "1": "editor",
          "2": "canvas",
          "3": "analytics",
          "4": "accounts",
          "5": "social-preview",
        };
        if (workspaceMap[e.key]) {
          e.preventDefault();
          setActiveWorkspace(workspaceMap[e.key]);
        }
      }

      // Ctrl+Shift+T for theme toggle
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "T") {
        e.preventDefault();
        useThemeStore.getState().toggleTheme();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCommandPalette, setActiveWorkspace]);

  return <AppShell />;
}
