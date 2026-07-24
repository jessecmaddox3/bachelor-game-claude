# Persistent Board Files and Activity Library Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make named boards behave like editable documents from every wizard step, expose full activity descriptions, and remove high-confidence catalog duplicates without breaking existing saved boards.

**Architecture:** Keep the Zustand working draft as automatic recovery and the existing local-storage collection as explicit named snapshots. Add active named-board identity to the wizard store, isolate document controls in header components, compare semantic draft fingerprints without editor-only row IDs, and migrate legacy catalog IDs through a standalone alias module. Extract catalog rows into a focused component so selection and description expansion remain independent.

**Tech Stack:** React 19, TypeScript 5.7, Zustand 5 persistence, browser localStorage, Vitest 4, Testing Library, plain CSS.

## Global Constraints

- Named saves remain explicit. Do not auto-overwrite a named snapshot after each edit.
- The automatic `game-board-v5` recovery draft remains separate from `game-board-saves-v1`.
- No cloud storage, accounts, sharing, delete, rename, version history, or Activity Guide work.
- Preserve the source-faithful 2017 historical occasion pack.
- Preserve user-edited activity names, points, maximum points, and bonus values during catalog-ID migration.
- Do not use em dashes in authored copy or documentation.
- Follow red, green, refactor for every production behavior change.
- Work in an isolated worktree and do not deploy through `jessemaddox.com` while its other active session is writing overlapping files.

> **TL;DR:** First canonicalize activity IDs and remove redundant public entries. Then add active-save state and semantic fingerprints. Build the sticky header Save and Boards dialog on those boundaries. Finally extract an expandable activity row, run the complete verification gate, obtain independent review, and deploy only when the site repository is safe.

---

## File Structure

- `src/content/activityAliases.ts`: standalone legacy-to-canonical catalog ID map used by persistence migration and content tests.
- `src/content/activities.ts`: canonical public activities, consolidated seed exclusions, and canonical recommended IDs.
- `src/content/activitySeeds.ts`: clearer names for the two distinct dessert variants.
- `src/store/wizardStore.ts`: normalized catalog IDs, active named-board identity, and replacement/reset semantics.
- `src/store/savedBoards.ts`: semantic draft fingerprints, dirty-state helpers, and storage exception boundaries.
- `src/app/BoardFileControls.tsx`: Save, Boards, keyboard shortcut, active status, storage operations, and dialog orchestration.
- `src/app/BoardFileDialog.tsx`: accessible saved-board browser and Save as form.
- `src/app/ActivityPickerRow.tsx`: independent catalog selection and full-description expansion.
- `src/app/App.tsx`: mounts persistent document controls.
- `src/app/steps/SetupStep.tsx`: removes Setup-only save/load UI and clears active identity on preset load.
- `src/app/steps/ActivitiesStep.tsx`: renders catalog choices through `ActivityPickerRow`.
- `src/index.css`: responsive document controls, dialog, save status, and expanded description styles.
- `tests/content/content.test.ts`: canonical-ID, recommendation, exact-title, and deduplication regression tests.
- `tests/store/wizardStore.test.ts`: active-save persistence and alias normalization tests.
- `tests/store/savedBoards.test.ts`: fingerprints, dirty state, malformed storage, and storage-failure tests.
- `tests/app/boardFiles.test.tsx`: persistent saving, opening, overwrite, discard, shortcut, error, and accessibility behavior.
- `tests/app/steps.test.tsx`: removes old Setup expectations and adds description-expansion behavior.
- `tests/app/appSmoke.test.tsx`: header integration and reset regression.

---

## Task 1: Canonical Activity IDs and Catalog Deduplication

**Files:**

- Create: `src/content/activityAliases.ts`
- Modify: `src/content/activities.ts`
- Modify: `src/content/activitySeeds.ts`
- Modify: `src/store/wizardStore.ts`
- Modify: `tests/content/content.test.ts`
- Modify: `tests/store/wizardStore.test.ts`

**Interfaces:**

- Produces: `ACTIVITY_ID_ALIASES: Readonly<Record<string, string>>`
- Produces: `canonicalActivityId(id: string | undefined): string | undefined`
- Changes: `normalizeDraft(input)` maps every saved `catalogId` through `canonicalActivityId` while preserving all other row fields.
- Consumes later: named-save loading and working-draft rehydration both use the migrated `normalizeDraft`.

- [ ] **Step 1: Write failing alias and deduplication tests**

Add this import and tests to `tests/content/content.test.ts`:

```ts
import { ACTIVITY_ID_ALIASES, canonicalActivityId } from '../../src/content/activityAliases';

const normalizedActivityTitle = (value: string) => value
  .toLowerCase()
  .replace(/\b(a|an|the|one)\b/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .replace(/\s+/g, ' ');

it('exposes one unambiguous public title for every safe occasion catalog', () => {
  for (const occasion of ACTIVITY_OCCASIONS) {
    const visible = groupActivitiesForOccasion(ACTIVITY_LIBRARY, occasion)
      .flatMap((group) => group.activities);
    const seen = new Map<string, string>();
    for (const activity of visible) {
      const title = normalizedActivityTitle(activity.name);
      expect(
        seen.get(title),
        `${occasion} repeats "${activity.name}" as ${seen.get(title)} and ${activity.id}`,
      ).toBeUndefined();
      seen.set(title, activity.id);
    }
  }
});

it('maps every legacy catalog id to a public canonical activity', () => {
  const publicIds = new Set(ACTIVITY_LIBRARY.map((activity) => activity.id));
  for (const [legacyId, canonicalId] of Object.entries(ACTIVITY_ID_ALIASES)) {
    expect(publicIds.has(legacyId), `${legacyId} must not remain public`).toBe(false);
    expect(publicIds.has(canonicalId), `${canonicalId} must remain public`).toBe(true);
    expect(canonicalActivityId(legacyId)).toBe(canonicalId);
  }
  expect(canonicalActivityId('custom-catalog-id')).toBe('custom-catalog-id');
  expect(canonicalActivityId(undefined)).toBeUndefined();
});

it('keeps the intentionally distinct dessert variants clearly named', () => {
  expect(ACTIVITY_LIBRARY.find((item) => item.id === 'bte-dessert-share')?.name)
    .toBe("Bride's Dessert Toast");
  expect(ACTIVITY_LIBRARY.find((item) => item.id === 'ann-dessert-share')?.name)
    .toBe('One-Spoon Dessert');
});
```

Update the event-specific seed guard in the existing coverage test from `190` to `170`.

Add a normalization regression to `tests/store/wizardStore.test.ts`:

```ts
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
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
npm test -- --run tests/content/content.test.ts tests/store/wizardStore.test.ts
```

Expected: FAIL because `activityAliases.ts` does not exist and the public catalog still contains duplicate names.

- [ ] **Step 3: Add the standalone alias map**

Create `src/content/activityAliases.ts`:

```ts
export const ACTIVITY_ID_ALIASES: Readonly<Record<string, string>> = {
  'fam-taste-test': 'blind-snack-rank',
  'ann-blind-taste': 'blind-snack-rank',
  'fri-blind-taste': 'blind-snack-rank',
  'gen-taste-mystery': 'blind-snack-rank',
  'fam-photo-recreate': 'recreate-photo',
  'ann-photo-recreate': 'recreate-photo',
  'fri-first-coffee': 'first-up-coffee',
  'fam-timeline-build': 'family-timeline',
  'kid-thank-you-note': 'thank-you-note',
  'fam-help-cleanup': 'meal-cleanup',
  'fri-plate-wash': 'meal-cleanup',
  'gen-help-clean': 'cabin-improvement',
  'fri-cabin-fix': 'cabin-improvement',
  'fam-toast-honor': 'specific-toast',
  'gen-toast': 'specific-toast',
  'fri-toast-story': 'specific-toast',
  'kid-set-table': 'set-table',
  'fam-help-setup': 'set-table',
  'bte-card-game-win': 'board-game-win',
  'kid-card-game': 'board-game-win',
  'bch-dance-floor-stranger': 'invite-one-dance',
  'bte-dance-with-stranger': 'invite-one-dance',
  'kid-talent-show': 'talent-share',
  'fri-talent-share': 'talent-share',
  'gen-mini-talent': 'talent-share',
  'fam-interview-elder': 'family-interview',
  'bch-cornhole-champ': 'cornhole-win',
  'bte-cornhole-win': 'cornhole-win',
  'fri-cornhole-champ': 'cornhole-win',
  'gen-cornhole-score': 'cornhole-win',
  'bch-sunrise-photo': 'sunrise-view',
  'fri-sunrise-watch': 'sunrise-view',
  'bch-cold-plunge': 'cold-water-plunge',
  'fri-cold-plunge': 'cold-water-plunge',
  'sea-cold-plunge': 'cold-water-plunge',
  'bch-arm-wrestle': 'safe-arm-wrestle',
  'fri-arm-wrestle': 'safe-arm-wrestle',
  'gen-arm-wrestle': 'safe-arm-wrestle',
  'bch-karaoke-solo': 'karaoke-song',
  'bte-karaoke-verse': 'karaoke-song',
  'fri-karaoke-song': 'karaoke-song',
  'bch-group-photo-pose': 'group-photo-pose',
  'bte-group-selfie': 'group-photo-pose',
  'gen-group-photo': 'group-photo-pose',
};

export function canonicalActivityId(id: string | undefined): string | undefined {
  return id === undefined ? undefined : (ACTIVITY_ID_ALIASES[id] ?? id);
}
```

- [ ] **Step 4: Apply aliases during draft normalization**

Import `canonicalActivityId` in `src/store/wizardStore.ts` and change the activity normalization body to:

```ts
draft.activities = Array.isArray(draft.activities)
  ? draft.activities.map((activity) => {
    const catalogId = canonicalActivityId(activity.catalogId);
    return {
      ...activity,
      ...(catalogId === undefined ? {} : { catalogId }),
      uid: activity.uid ?? crypto.randomUUID(),
    };
  })
  : [];
```

- [ ] **Step 5: Consolidate public activities**

In `src/content/activities.ts`:

- Add every newly consolidated legacy ID from `ACTIVITY_ID_ALIASES` to `CONSOLIDATED_SEED_IDS`.
- Rename `board-game-win` to `Win a Card, Dice, or Board Game` and use: `Win one complete round of an agreed card, dice, or board game.`
- Add `set-table` in Helpful acts for `FAMILY`: `Set or reset the table for a group meal with the needed dishes, napkins, and utensils.`
- Add `invite-one-dance` in Social for `ADULT`: `Invite someone outside your group to join one dance, with no pressure if they decline.`
- Add `talent-share` in Social for `ALL`: `Perform one short song, dance, trick, impression, or other talent for the group.`
- Update every recommended array that references a legacy ID to its canonical ID.
- Keep recommended arrays between 12 and 16 entries and avoid duplicate canonical IDs.

In `src/content/activitySeeds.ts`, change only the two public-facing names:

```ts
{"id":"bte-dessert-share","name":"Bride's Dessert Toast","instruction":"Split a dessert with the bride and toast to her with the last bite.","points":2,"category":"food","occasion":"bachelorette","difficulty":"easy"},
{"id":"ann-dessert-share","name":"One-Spoon Dessert","instruction":"Split one dessert using only one spoon between you.","points":1,"category":"food","occasion":"anniversary","difficulty":"easy"},
```

- [ ] **Step 6: Run focused tests and verify GREEN**

Run:

```bash
npm test -- --run tests/content/content.test.ts tests/store/wizardStore.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run the full content and store regression set**

Run:

```bash
npm test -- --run tests/content tests/store
```

Expected: PASS with no unresolved recommended IDs or historical-preset changes.

- [ ] **Step 8: Commit Task 1**

```bash
git add src/content/activityAliases.ts src/content/activities.ts src/content/activitySeeds.ts src/store/wizardStore.ts tests/content/content.test.ts tests/store/wizardStore.test.ts
git commit -m "fix: consolidate duplicate activity catalog entries"
```

---

## Task 2: Active Save Identity and Semantic Dirty State

**Files:**

- Modify: `src/store/wizardStore.ts`
- Modify: `src/store/savedBoards.ts`
- Modify: `tests/store/wizardStore.test.ts`
- Modify: `tests/store/savedBoards.test.ts`

**Interfaces:**

- Produces: `activeSavedBoardName: string | null`
- Produces: `setActiveSavedBoardName(name: string | null): void`
- Changes: `replaceDraft(draft, activeSavedBoardName?: string | null): void`
- Produces: `draftFingerprint(draft: Draft): string`
- Produces: `savedBoardMatchesDraft(name: string, draft: Draft): boolean`
- Produces: `workingDraftHasChanges(draft: Draft): boolean`
- Consumes later: `BoardFileControls` uses these interfaces without duplicating comparison logic.

- [ ] **Step 1: Write failing wizard-state tests**

Add to `tests/store/wizardStore.test.ts`:

```ts
it('tracks the active named save and clears it for replacements and reset', () => {
  const replacement = structuredClone(useWizardStore.getState().draft);
  useWizardStore.getState().setActiveSavedBoardName('Weekend board');
  expect(useWizardStore.getState().activeSavedBoardName).toBe('Weekend board');

  useWizardStore.getState().replaceDraft(replacement);
  expect(useWizardStore.getState().activeSavedBoardName).toBeNull();

  useWizardStore.getState().replaceDraft(replacement, 'Loaded board');
  expect(useWizardStore.getState().activeSavedBoardName).toBe('Loaded board');

  useWizardStore.getState().reset();
  expect(useWizardStore.getState().activeSavedBoardName).toBeNull();
});

it('backfills a missing active save name as null', async () => {
  const legacy = structuredClone(useWizardStore.getState().draft);
  localStorage.setItem('game-board-v5', JSON.stringify({
    state: { draft: legacy, step: 1 },
    version: 0,
  }));
  await useWizardStore.persist.rehydrate();
  expect(useWizardStore.getState().activeSavedBoardName).toBeNull();
});
```

- [ ] **Step 2: Write failing fingerprint and storage tests**

Add imports for `draftFingerprint`, `savedBoardMatchesDraft`, and `workingDraftHasChanges` to `tests/store/savedBoards.test.ts`, then add:

```ts
it('ignores editor-only activity uids when comparing a named save', () => {
  const saved = defaultDraft();
  saved.activities = [{
    uid: 'first-uid',
    catalogId: 'blind-snack-rank',
    name: 'Rank Three Snacks Blind',
    points: 2,
    bonus: false,
  }];
  saveBoard('Weekend', saved);
  const current = structuredClone(saved);
  current.activities[0]!.uid = 'replacement-uid';

  expect(draftFingerprint(current)).toBe(draftFingerprint(saved));
  expect(savedBoardMatchesDraft('Weekend', current)).toBe(true);

  current.activities[0]!.points = 7;
  expect(savedBoardMatchesDraft('Weekend', current)).toBe(false);
});

it('detects changes in an unnamed working draft', () => {
  expect(workingDraftHasChanges(defaultDraft())).toBe(false);
  const changed = defaultDraft();
  changed.subtitle = 'Friday through Sunday';
  expect(workingDraftHasChanges(changed)).toBe(true);
});

it('does not crash when saved-board storage reads fail', () => {
  const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('Blocked', 'SecurityError');
  });
  expect(listSavedBoards()).toEqual([]);
  getItem.mockRestore();
});

it('surfaces saved-board storage write failures to the caller', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Quota exceeded', 'QuotaExceededError');
  });
  expect(() => saveBoard('Weekend', defaultDraft())).toThrow(/quota/i);
});
```

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```bash
npm test -- --run tests/store/wizardStore.test.ts tests/store/savedBoards.test.ts
```

Expected: FAIL because active-save state and comparison helpers do not exist, and `listSavedBoards` reads outside its `try` block.

- [ ] **Step 4: Implement active-save state**

Change `WizardState` and its initializer in `src/store/wizardStore.ts`:

```ts
interface WizardState {
  draft: Draft;
  step: 0 | 1 | 2;
  activeSavedBoardName: string | null;
  patch: (p: Partial<Draft>) => void;
  replaceDraft: (draft: Draft, activeSavedBoardName?: string | null) => void;
  setActiveSavedBoardName: (name: string | null) => void;
  setStep: (s: 0 | 1 | 2) => void;
  reset: () => void;
}
```

Use:

```ts
activeSavedBoardName: null,
replaceDraft: (draft, activeSavedBoardName = null) => set({
  draft: normalizeDraft(draft),
  activeSavedBoardName,
}),
setActiveSavedBoardName: (activeSavedBoardName) => set({ activeSavedBoardName }),
reset: () => set({ draft: defaultDraft(), step: 0, activeSavedBoardName: null }),
```

In the persistence merge, set:

```ts
activeSavedBoardName: typeof p?.activeSavedBoardName === 'string'
  ? p.activeSavedBoardName
  : null,
```

- [ ] **Step 5: Implement semantic fingerprints and safe reads**

In `src/store/savedBoards.ts`, move `localStorage.getItem` inside the existing `try`.

Add:

```ts
function comparableDraft(draft: Draft) {
  const normalized = normalizeDraft(draft);
  return {
    ...normalized,
    activities: normalized.activities.map(({ uid: _uid, ...activity }) => activity),
  };
}

export function draftFingerprint(draft: Draft): string {
  return JSON.stringify(comparableDraft(draft));
}

export function savedBoardMatchesDraft(name: string, draft: Draft): boolean {
  const saved = loadSavedBoard(name);
  return saved !== undefined && draftFingerprint(saved) === draftFingerprint(draft);
}

export function workingDraftHasChanges(draft: Draft): boolean {
  return draftFingerprint(draft) !== draftFingerprint(defaultDraft());
}
```

Import `defaultDraft` beside the existing `Draft` type.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run:

```bash
npm test -- --run tests/store/wizardStore.test.ts tests/store/savedBoards.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 2**

```bash
git add src/store/wizardStore.ts src/store/savedBoards.ts tests/store/wizardStore.test.ts tests/store/savedBoards.test.ts
git commit -m "feat: track active named board saves"
```

---

## Task 3: Persistent Header Save and Boards Controls

**Files:**

- Create: `src/app/BoardFileDialog.tsx`
- Create: `src/app/BoardFileControls.tsx`
- Create: `tests/app/boardFiles.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/steps/SetupStep.tsx`
- Modify: `src/index.css`
- Modify: `tests/app/appSmoke.test.tsx`
- Modify: `tests/app/steps.test.tsx`

**Interfaces:**

- `BoardFileControls(): JSX.Element` consumes wizard state and saved-board APIs.
- `BoardFileDialog` receives snapshots, active name, initial focus mode, error, and `onClose`, `onOpen`, and `onSaveAs` callbacks.
- Existing wizard steps remain unaware of named-save storage.

- [ ] **Step 1: Write failing document-control tests**

Create `tests/app/boardFiles.test.tsx` with jsdom, cleanup, local-storage reset, and these behaviors:

```tsx
it('saves an unnamed board from the header and then updates it in one click', async () => {
  render(<App metrics={testMetrics()} buffers={null} />);
  await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
  expect(screen.getByRole('dialog', { name: /saved boards/i })).toBeDefined();

  const name = screen.getByLabelText(/save name/i);
  await userEvent.clear(name);
  await userEvent.type(name, 'Camp SheiShei');
  await userEvent.click(screen.getByRole('button', { name: /^save as$/i }));

  expect(useWizardStore.getState().activeSavedBoardName).toBe('Camp SheiShei');
  expect(screen.getByText(/^saved$/i)).toBeDefined();

  useWizardStore.getState().patch({ subtitle: 'Updated weekend' });
  expect(await screen.findByText(/unsaved changes/i)).toBeDefined();
  await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
  expect(loadSavedBoard('Camp SheiShei')?.subtitle).toBe('Updated weekend');
});

it('opens a named board from Activities without returning to Setup', async () => {
  const saved = defaultDraft();
  saved.title = 'Loaded title';
  saveBoard('Loaded board', saved);
  useWizardStore.getState().setStep(1);
  render(<App metrics={testMetrics()} buffers={null} />);

  await userEvent.click(screen.getByRole('button', { name: /^boards$/i }));
  await userEvent.click(screen.getByRole('button', { name: /open loaded board/i }));

  expect(useWizardStore.getState().step).toBe(1);
  expect(useWizardStore.getState().draft.title).toBe('Loaded title');
  expect(useWizardStore.getState().activeSavedBoardName).toBe('Loaded board');
});

it('requires confirmation before replacing unsaved changes', async () => {
  saveBoard('Other board', defaultDraft());
  useWizardStore.getState().patch({ subtitle: 'Unsaved work' });
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  render(<App metrics={testMetrics()} buffers={null} />);

  await userEvent.click(screen.getByRole('button', { name: /^boards$/i }));
  await userEvent.click(screen.getByRole('button', { name: /open other board/i }));

  expect(confirm).toHaveBeenCalledWith('Open this saved board? Unsaved changes will be replaced.');
  expect(useWizardStore.getState().draft.subtitle).toBe('Unsaved work');
});

it('uses Cmd+S and Ctrl+S without the browser save action', async () => {
  saveBoard('Shortcut board', defaultDraft());
  useWizardStore.getState().replaceDraft(defaultDraft(), 'Shortcut board');
  useWizardStore.getState().patch({ title: 'Shortcut update' });
  render(<App metrics={testMetrics()} buffers={null} />);

  const macSave = new KeyboardEvent('keydown', { key: 's', metaKey: true, cancelable: true });
  window.dispatchEvent(macSave);
  expect(macSave.defaultPrevented).toBe(true);
  expect(loadSavedBoard('Shortcut board')?.title).toBe('Shortcut update');
});

it('reports a storage failure without claiming the board was saved', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Quota exceeded', 'QuotaExceededError');
  });
  render(<App metrics={testMetrics()} buffers={null} />);
  await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
  const name = screen.getByLabelText(/save name/i);
  await userEvent.clear(name);
  await userEvent.type(name, 'Broken save');
  await userEvent.click(screen.getByRole('button', { name: /^save as$/i }));
  expect(screen.getByRole('alert')).toHaveTextContent(/could not save/i);
  expect(useWizardStore.getState().activeSavedBoardName).toBeNull();
});
```

Add test setup imports exactly as used in existing app tests:

```ts
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App';
import { testMetrics } from '../helpers/loadFonts';
import { defaultDraft } from '../../src/store/toBoardSpec';
import { loadSavedBoard, saveBoard, SAVED_BOARDS_KEY } from '../../src/store/savedBoards';
import { useWizardStore } from '../../src/store/wizardStore';
```

- [ ] **Step 2: Update existing tests for the intended move**

In `tests/app/steps.test.tsx`, remove the three Setup-only named-save tests and replace the old location assertion with:

```tsx
it('keeps preset loading in Setup without duplicating document controls', () => {
  render(<SetupStep />);
  expect(screen.getByRole('button', { name: /load preset/i })).toBeDefined();
  expect(screen.queryByRole('button', { name: /^save$/i })).toBeNull();
  expect(screen.queryByRole('button', { name: /^boards$/i })).toBeNull();
  expect(screen.queryByLabelText(/^saved board$/i)).toBeNull();
});
```

In `tests/app/appSmoke.test.tsx`, extend Start over to set an active name and assert it becomes `null`.

- [ ] **Step 3: Run focused app tests and verify RED**

Run:

```bash
npm test -- --run tests/app/boardFiles.test.tsx tests/app/appSmoke.test.tsx tests/app/steps.test.tsx
```

Expected: FAIL because header document controls do not exist and Setup still owns save/load.

- [ ] **Step 4: Build the accessible dialog**

Create `src/app/BoardFileDialog.tsx` with:

```ts
export interface BoardFileDialogProps {
  snapshots: SavedBoardSnapshot[];
  activeName: string | null;
  suggestedName: string;
  initialFocus: 'browse' | 'save';
  error: string;
  onClose: () => void;
  onOpen: (name: string) => void;
  onSaveAs: (name: string) => boolean;
}
```

Implementation requirements:

- Render a labelled `<dialog aria-modal="true">`.
- Call `showModal()` when available, with an `open`-attribute fallback for jsdom.
- Focus the save-name input for `initialFocus === 'save'`; otherwise focus the close button.
- Close on Escape through `onCancel`.
- Render newest-first snapshots with `<button aria-label={`Open ${snapshot.name}`}>Open</button>`.
- Format timestamps with `Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })`.
- Render a Save as form whose controlled value initializes from `activeName` or the current board title passed as a separate `suggestedName` prop.
- Keep the dialog open when `onSaveAs` returns `false`.
- Render errors with `role="alert"`.

- [ ] **Step 5: Build header orchestration and keyboard saving**

Create `src/app/BoardFileControls.tsx`.

Use:

```ts
type DialogFocus = 'browse' | 'save';

const isActiveSaved = activeSavedBoardName !== null
  && savedBoardMatchesDraft(activeSavedBoardName, draft);
const status = activeSavedBoardName === null
  ? 'Not saved yet'
  : isActiveSaved ? 'Saved' : 'Unsaved changes';
```

Required handlers:

- `saveActive`: Save immediately when an active snapshot still exists; otherwise open Save as.
- `saveAs`: Trim to 80 characters, confirm a same-name overwrite unless it is the active name, call `saveBoard`, set the active name, refresh snapshots, announce success, and return `true`. Catch storage exceptions, set `Could not save this board in your browser. Your current work is still here.`, and return `false`.
- `openBoard`: Use the exact discard boundary below. Load the named draft, call `replaceDraft(savedDraft, name)`, preserve the current step, close the dialog, and announce success.
- `keydown`: For lowercase `s` with `metaKey` or `ctrlKey`, prevent default and call `saveActive`.
- Restore focus to the Save or Boards opener when the dialog closes.

```ts
const currentHasUnsavedChanges = activeSavedBoardName !== null
  ? !savedBoardMatchesDraft(activeSavedBoardName, draft)
  : workingDraftHasChanges(draft);

if (
  currentHasUnsavedChanges
  && !window.confirm('Open this saved board? Unsaved changes will be replaced.')
) {
  return;
}
```

Render:

```tsx
<div className="board-file-controls">
  <div className="board-file-status" aria-live="polite">
    <strong>{activeSavedBoardName ?? 'Current board'}</strong>
    <span>{status}</span>
  </div>
  <button className="primary board-save-button" onClick={saveActive}>Save</button>
  <button className="secondary board-browse-button" onClick={() => openDialog('browse')}>Boards</button>
  <span className="sr-only" aria-live="polite">{announcement}</span>
</div>
```

- [ ] **Step 6: Integrate the header and remove Setup-only controls**

In `src/app/App.tsx`:

- Import and render `BoardFileControls`.
- Wrap it and Start over in `<div className="header-actions">`.
- Keep the existing Start over confirmation and let store `reset` clear active identity.

In `src/app/steps/SetupStep.tsx`:

- Remove saved-board imports and local state.
- Remove `saveCurrentBoard` and `loadNamedBoard`.
- Remove the `board-saves-section`.
- Call `replaceDraft(preset.createDraft())`, relying on the new default argument to clear active identity.

- [ ] **Step 7: Add responsive document-control and dialog styles**

In `src/index.css`:

- Change the header third column to `minmax(270px, 1fr)`.
- Add `.header-actions`, `.board-file-controls`, `.board-file-status`, `.board-save-button`, and `.board-browse-button`.
- Add a fixed `.board-file-backdrop` with a high z-index and centered dialog.
- Style `.board-file-dialog`, `.board-file-dialog-heading`, `.saved-board-list`, `.saved-board-row`, `.save-as-form`, `.dialog-actions`, and error copy.
- At `max-width: 1180px`, hide `.board-file-status strong` but retain status.
- At `max-width: 980px`, place header actions at the right of the first row and wizard progress across the second row.
- At `max-width: 680px`, keep Save and Boards visible, hide `.board-file-status`, shorten Start over styling, and make saved-board rows stack.
- Remove `.board-saves-section`, `.board-save-grid`, `.board-save-control`, and `.board-save-action` rules.

- [ ] **Step 8: Run focused tests and verify GREEN**

Run:

```bash
npm test -- --run tests/app/boardFiles.test.tsx tests/app/appSmoke.test.tsx tests/app/steps.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit Task 3**

```bash
git add src/app/BoardFileDialog.tsx src/app/BoardFileControls.tsx src/app/App.tsx src/app/steps/SetupStep.tsx src/index.css tests/app/boardFiles.test.tsx tests/app/appSmoke.test.tsx tests/app/steps.test.tsx
git commit -m "feat: add persistent named board controls"
```

---

## Task 4: Expandable Activity Instructions

**Files:**

- Create: `src/app/ActivityPickerRow.tsx`
- Modify: `src/app/steps/ActivitiesStep.tsx`
- Modify: `src/index.css`
- Modify: `tests/app/steps.test.tsx`

**Interfaces:**

- Produces:

```ts
interface ActivityPickerRowProps {
  item: PresetActivity;
  checked: boolean;
  disabled: boolean;
  relevance: number;
  onToggle: () => void;
}
```

- `ActivitiesStep` continues to own selection state and passes only one item's behavior to the row.

- [ ] **Step 1: Write failing expansion tests**

Add to the `ActivitiesStep` describe block in `tests/app/steps.test.tsx`:

```tsx
it('expands a full activity description without selecting the activity', async () => {
  useWizardStore.getState().patch({ activities: [], libraryOccasion: 'general' });
  render(<ActivitiesStep />);

  const details = screen.getByRole('button', {
    name: /show full description for give a specific toast/i,
  });
  expect(details).toHaveAttribute('aria-expanded', 'false');

  await userEvent.click(details);

  expect(details).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByText(/names one true, specific thing/i)).toBeVisible();
  expect(useWizardStore.getState().draft.activities).toEqual([]);
});

it('keeps details and activity selection as independent keyboard actions', async () => {
  useWizardStore.getState().patch({ activities: [], libraryOccasion: 'general' });
  render(<ActivitiesStep />);

  const details = screen.getByRole('button', {
    name: /show full description for give a specific toast/i,
  });
  details.focus();
  await userEvent.keyboard('{Enter}');
  expect(details).toHaveAttribute('aria-expanded', 'true');
  expect(useWizardStore.getState().draft.activities).toEqual([]);

  await userEvent.click(screen.getByRole('checkbox', { name: /add give a specific toast/i }));
  expect(useWizardStore.getState().draft.activities[0]?.catalogId).toBe('specific-toast');
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- --run tests/app/steps.test.tsx
```

Expected: FAIL because no Details buttons exist.

- [ ] **Step 3: Implement `ActivityPickerRow`**

Create `src/app/ActivityPickerRow.tsx`:

```tsx
import { useId, useState } from 'react';
import type { PresetActivity } from '../content/activities';
import { pointsLabel } from '../models/boardSpec';

export interface ActivityPickerRowProps {
  item: PresetActivity;
  checked: boolean;
  disabled: boolean;
  relevance: number;
  onToggle: () => void;
}

export function ActivityPickerRow({
  item, checked, disabled, relevance, onToggle,
}: ActivityPickerRowProps) {
  const [expanded, setExpanded] = useState(false);
  const checkboxId = useId();
  const descriptionId = useId();
  const pointUnit = typeof item.points === 'number' && item.points === 1 ? 'pt' : 'pts';

  return (
    <div
      className={`${checked ? 'activity-row selected' : 'activity-row'}${expanded ? ' expanded' : ''}`}
      data-activity-id={item.id}
    >
      <input
        id={checkboxId}
        type="checkbox"
        aria-label={`${checked ? 'Remove' : 'Add'} ${item.name}`}
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
      />
      <label className="activity-row-copy" htmlFor={checkboxId}>
        <strong>{item.name}</strong>
        <span id={descriptionId}>{item.instruction}</span>
      </label>
      <span className="activity-row-points">{pointsLabel(item.points)} {pointUnit}</span>
      <span className={`activity-row-level relevance-${relevance}`}>
        {relevance === 0 ? 'Top match' : item.difficulty}
      </span>
      <button
        type="button"
        className="activity-row-details"
        aria-expanded={expanded}
        aria-controls={descriptionId}
        aria-label={`${expanded ? 'Hide full description for' : 'Show full description for'} ${item.name}`}
        onClick={() => setExpanded((value) => !value)}
      >
        {expanded ? 'Less' : 'Details'}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Use the focused row component**

In `src/app/steps/ActivitiesStep.tsx`:

- Import `ActivityPickerRow`.
- Replace only the `visible.map` catalog `<label className="activity-row">` block with:

```tsx
<ActivityPickerRow
  key={item.id}
  item={item}
  checked={checked}
  disabled={!checked && draft.activities.length >= 80}
  relevance={relevance}
  onToggle={() => toggle(item)}
/>
```

- Leave custom rows and hidden selected rows unchanged.

- [ ] **Step 5: Style collapsed and expanded descriptions**

In `src/index.css`:

- Change `.activity-row` desktop columns to `20px minmax(0, 1fr) 42px auto auto`.
- Style `.activity-row-details` as a compact text button with a minimum 32-pixel target.
- Keep `.activity-row-copy > span` single-line and truncated when collapsed.
- For `.activity-row.expanded`, use `align-items: start`.
- For `.activity-row.expanded .activity-row-copy > span`, allow normal whitespace, visible overflow, and no text ellipsis.
- At `max-width: 680px`, use `20px minmax(0, 1fr) 44px auto`; hide `.activity-row-level`; keep Details in the last column.
- Ensure existing custom and hidden rows without a Details button still align by assigning their `.activity-row-level` to the final available column.

- [ ] **Step 6: Run the focused tests and verify GREEN**

Run:

```bash
npm test -- --run tests/app/steps.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit Task 4**

```bash
git add src/app/ActivityPickerRow.tsx src/app/steps/ActivitiesStep.tsx src/index.css tests/app/steps.test.tsx
git commit -m "feat: expand activity descriptions in picker"
```

---

## Task 5: Integration Verification, Review, and Release Preparation

**Files:**

- Modify if required by review: files from Tasks 1 through 4
- Modify: `HANDOFF.md`

**Interfaces:**

- No new product interfaces. This task validates the approved specification end to end.

- [ ] **Step 1: Run the complete automated test suite**

Run:

```bash
npm test -- --run
```

Expected: every test passes with 0 failures.

- [ ] **Step 2: Run type checking**

Run:

```bash
npx tsc --noEmit
```

Expected: exit code 0 with no diagnostics.

- [ ] **Step 3: Run the production build**

Run:

```bash
npm run build
```

Expected: exit code 0. The existing Vite chunk-size warning may remain.

- [ ] **Step 4: Run repository hygiene checks**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors. Status contains only intentional feature files or is clean after task commits.

- [ ] **Step 5: Inspect desktop and mobile behavior**

Run the local app and verify:

- Save, Boards, status, and Start over fit in the sticky header at desktop width.
- Save and Boards remain visible at 390-pixel width.
- An unnamed board opens Save as.
- A loaded named board saves from Activities and Design.
- Unsaved changes switches back to Saved after Save.
- Boards preserves the current wizard step when opening a board.
- Dialog initial focus, Escape close, and focus return work.
- A long activity instruction expands without selecting the activity.
- Collapsing restores the compact row.

- [ ] **Step 6: Request independent Claude review**

From the worktree root, run:

```bash
~/.local/bin/claude-review "Review the implementation against docs/superpowers/specs/2026-07-24-persistent-board-files-and-library-cleanup-design.md. Focus on data loss, dirty-state correctness, localStorage failure behavior, keyboard and dialog accessibility, responsive header layout, activity alias migration, and accidental over-deduplication. Read-only review only."
```

Expected: a skeptical review separating confirmed defects from optional enhancements.

- [ ] **Step 7: Fix every confirmed Critical or Important finding with TDD**

For each valid finding:

- Add or adjust a test that fails for the reported defect.
- Run the focused test and confirm the expected failure.
- Make the smallest production change.
- Run the focused test and confirm it passes.
- Re-run the complete verification gate.

- [ ] **Step 8: Update the cross-tool handoff**

Replace `HANDOFF.md` with a concise current release record using the required headings:

```md
# Handoff
- Original goal:
- Current phase:
- Done:
- Pending:
- Changed files:
- Verify command (how to confirm it works):
- Current risks / known issues:
- Do not repeat (dead ends already tried):
- Suggested next step:
- Last tool + date:
```

Record exact test counts, source commits, review result, and deployment status. Keep it below 800 words.

- [ ] **Step 9: Commit review fixes and handoff**

```bash
git add HANDOFF.md \
  src/content/activityAliases.ts \
  src/content/activities.ts \
  src/content/activitySeeds.ts \
  src/store/wizardStore.ts \
  src/store/savedBoards.ts \
  src/app/BoardFileDialog.tsx \
  src/app/BoardFileControls.tsx \
  src/app/ActivityPickerRow.tsx \
  src/app/App.tsx \
  src/app/steps/SetupStep.tsx \
  src/app/steps/ActivitiesStep.tsx \
  src/index.css \
  tests/content/content.test.ts \
  tests/store/wizardStore.test.ts \
  tests/store/savedBoards.test.ts \
  tests/app/boardFiles.test.tsx \
  tests/app/appSmoke.test.tsx \
  tests/app/steps.test.tsx
git diff --cached --check
git commit -m "docs: record persistent board controls release"
```

If no review fix exists, the commit must still contain the meaningful updated handoff. Do not create an empty marker commit.

- [ ] **Step 10: Finish the development branch**

Use `superpowers:finishing-a-development-branch`.

Because the user has already requested implementation and push, recommend merging the verified feature branch into local `main`, re-running the full test suite on the merged result, then pushing source `main`. Do not discard or force-push.

- [ ] **Step 11: Deploy only when the site repository is safe**

Confirm the other `jessemaddox.com` session is no longer writing overlapping gameboard deployment files. Then:

- Create an isolated site worktree from the current remote main.
- Copy the exact verified source artifact through the existing gameboard deployment process.
- Save a real deployment commit and push site main without overwriting unrelated work.
- Verify `https://jessemaddox.com/gameboard` returns HTTP 200 and contains the new Save, Boards, Details, and saved-status markers.
- Update `HANDOFF.md` with the live site commit only if the source repository is still the active handoff writer.
