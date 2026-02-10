import { create } from "zustand";

export type WorkspaceId = "home" | "editor" | "canvas" | "analytics" | "accounts" | "distribute" | "calendar";

interface WorkspaceState {
  activeWorkspace: WorkspaceId;
  previousWorkspace: WorkspaceId | null;
  setActiveWorkspace: (id: WorkspaceId) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  activeWorkspace: "home",
  previousWorkspace: null,
  setActiveWorkspace: (id) =>
    set({
      previousWorkspace: get().activeWorkspace,
      activeWorkspace: id,
    }),
}));
