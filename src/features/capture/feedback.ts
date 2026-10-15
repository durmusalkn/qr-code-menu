import { create } from 'zustand';

/** Lets screens show a short "saved" confirmation after any capture, wherever it happened. */
interface CaptureFeedback {
  lastSavedAt: number | null;
  markSaved(): void;
}

export const useCaptureFeedback = create<CaptureFeedback>((set) => ({
  lastSavedAt: null,
  markSaved: () => set({ lastSavedAt: Date.now() }),
}));
