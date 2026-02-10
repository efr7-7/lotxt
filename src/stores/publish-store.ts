import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { PlatformId } from "@/lib/platforms";
import { handleTauriError, withRetry } from "@/lib/error-handler";

export interface PublishTarget {
  platform: PlatformId;
  accountId: string;
  publicationId: string;
  accountName: string;
  title: string;
  subtitle: string;
  previewText: string;
  status: "draft" | "published";
  scheduledAt?: string | null;
  publishStatus: "idle" | "publishing" | "success" | "error";
  resultMessage: string;
}

type PublishStep = "select" | "configure" | "publishing" | "results";

interface PublishState {
  targets: PublishTarget[];
  isPublishing: boolean;
  currentStep: PublishStep;

  // Actions
  addTarget: (target: Omit<PublishTarget, "publishStatus" | "resultMessage">) => void;
  removeTarget: (accountId: string) => void;
  updateTarget: (accountId: string, updates: Partial<PublishTarget>) => void;
  setStep: (step: PublishStep) => void;
  publishToAll: (htmlContent: string) => Promise<void>;
  retryTarget: (accountId: string, htmlContent: string) => Promise<void>;
  reset: () => void;
}

export const usePublishStore = create<PublishState>((set, get) => ({
  targets: [],
  isPublishing: false,
  currentStep: "select",

  addTarget: (target) =>
    set((state) => ({
      targets: [
        ...state.targets,
        { ...target, publishStatus: "idle", resultMessage: "" },
      ],
    })),

  removeTarget: (accountId) =>
    set((state) => ({
      targets: state.targets.filter((t) => t.accountId !== accountId),
    })),

  updateTarget: (accountId, updates) =>
    set((state) => ({
      targets: state.targets.map((t) =>
        t.accountId === accountId ? { ...t, ...updates } : t
      ),
    })),

  setStep: (step) => set({ currentStep: step }),

  publishToAll: async (htmlContent) => {
    const { targets } = get();
    set({ isPublishing: true, currentStep: "publishing" });

    for (const target of targets) {
      set((state) => ({
        targets: state.targets.map((t) =>
          t.accountId === target.accountId
            ? { ...t, publishStatus: "publishing" }
            : t
        ),
      }));

      try {
        // Use scheduled path if scheduledAt is set
        if (target.scheduledAt) {
          const eventId = await withRetry(
            () => invoke<string>("schedule_post", {
              platform: target.platform,
              accountId: target.accountId,
              publicationId: target.publicationId,
              request: {
                title: target.title,
                html_content: htmlContent,
                subtitle: target.subtitle || null,
                preview_text: target.previewText || null,
                status: target.status,
              },
              scheduledAt: target.scheduledAt,
            }),
            1, // 1 retry
          );

          const scheduledDate = new Date(target.scheduledAt).toLocaleString();
          set((state) => ({
            targets: state.targets.map((t) =>
              t.accountId === target.accountId
                ? { ...t, publishStatus: "success", resultMessage: `Scheduled for ${scheduledDate}` }
                : t
            ),
          }));
        } else {
          const postId = await withRetry(
            () => invoke<string>("publish_post", {
              platform: target.platform,
              accountId: target.accountId,
              publicationId: target.publicationId,
              request: {
                title: target.title,
                html_content: htmlContent,
                subtitle: target.subtitle || null,
                preview_text: target.previewText || null,
                status: target.status,
              },
            }),
            1, // 1 retry
          );

          set((state) => ({
            targets: state.targets.map((t) =>
              t.accountId === target.accountId
                ? { ...t, publishStatus: "success", resultMessage: `Published — Post ID: ${postId}` }
                : t
            ),
          }));
        }
      } catch (e) {
        const friendlyMsg = handleTauriError(e, `Publishing to ${target.accountName}`);
        set((state) => ({
          targets: state.targets.map((t) =>
            t.accountId === target.accountId
              ? { ...t, publishStatus: "error", resultMessage: friendlyMsg }
              : t
          ),
        }));
      }
    }

    set({ isPublishing: false, currentStep: "results" });
  },

  retryTarget: async (accountId, htmlContent) => {
    const target = get().targets.find((t) => t.accountId === accountId);
    if (!target) return;

    set((state) => ({
      targets: state.targets.map((t) =>
        t.accountId === accountId
          ? { ...t, publishStatus: "publishing", resultMessage: "" }
          : t
      ),
    }));

    try {
      const postId = await withRetry(
        () => invoke<string>("publish_post", {
          platform: target.platform,
          accountId: target.accountId,
          publicationId: target.publicationId,
          request: {
            title: target.title,
            html_content: htmlContent,
            subtitle: target.subtitle || null,
            preview_text: target.previewText || null,
            status: target.status,
          },
        }),
        1,
      );

      set((state) => ({
        targets: state.targets.map((t) =>
          t.accountId === accountId
            ? { ...t, publishStatus: "success", resultMessage: `Published — Post ID: ${postId}` }
            : t
        ),
      }));
    } catch (e) {
      const friendlyMsg = handleTauriError(e, `Retry to ${target.accountName}`);
      set((state) => ({
        targets: state.targets.map((t) =>
          t.accountId === accountId
            ? { ...t, publishStatus: "error", resultMessage: friendlyMsg }
            : t
        ),
      }));
    }
  },

  reset: () =>
    set({
      targets: [],
      isPublishing: false,
      currentStep: "select",
    }),
}));
