import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  sortOrder: number;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

type FilterMode = "all" | "recent" | "drafts" | "scheduled" | "published" | string; // string = projectId

interface ProjectsState {
  projects: Project[];
  activeFilter: FilterMode;
  isLoading: boolean;

  setActiveFilter: (filter: FilterMode) => void;
  fetchProjects: () => Promise<void>;
  createProject: (name: string, color?: string, icon?: string) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Pick<Project, "name" | "color" | "icon">>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  moveDocument: (documentId: string, projectId: string | null) => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  activeFilter: "all",
  isLoading: false,

  setActiveFilter: (filter) => set({ activeFilter: filter }),

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const raw = await invoke<any[]>("list_projects");
      set({
        projects: raw.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          color: p.color,
          icon: p.icon,
          sortOrder: p.sort_order,
          documentCount: p.document_count,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        })),
      });
    } catch {
      // Ignore — may not be in Tauri
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (name, color, icon) => {
    const raw = await invoke<any>("create_project", { name, color, icon });
    const project: Project = {
      id: raw.id,
      name: raw.name,
      description: raw.description,
      color: raw.color,
      icon: raw.icon,
      sortOrder: raw.sort_order,
      documentCount: raw.document_count,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    };
    set((s) => ({ projects: [...s.projects, project] }));
    return project;
  },

  updateProject: async (id, updates) => {
    await invoke("update_project", { id, ...updates });
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    }));
  },

  deleteProject: async (id) => {
    await invoke("delete_project", { id });
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      activeFilter: s.activeFilter === id ? "all" : s.activeFilter,
    }));
  },

  moveDocument: async (documentId, projectId) => {
    await invoke("move_document_to_project", { documentId, projectId });
    // Refresh project counts
    get().fetchProjects();
  },
}));
