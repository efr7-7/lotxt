import { create } from "zustand";
import { useStreakStore } from "./streak-store";
import { useEditorStore } from "./editor-store";

export interface WritingSession {
  startedAt: string;
  startWordCount: number;
  goalWords: number | null;
  isActive: boolean;
}

interface SessionState {
  currentSession: WritingSession | null;
  showCelebration: boolean;
  lastSessionStats: { wordsWritten: number; minutes: number } | null;

  /* Actions */
  startSession: (goalWords?: number) => void;
  endSession: () => void;
  checkProgress: (currentWordCount: number) => void;
  dismissCelebration: () => void;
}

const MOTIVATIONAL_LINES = [
  "Ideas become reality.",
  "Another step toward your empire.",
  "The words are flowing.",
  "Your audience will love this.",
  "Creating is your superpower.",
  "That's the magic of consistency.",
  "From thought to published — that's you.",
  "Every word counts. Literally.",
];

export function getMotivationalLine(): string {
  return MOTIVATIONAL_LINES[Math.floor(Math.random() * MOTIVATIONAL_LINES.length)];
}

export const useSessionStore = create<SessionState>((set, get) => ({
  currentSession: null,
  showCelebration: false,
  lastSessionStats: null,

  startSession: (goalWords) => {
    // Read the current word count from the editor store
    const currentWordCount = useEditorStore.getState().currentDocument.wordCount;
    set({
      currentSession: {
        startedAt: new Date().toISOString(),
        startWordCount: currentWordCount,
        goalWords: goalWords ?? null,
        isActive: true,
      },
      showCelebration: false,
      lastSessionStats: null,
    });
  },

  endSession: () => {
    const session = get().currentSession;
    if (!session) return;

    const minutes = Math.round(
      (Date.now() - new Date(session.startedAt).getTime()) / 60000,
    );

    set({
      currentSession: null,
      lastSessionStats: {
        wordsWritten: 0, // Will have been tracked via checkProgress
        minutes,
      },
    });
  },

  checkProgress: (currentWordCount) => {
    const session = get().currentSession;
    if (!session || !session.isActive) return;

    const wordsWritten = Math.max(0, currentWordCount - session.startWordCount);
    const minutes = Math.round(
      (Date.now() - new Date(session.startedAt).getTime()) / 60000,
    );

    // Check if goal reached
    if (session.goalWords && wordsWritten >= session.goalWords && !get().showCelebration) {
      // Record activity in streak store
      useStreakStore.getState().recordActivity("wordsWritten", wordsWritten);

      set({
        showCelebration: true,
        lastSessionStats: { wordsWritten, minutes },
        currentSession: { ...session, isActive: false },
      });
    }
  },

  dismissCelebration: () => {
    set({
      showCelebration: false,
      currentSession: null,
    });
  },
}));
