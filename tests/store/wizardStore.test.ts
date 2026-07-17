import { describe, it, expect, beforeEach } from 'vitest';

// zustand v5's persist default is createJSONStorage(() => window.localStorage):
// it reads `window` (undefined in plain Node) at store-creation time and, when
// that throws, never attaches the `persist` API. Node 25 also ships a broken
// localStorage global (setItem is not a function without --localstorage-file).
// So: install a working shim, and expose it via a `window` global, BEFORE the
// store module loads. Static imports hoist above any inline code; a top-level
// dynamic import sequences correctly.
if (typeof globalThis.localStorage?.setItem !== 'function') {
  const mem = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
    clear: () => mem.clear(),
    key: (i: number) => [...mem.keys()][i] ?? null,
    get length() {
      return mem.size;
    },
  } as Storage;
}
if (typeof globalThis.window === 'undefined') {
  (globalThis as Record<string, unknown>).window = globalThis;
}

const { useWizardStore } = await import('../../src/store/wizardStore');

describe('wizardStore', () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
  });

  it('starts with a renderable default draft and step 0', () => {
    const s = useWizardStore.getState();
    expect(s.step).toBe(0);
    expect(s.draft.players.length).toBeGreaterThanOrEqual(8);
    expect(s.draft.activities.length).toBeGreaterThanOrEqual(10);
  });

  it('patches the draft immutably', () => {
    const before = useWizardStore.getState().draft;
    useWizardStore.getState().patch({ honoree: 'Kyle' });
    const after = useWizardStore.getState().draft;
    expect(after.honoree).toBe('Kyle');
    expect(before).not.toBe(after);
  });

  it('persists via the storage key with a schema version', () => {
    expect(useWizardStore.persist.getOptions().name).toBe('bachelor-board-v2');
  });
});
