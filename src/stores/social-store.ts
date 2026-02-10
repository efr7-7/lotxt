import { create } from "zustand";
import type { OGMeta } from "@/types/social";

interface SocialState {
  ogMeta: OGMeta;
  activePlatform: "twitter" | "linkedin" | "facebook" | "email" | "youtube" | "tiktok" | "all";
  setOGMeta: (meta: Partial<OGMeta>) => void;
  setActivePlatform: (p: SocialState["activePlatform"]) => void;
  deriveFromEditor: (title: string, htmlContent: string) => void;
}

const defaultMeta: OGMeta = {
  title: "",
  description: "",
  image: "",
  siteName: "",
  url: "",
  author: "",
  publishDate: "",
};

export const useSocialStore = create<SocialState>((set) => ({
  ogMeta: defaultMeta,
  activePlatform: "all",
  setOGMeta: (meta) =>
    set((state) => ({
      ogMeta: { ...state.ogMeta, ...meta },
    })),
  setActivePlatform: (p) => set({ activePlatform: p }),
  deriveFromEditor: (title, htmlContent) => {
    // Extract first paragraph as description
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const firstP = tempDiv.querySelector("p");
    const description = firstP?.textContent?.slice(0, 200) || "";

    // Extract first image
    const firstImg = tempDiv.querySelector("img");
    const image = firstImg?.getAttribute("src") || "";

    set((state) => ({
      ogMeta: {
        ...state.ogMeta,
        title: title || state.ogMeta.title,
        description: description || state.ogMeta.description,
        image: image || state.ogMeta.image,
      },
    }));
  },
}));
