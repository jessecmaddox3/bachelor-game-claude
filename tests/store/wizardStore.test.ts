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

const { normalizeDraft, useWizardStore } = await import('../../src/store/wizardStore');
const { createJesse2017Draft } = await import('../../src/content/occasions');

describe('wizardStore', () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
  });

  it('starts with a family Kids Weekend board and no selected activities', () => {
    const s = useWizardStore.getState();
    expect(s.step).toBe(0);
    expect(s.draft.title).toBe('Kids Weekend');
    expect(s.draft.honoree).toBe('');
    expect(s.draft.players).toEqual([
      'Bo', 'Bobbie', 'Brett', 'Caz', 'Coco', 'Eleanor', 'Hunter', 'Jack', 'Jess', 'Kait',
      'Mary', 'Nona', 'Rachel', 'SG', 'Shasha', 'Steven',
    ]);
    expect(s.draft.activities).toEqual([]);
    expect(s.draft.libraryOccasion).toBe('kids-weekend');
    expect(s.draft.posterSize).toBe('24x36');
  });

  it('locks the poster size to 60×48 whenever the landscape-brackets template is active', () => {
    // Switching to the fixed 60×48 landscape layout forces the size to match,
    // even if a mismatched size is patched in the same or a later update.
    useWizardStore.getState().patch({ template: 'landscapeBrackets', posterSize: '18x24' });
    expect(useWizardStore.getState().draft.posterSize).toBe('60x48');
    useWizardStore.getState().patch({ posterSize: '24x36' });
    expect(useWizardStore.getState().draft.posterSize).toBe('60x48');
    // Portrait boards can still choose any size.
    useWizardStore.getState().patch({ template: 'portrait', posterSize: '24x36' });
    expect(useWizardStore.getState().draft.posterSize).toBe('24x36');
  });

  it('patches the draft immutably', () => {
    const before = useWizardStore.getState().draft;
    useWizardStore.getState().patch({ honoree: 'Kyle' });
    const after = useWizardStore.getState().draft;
    expect(after.honoree).toBe('Kyle');
    expect(before).not.toBe(after);
  });

  it('replaces a draft atomically', () => {
    const replacement = structuredClone(useWizardStore.getState().draft);
    replacement.honoree = 'Jesse';
    replacement.players = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    useWizardStore.getState().replaceDraft(replacement);
    expect(useWizardStore.getState().draft).toEqual(replacement);
    expect(useWizardStore.getState().draft.honoree).toBe('Jesse');
  });

  it('normalizes partial drafts through the shared restoration boundary', () => {
    const normalized = normalizeDraft({
      title: 'Legacy board',
      template: 'landscapeBrackets',
      posterSize: '18x24',
      activities: [{ name: 'Legacy activity', points: 1, bonus: false }],
    } as Parameters<typeof normalizeDraft>[0]);

    expect(normalized.title).toBe('Legacy board');
    expect(normalized.rulesTitle).toBe('GAME RULES:');
    expect(normalized.letterHeaderStyle).toBe('large');
    expect(normalized.includeRules).toBe(true);
    expect(normalized.activities[0]?.uid).toEqual(expect.any(String));
    expect(normalized.posterSize).toBe('60x48');
  });

  it('migrates legacy catalog ids without changing customized row values', () => {
    const normalized = normalizeDraft({
      ...useWizardStore.getState().draft,
      activities: [{
        uid: 'stable-row',
        catalogId: 'fam-taste-test',
        name: 'Our custom taste challenge',
        points: 9,
        maxPoints: 18,
        bonus: true,
      }],
    });

    expect(normalized.activities[0]).toEqual({
      uid: 'stable-row',
      catalogId: 'blind-snack-rank',
      name: 'Our custom taste challenge',
      points: 9,
      maxPoints: 18,
      bonus: true,
    });
  });

  it('persists via the storage key with a schema version', () => {
    expect(useWizardStore.persist.getOptions().name).toBe('game-board-v5');
  });

  it('backfills fields missing from a legacy persisted draft', async () => {
    const legacy = structuredClone(useWizardStore.getState().draft) as Record<string, unknown>;
    delete legacy.pointsRangeFormat;
    delete legacy.rulesTitle;
    delete legacy.rulesContent;
    delete legacy.letterHeaderStyle;
    delete legacy.includeRules;
    localStorage.setItem('game-board-v5', JSON.stringify({ state: { draft: legacy, step: 1 }, version: 0 }));
    await useWizardStore.persist.rehydrate();
    const draft = useWizardStore.getState().draft;
    expect(draft.pointsRangeFormat).toBe('words');
    expect(draft.rulesTitle).toBe('GAME RULES:');
    expect(draft.rulesContent).toMatch(/HONOR SYSTEM/);
    expect(draft.letterHeaderStyle).toBe('large');
    expect(draft.includeRules).toBe(true);
  });

  it('persists the complete atomically replaced occasion draft', () => {
    useWizardStore.getState().replaceDraft(createJesse2017Draft());
    const saved = JSON.parse(localStorage.getItem('game-board-v5')!) as { state: { draft: Record<string, unknown> } };
    expect(saved.state.draft.honoree).toBe('JESSE CORDELL MADDOX, III');
    expect(saved.state.draft.players).toHaveLength(30);
    expect(saved.state.draft.activities).toHaveLength(37);
    expect(saved.state.draft.rulesTitle).toBe('');
    expect(saved.state.draft.rulesContent).toContain('SECTION 6. TERM');
  });
});
