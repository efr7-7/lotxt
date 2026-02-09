import { create } from "zustand";

export type WorkspaceId = "editor" | "canvas" | "analytics" | "accounts" | "social-preview";

interface WorkspaceState {
  activeWorkspace: WorkspaceId;
  previousWorkspace: WorkspaceId | null;
  setActiveWorkspace: (id: WorkspaceId) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  activeWorkspace: "editor",
  previousWorkspace: null,
  setActiveWorkspace: (id) =>
    set({
      previousWorkspace: get().activeWorkspace,
      activeWorkspace: id,
    }),
}));
