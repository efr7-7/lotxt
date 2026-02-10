import { create } from "zustand";

interface OnboardingState {
  /** Whether the user has completed onboarding (connected an account or skipped) */
  hasOnboarded: boolean;
  /** Complete onboarding — show the main app */
  completeOnboarding: () => void;
  /** Reset — go back to landing (for dev/testing) */
  resetOnboarding: () => void;
}

// Check localStorage for persisted state
const getInitialState = (): boolean => {
  try {
    return localStorage.getItem("station:onboarded") === "true";
  } catch {
    return false;
  }
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasOnboarded: getInitialState(),

  completeOnboarding: () => {
    localStorage.setItem("station:onboarded", "true");
    set({ hasOnboarded: true });
  },

  resetOnboarding: () => {
    localStorage.removeItem("station:onboarded");
    localStorage.removeItem("station:canvas-ai-welcomed");
    set({ hasOnboarded: false });
  },
}));
