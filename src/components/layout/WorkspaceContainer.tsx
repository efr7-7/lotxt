import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { WorkspaceSearch } from "@/components/shared/WorkspaceSearch";
import { cn } from "@/lib/utils";

// Lazy-load each workspace for code splitting
const HomeWorkspace = lazy(() => import("@/components/home/HomeWorkspace"));
const EditorWorkspace = lazy(() => import("@/components/editor/EditorWorkspace"));
const CanvasWorkspace = lazy(() => import("@/components/canvas/CanvasWorkspace"));
const AnalyticsWorkspace = lazy(() => import("@/components/analytics/AnalyticsWorkspace"));
const AccountsWorkspace = lazy(() => import("@/components/accounts/AccountsWorkspace"));
const DistributeWorkspace = lazy(() => import("@/components/distribute/DistributeWorkspace"));
const CalendarWorkspace = lazy(() => import("@/components/calendar/CalendarWorkspace"));

/* ─── Branded Loading Skeleton ─── */
function WorkspaceLoader() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6">
      {/* Pulsing brand mark */}
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(252,56%,62%)] to-[hsl(270,60%,52%)] flex items-center justify-center shadow-[0_2px_8px_rgba(124,58,237,0.25)]">
          <span className="text-[14px] font-extrabold text-white leading-none" style={{ letterSpacing: "-0.05em" }}>S</span>
        </div>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[hsl(252,56%,62%)] to-[hsl(270,60%,52%)] animate-ping opacity-20" />
      </div>
      {/* Skeleton lines */}
      <div className="flex flex-col items-center gap-2">
        <div className="h-2 w-32 rounded-full bg-muted animate-pulse" />
        <div className="h-2 w-20 rounded-full bg-muted/60 animate-pulse" style={{ animationDelay: "150ms" }} />
      </div>
    </div>
  );
}

/* ─── Workspace Transition Wrapper ─── */
function WorkspaceTransition({ children, id }: { children: React.ReactNode; id: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      key={id}
      className={cn(
        "h-full w-full transition-all duration-200",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[3px]",
      )}
      style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      {children}
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
      <div className="h-full w-full relative">
        {/* Global workspace search (Ctrl+/ or Ctrl+K) */}
        <WorkspaceSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />

        {activeWorkspace === "home" && (
          <WorkspaceTransition id="home">
            <ErrorBoundary fallbackLabel="Home">
              <HomeWorkspace />
            </ErrorBoundary>
          </WorkspaceTransition>
        )}
        {activeWorkspace === "editor" && (
          <WorkspaceTransition id="editor">
            <ErrorBoundary fallbackLabel="Editor">
              <EditorWorkspace />
            </ErrorBoundary>
          </WorkspaceTransition>
        )}
        {activeWorkspace === "canvas" && (
          <WorkspaceTransition id="canvas">
            <ErrorBoundary fallbackLabel="Canvas">
              <CanvasWorkspace />
            </ErrorBoundary>
          </WorkspaceTransition>
        )}
        {activeWorkspace === "analytics" && (
          <WorkspaceTransition id="analytics">
            <ErrorBoundary fallbackLabel="Analytics">
              <AnalyticsWorkspace />
            </ErrorBoundary>
          </WorkspaceTransition>
        )}
        {activeWorkspace === "accounts" && (
          <WorkspaceTransition id="accounts">
            <ErrorBoundary fallbackLabel="Accounts">
              <AccountsWorkspace />
            </ErrorBoundary>
          </WorkspaceTransition>
        )}
        {activeWorkspace === "distribute" && (
          <WorkspaceTransition id="distribute">
            <ErrorBoundary fallbackLabel="Distribute">
              <DistributeWorkspace />
            </ErrorBoundary>
          </WorkspaceTransition>
        )}
        {activeWorkspace === "calendar" && (
          <WorkspaceTransition id="calendar">
            <ErrorBoundary fallbackLabel="Calendar">
              <CalendarWorkspace />
            </ErrorBoundary>
          </WorkspaceTransition>
        )}
      </div>
    </Suspense>
  );
}
