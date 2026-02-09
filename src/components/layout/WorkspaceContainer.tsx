import { lazy, Suspense } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Loader2 } from "lucide-react";

// Lazy-load each workspace for code splitting
const EditorWorkspace = lazy(() => import("@/components/editor/EditorWorkspace"));
const CanvasWorkspace = lazy(() => import("@/components/canvas/CanvasWorkspace"));
const AnalyticsWorkspace = lazy(() => import("@/components/analytics/AnalyticsWorkspace"));
const AccountsWorkspace = lazy(() => import("@/components/accounts/AccountsWorkspace"));
const SocialPreviewWorkspace = lazy(() => import("@/components/social-preview/SocialPreviewWorkspace"));

function WorkspaceLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
}

export function WorkspaceContainer() {
  const { activeWorkspace } = useWorkspaceStore();

  return (
    <Suspense fallback={<WorkspaceLoader />}>
      <div className="h-full w-full">
        {activeWorkspace === "editor" && <EditorWorkspace />}
        {activeWorkspace === "canvas" && <CanvasWorkspace />}
        {activeWorkspace === "analytics" && <AnalyticsWorkspace />}
        {activeWorkspace === "accounts" && <AccountsWorkspace />}
        {activeWorkspace === "social-preview" && <SocialPreviewWorkspace />}
      </div>
    </Suspense>
  );
}
