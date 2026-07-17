import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultDraft, type Draft } from './toBoardSpec';

interface WizardState {
  draft: Draft;
  step: 0 | 1 | 2;
  patch: (p: Partial<Draft>) => void;
  setStep: (s: 0 | 1 | 2) => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      draft: defaultDraft(),
      step: 0,
      patch: (p) => set((s) => ({ draft: { ...s.draft, ...p } })),
      setStep: (step) => set({ step }),
      reset: () => set({ draft: defaultDraft(), step: 0 }),
    }),
    // Versioned key: build-4 saves used different keys and are deliberately ignored.
    {
      name: 'bachelor-board-v2',
      // Deep-merge the persisted draft over defaults so newly-added Draft
      // fields are backfilled from defaults instead of shipping undefined.
      merge: (persisted, current) => {
        const p = persisted as Partial<WizardState> | undefined;
        return { ...current, ...p, draft: { ...current.draft, ...(p?.draft ?? {}) } };
      },
    },
  ),
);
