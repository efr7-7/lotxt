import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";

export interface ImageEntry {
  id: string;
  filename: string;
  path: string;
  size: number;
  created_at: string;
}

interface ImageState {
  images: ImageEntry[];
  isLoading: boolean;
  error: string | null;

  loadImages: () => Promise<void>;
  uploadImage: (filePath: string) => Promise<ImageEntry>;
  deleteImage: (id: string) => Promise<void>;
  getImageUrl: (entry: ImageEntry) => string;
}

export const useImageStore = create<ImageState>((set, get) => ({
  images: [],
  isLoading: false,
  error: null,

  loadImages: async () => {
    set({ isLoading: true, error: null });
    try {
      const images = await invoke<ImageEntry[]>("list_images");
      set({ images, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  uploadImage: async (filePath: string) => {
    set({ isLoading: true, error: null });
    try {
      const entry = await invoke<ImageEntry>("upload_image", { filePath });
      set((state) => ({
        images: [entry, ...state.images],
        isLoading: false,
      }));
      return entry;
    } catch (e) {
      set({ error: String(e), isLoading: false });
      throw e;
    }
  },

  deleteImage: async (id: string) => {
    try {
      await invoke("delete_image", { imageId: id });
      set((state) => ({
        images: state.images.filter((img) => img.id !== id),
      }));
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  getImageUrl: (entry: ImageEntry) => {
    // Convert local file path to Tauri asset URL
    return convertFileSrc(entry.path);
  },
}));
