import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { useAiStore, SYSTEM_PROMPTS } from "./ai-store";
import { useEditorStore } from "./editor-store";
import { useAccountsStore } from "./accounts-store";
import { handleTauriError } from "@/lib/error-handler";
import { toast } from "./toast-store";

// ─── Types ───

export type DistributionChannel = "twitter" | "linkedin" | "email_subject" | "summary" | "og_meta" | "youtube_description" | "tiktok_caption" | "reels_caption";

export interface DistributionVariant {
  channel: DistributionChannel;
  content: string;
  isGenerating: boolean;
  isEdited: boolean;
  lastGenerated: string | null;
}

interface DistributeState {
  variants: Record<DistributionChannel, DistributionVariant>;
  isPublishing: boolean;
  postingTwitter: boolean;
  postingLinkedin: boolean;

  // Actions
  generateVariant: (channel: DistributionChannel) => Promise<void>;
  generateAll: () => Promise<void>;
  updateVariant: (channel: DistributionChannel, content: string) => void;
  resetVariant: (channel: DistributionChannel) => void;
  refineVariant: (channel: DistributionChannel, instruction: string) => Promise<void>;
  postToTwitter: () => Promise<string[]>;
  postToLinkedin: (articleUrl?: string) => Promise<string>;
  publishAll: () => Promise<void>;
}

const createEmptyVariant = (channel: DistributionChannel): DistributionVariant => ({
  channel,
  content: "",
  isGenerating: false,
  isEdited: false,
  lastGenerated: null,
});

export const useDistributeStore = create<DistributeState>((set, get) => ({
  variants: {
    twitter: createEmptyVariant("twitter"),
    linkedin: createEmptyVariant("linkedin"),
    email_subject: createEmptyVariant("email_subject"),
    summary: createEmptyVariant("summary"),
    og_meta: createEmptyVariant("og_meta"),
    youtube_description: createEmptyVariant("youtube_description"),
    tiktok_caption: createEmptyVariant("tiktok_caption"),
    reels_caption: createEmptyVariant("reels_caption"),
  },
  isPublishing: false,
  postingTwitter: false,
  postingLinkedin: false,

  generateVariant: async (channel) => {
    const { currentDocument } = useEditorStore.getState();
    const sourceContent = currentDocument.htmlContent || currentDocument.title || "";

    if (!sourceContent.trim()) {
      throw new Error("Write some content first — nothing to adapt.");
    }

    // Clear content and set generating
    set((state) => ({
      variants: {
        ...state.variants,
        [channel]: { ...state.variants[channel], content: "", isGenerating: true },
      },
    }));

    try {
      const ai = useAiStore.getState();
      const promptMap: Record<DistributionChannel, keyof typeof SYSTEM_PROMPTS> = {
        twitter: "twitterThread",
        linkedin: "linkedinPost",
        email_subject: "emailSubjects",
        summary: "summary",
        og_meta: "summary",
        youtube_description: "youtubeDescription",
        tiktok_caption: "tiktokCaption",
        reels_caption: "reelsCaption",
      };

      const promptKey = promptMap[channel];
      const inputContent = `Title: ${currentDocument.title}\n\nContent:\n${sourceContent}`;

      // Try streaming first (with 30s timeout)
      try {
        const STREAM_TIMEOUT_MS = 30_000;
        await Promise.race([
          new Promise<void>((resolve, reject) => {
            let cleanup: (() => void) | null = null;

            ai.streamAction(
              promptKey,
              inputContent,
              // onChunk — append to variant content
              (chunk) => {
                set((state) => ({
                  variants: {
                    ...state.variants,
                    [channel]: {
                      ...state.variants[channel],
                      content: state.variants[channel].content + chunk,
                    },
                  },
                }));
              },
              // onDone
              () => {
                set((state) => ({
                  variants: {
                    ...state.variants,
                    [channel]: {
                      ...state.variants[channel],
                      isGenerating: false,
                      isEdited: false,
                      lastGenerated: new Date().toISOString(),
                    },
                  },
                }));
                cleanup?.();
                resolve();
              },
              // onError
              (error) => {
                cleanup?.();
                reject(new Error(error));
              }
            ).then((c) => { cleanup = c; });
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Generation timed out after 30 seconds. Try again.")), STREAM_TIMEOUT_MS)
          ),
        ]);
      } catch {
        // Fall back to non-streaming
        const content = await ai.quickAction(promptKey, inputContent);
        set((state) => ({
          variants: {
            ...state.variants,
            [channel]: {
              ...state.variants[channel],
              content,
              isGenerating: false,
              isEdited: false,
              lastGenerated: new Date().toISOString(),
            },
          },
        }));
      }
    } catch (e) {
      const friendlyMsg = handleTauriError(e, "Content generation");
      set((state) => ({
        variants: {
          ...state.variants,
          [channel]: { ...state.variants[channel], isGenerating: false },
        },
      }));
      // Show actionable toast for AI provider errors
      if (/api key|provider|configured/i.test(friendlyMsg)) {
        toast.error("Configure an AI provider in Accounts → AI Settings");
      } else {
        toast.error(friendlyMsg);
      }
      throw e;
    }
  },

  generateAll: async () => {
    const channels: DistributionChannel[] = ["twitter", "linkedin", "email_subject", "summary"];
    await Promise.allSettled(channels.map((ch) => get().generateVariant(ch)));
  },

  updateVariant: (channel, content) =>
    set((state) => ({
      variants: {
        ...state.variants,
        [channel]: { ...state.variants[channel], content, isEdited: true },
      },
    })),

  resetVariant: (channel) =>
    set((state) => ({
      variants: {
        ...state.variants,
        [channel]: createEmptyVariant(channel),
      },
    })),

  refineVariant: async (channel, instruction) => {
    const variant = get().variants[channel];
    if (!variant.content) throw new Error("Generate content first.");

    set((state) => ({
      variants: {
        ...state.variants,
        [channel]: { ...state.variants[channel], content: "", isGenerating: true },
      },
    }));

    try {
      const ai = useAiStore.getState();
      const response = await ai.chat(
        [
          { role: "user", content: `Here is the current content:\n\n${variant.content}\n\n---\n\nPlease refine it with this instruction: ${instruction}` },
        ],
        "You are a content editor. Refine the provided content according to the user's instruction. Output only the refined content, no meta-commentary.",
      );

      set((state) => ({
        variants: {
          ...state.variants,
          [channel]: {
            ...state.variants[channel],
            content: response.content,
            isGenerating: false,
            isEdited: false,
            lastGenerated: new Date().toISOString(),
          },
        },
      }));
    } catch (e) {
      // Restore previous content on error
      set((state) => ({
        variants: {
          ...state.variants,
          [channel]: { ...state.variants[channel], content: variant.content, isGenerating: false },
        },
      }));
      throw e;
    }
  },

  postToTwitter: async () => {
    const variant = get().variants.twitter;
    if (!variant.content) throw new Error("Generate a Twitter thread first.");

    const accounts = useAccountsStore.getState().accounts;
    const twitterAcc = accounts.find((a) => a.platform === "twitter" && a.isConnected);
    if (!twitterAcc) throw new Error("No connected Twitter account.");

    set({ postingTwitter: true });
    try {
      // Split content on --- delimiters
      const tweets = variant.content
        .split(/---/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        // Remove leading numbering like "1/" or "1."
        .map((t) => t.replace(/^\d+[/.]\s*/, ""));

      if (tweets.length === 1) {
        const id = await invoke<string>("post_tweet", {
          accountId: twitterAcc.accountId,
          content: tweets[0],
        });
        set({ postingTwitter: false });
        return [id];
      }

      const ids = await invoke<string[]>("post_thread", {
        accountId: twitterAcc.accountId,
        tweets,
      });
      set({ postingTwitter: false });
      return ids;
    } catch (e) {
      set({ postingTwitter: false });
      throw e;
    }
  },

  postToLinkedin: async (articleUrl?: string) => {
    const variant = get().variants.linkedin;
    if (!variant.content) throw new Error("Generate a LinkedIn post first.");

    const accounts = useAccountsStore.getState().accounts;
    const linkedinAcc = accounts.find((a) => a.platform === "linkedin" && a.isConnected);
    if (!linkedinAcc) throw new Error("No connected LinkedIn account.");

    set({ postingLinkedin: true });
    try {
      const id = await invoke<string>("post_linkedin", {
        accountId: linkedinAcc.accountId,
        content: variant.content,
        articleUrl: articleUrl || null,
      });
      set({ postingLinkedin: false });
      return id;
    } catch (e) {
      set({ postingLinkedin: false });
      throw e;
    }
  },

  publishAll: async () => {
    set({ isPublishing: true });
    try {
      const promises: Promise<unknown>[] = [];
      const { variants } = get();
      if (variants.twitter.content) promises.push(get().postToTwitter());
      if (variants.linkedin.content) promises.push(get().postToLinkedin());
      await Promise.allSettled(promises);
      set({ isPublishing: false });
    } catch (e) {
      set({ isPublishing: false });
      throw e;
    }
  },
}));
