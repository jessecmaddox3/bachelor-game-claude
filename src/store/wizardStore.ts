import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultDraft, type Draft } from './toBoardSpec';

// The landscape-brackets template renders a fixed 60×48 scene, so keep the
// poster size locked to match — otherwise an export can be named for one size
// while containing another. Returns the same reference when nothing changes.
function enforceTemplateSize(draft: Draft): Draft {
  if (draft.template === 'landscapeBrackets' && draft.posterSize !== '60x48') {
    return { ...draft, posterSize: '60x48' };
  }
  return draft;
}

/** Restore a complete, internally consistent draft from any persisted snapshot. */
export function normalizeDraft(input: Partial<Draft>): Draft {
  const draft = { ...defaultDraft(), ...input };
  draft.activities = Array.isArray(draft.activities)
    ? draft.activities.map((activity) => ({
      ...activity,
      uid: activity.uid ?? crypto.randomUUID(),
    }))
    : [];
  return enforceTemplateSize(draft);
}

interface WizardState {
  draft: Draft;
  step: 0 | 1 | 2;
  patch: (p: Partial<Draft>) => void;
  replaceDraft: (draft: Draft) => void;
  setStep: (s: 0 | 1 | 2) => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      draft: defaultDraft(),
      step: 0,
      patch: (p) => set((s) => ({ draft: enforceTemplateSize({ ...s.draft, ...p }) })),
      replaceDraft: (draft) => set({ draft: normalizeDraft(draft) }),
      setStep: (step) => set({ step }),
      reset: () => set({ draft: defaultDraft(), step: 0 }),
    }),
    // Versioned key: older saves used different setup and rules shapes.
    {
      name: 'game-board-v5',
      // Normalize persisted drafts so newly-added fields and editor-only row
      // identities are restored through the same boundary as named saves.
      merge: (persisted, current) => {
        const p = persisted as Partial<WizardState> | undefined;
        return { ...current, ...p, draft: normalizeDraft(p?.draft ?? {}) };
      },
    },
  ),
);
