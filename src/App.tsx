import { useEffect, useState, lazy, Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useThemeStore } from "@/stores/theme-store";
import { useCommandStore } from "@/stores/command-store";
import { useWorkspaceStore, type WorkspaceId } from "@/stores/workspace-store";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useEditorStore } from "@/stores/editor-store";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ShortcutHelp } from "@/components/shared/ShortcutHelp";
import { toast } from "@/stores/toast-store";
import { Loader2 } from "lucide-react";

const LandingPage = lazy(() => import("@/components/onboarding/LandingPage"));

// Welcome document content for first-time users
const WELCOME_CONTENT = {
  type: "doc" as const,
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Welcome to Station" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Station is your all-in-one newsletter creation platform. Here's a quick overview of what you can do:",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Write" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "This rich text editor supports bold, italic, underline, code, highlights, headings, lists, tables, images, and more. Use the toolbar above or keyboard shortcuts for fast formatting.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Design" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Switch to the Canvas workspace (Ctrl+2) to create social graphics, newsletter headers, and marketing assets with shapes, text, gradients, templates, and image support.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Publish & Distribute" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Connect your accounts (Ctrl+4) to publish directly. Use Distribute (Ctrl+5) to preview how your content looks on social platforms and adapt it with AI.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Quick Shortcuts" }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Ctrl+K" },
                { type: "text", text: " — Command Palette (search anything)" },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Ctrl+J" },
                { type: "text", text: " — AI Writing Assistant" },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Ctrl+N" },
                { type: "text", text: " — New Document" },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Ctrl+S" },
                { type: "text", text: " — Save Document" },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Ctrl+/" },
                { type: "text", text: " — View All Shortcuts" },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "horizontalRule",
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          marks: [{ type: "italic" }],
          text: "Feel free to edit or delete this document. Happy creating!",
        },
      ],
    },
  ],
};

export default function App() {
  const { theme } = useThemeStore();
  const { toggle: toggleCommandPalette, registerCommands } = useCommandStore();
  const { setActiveWorkspace } = useWorkspaceStore();
  const { hasOnboarded, completeOnboarding, resetOnboarding } = useOnboardingStore();
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

  // Ensure dark class is set on mount
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Apply accent color from settings on mount
  useEffect(() => {
    const accent = useSettingsStore.getState().accentColor;
    if (accent) {
      document.documentElement.style.setProperty("--primary", accent);
    }
  }, []);

  // Welcome document — create on first launch after onboarding
  useEffect(() => {
    if (hasOnboarded && !localStorage.getItem("station:first-document-created")) {
      const store = useEditorStore.getState();
      store.setTitle("Welcome to Station");
      store.setContent(WELCOME_CONTENT, "");
      localStorage.setItem("station:first-document-created", "true");
    }
  }, [hasOnboarded]);

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
        id: "nav:distribute",
        label: "Go to Distribute",
        description: "Social previews & AI content adaptation",
        shortcut: "Ctrl+5",
        category: "navigation",
        action: () => setActiveWorkspace("distribute"),
      },
      {
        id: "nav:calendar",
        label: "Go to Calendar",
        description: "Content calendar & scheduling",
        shortcut: "Ctrl+6",
        category: "navigation",
        action: () => setActiveWorkspace("calendar"),
      },
      {
        id: "view:theme",
        label: "Toggle Theme",
        description: "Switch between dark and light mode",
        shortcut: "Ctrl+Shift+T",
        category: "view",
        action: () => useThemeStore.getState().toggleTheme(),
      },
      {
        id: "view:shortcuts",
        label: "Keyboard Shortcuts",
        description: "Show keyboard shortcut reference",
        shortcut: "Ctrl+/",
        category: "view",
        action: () => setShowShortcutHelp(true),
      },
      {
        id: "editor:import",
        label: "Import Posts",
        description: "Import posts from connected platforms",
        shortcut: "Ctrl+I",
        category: "editor",
        action: () => {
          setActiveWorkspace("editor");
          useEditorStore.getState().setShowImportDialog(true);
        },
      },
      {
        id: "editor:new-document",
        label: "New Document",
        description: "Create a new document",
        shortcut: "Ctrl+N",
        category: "editor",
        action: () => {
          setActiveWorkspace("editor");
          useEditorStore.getState().createNewDocument();
          toast.success("New document created");
        },
      },
      {
        id: "editor:save",
        label: "Save Document",
        description: "Save the current document",
        shortcut: "Ctrl+S",
        category: "editor",
        action: async () => {
          const store = useEditorStore.getState();
          const doc = store.currentDocument;
          if (!doc.title && !doc.htmlContent) return;
          store.setSaveStatus("saving");
          try {
            const { invoke } = await import("@tauri-apps/api/core");
            await invoke("save_document", {
              id: doc.id,
              title: doc.title || "Untitled",
              content: JSON.stringify(doc.content),
              htmlContent: doc.htmlContent,
            });
            store.markClean();
            store.setSaveStatus("saved");
            store.setLastSavedAt(new Date().toISOString());
            toast.success("Document saved");
            setTimeout(() => {
              if (useEditorStore.getState().saveStatus === "saved") {
                useEditorStore.getState().setSaveStatus("idle");
              }
            }, 2000);
          } catch (e) {
            store.setSaveStatus("error");
            toast.error("Save failed");
          }
        },
      },
    ]);
  }, [registerCommands, setActiveWorkspace]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+0 => Reset onboarding (dev tool)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === ")") {
        e.preventDefault();
        resetOnboarding();
        return;
      }

      if (!hasOnboarded) return;

      // Cmd/Ctrl + K => Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleCommandPalette();
      }

      // Ctrl+/ => Shortcut help
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setShowShortcutHelp((v) => !v);
      }

      // Ctrl+N => New Document
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        setActiveWorkspace("editor");
        useEditorStore.getState().createNewDocument();
        toast.success("New document created");
      }

      // Ctrl+S => Save Document
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        // Trigger the save command
        const cmds = useCommandStore.getState().commands;
        const saveCmd = cmds.find((c) => c.id === "editor:save");
        saveCmd?.action();
      }

      // Ctrl+1-5 for workspace switching
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        const workspaceMap: Record<string, WorkspaceId> = {
          "1": "editor",
          "2": "canvas",
          "3": "analytics",
          "4": "accounts",
          "5": "distribute",
          "6": "calendar",
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
  }, [hasOnboarded, toggleCommandPalette, setActiveWorkspace, resetOnboarding]);

  // Show landing page if not onboarded
  if (!hasOnboarded) {
    return (
      <Suspense
        fallback={
          <div className="h-screen w-screen flex items-center justify-center bg-[#000]">
            <Loader2 className="w-5 h-5 animate-spin text-white/20" />
          </div>
        }
      >
        <LandingPage onComplete={completeOnboarding} />
      </Suspense>
    );
  }

  return (
    <ErrorBoundary fallbackLabel="Station">
      <AppShell />
      {showShortcutHelp && <ShortcutHelp onClose={() => setShowShortcutHelp(false)} />}
    </ErrorBoundary>
  );
}
