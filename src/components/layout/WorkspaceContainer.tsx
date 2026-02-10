import { lazy, Suspense, useState, useEffect, useCallback } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { WorkspaceSearch } from "@/components/shared/WorkspaceSearch";

// Lazy-load each workspace for code splitting
const HomeWorkspace = lazy(() => import("@/components/home/HomeWorkspace"));
const EditorWorkspace = lazy(() => import("@/components/editor/EditorWorkspace"));
const CanvasWorkspace = lazy(() => import("@/components/canvas/CanvasWorkspace"));
const AnalyticsWorkspace = lazy(() => import("@/components/analytics/AnalyticsWorkspace"));
const AccountsWorkspace = lazy(() => import("@/components/accounts/AccountsWorkspace"));
const DistributeWorkspace = lazy(() => import("@/components/distribute/DistributeWorkspace"));
const CalendarWorkspace = lazy(() => import("@/components/calendar/CalendarWorkspace"));

function WorkspaceLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
}

export function WorkspaceContainer() {
  const { activeWorkspace } = useWorkspaceStore();
  const [showSearch, setShowSearch] = useState(false);

  // Global Ctrl+/ or Ctrl+K shortcut for workspace search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setShowSearch((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k" && !e.shiftKey) {
        e.preventDefault();
        setShowSearch((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <Suspense fallback={<WorkspaceLoader />}>
      <div className="h-full w-full">
        {/* Global workspace search (Ctrl+/ or Ctrl+K) */}
        <WorkspaceSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
        {activeWorkspace === "home" && (
          <ErrorBoundary fallbackLabel="Home">
            <HomeWorkspace />
          </ErrorBoundary>
        )}
        {activeWorkspace === "editor" && (
          <ErrorBoundary fallbackLabel="Editor">
            <EditorWorkspace />
          </ErrorBoundary>
        )}
        {activeWorkspace === "canvas" && (
          <ErrorBoundary fallbackLabel="Canvas">
            <CanvasWorkspace />
          </ErrorBoundary>
        )}
        {activeWorkspace === "analytics" && (
          <ErrorBoundary fallbackLabel="Analytics">
            <AnalyticsWorkspace />
          </ErrorBoundary>
        )}
        {activeWorkspace === "accounts" && (
          <ErrorBoundary fallbackLabel="Accounts">
            <AccountsWorkspace />
          </ErrorBoundary>
        )}
        {activeWorkspace === "distribute" && (
          <ErrorBoundary fallbackLabel="Distribute">
            <DistributeWorkspace />
          </ErrorBoundary>
        )}
        {activeWorkspace === "calendar" && (
          <ErrorBoundary fallbackLabel="Calendar">
            <CalendarWorkspace />
          </ErrorBoundary>
        )}
      </div>
    </Suspense>
  );
}
