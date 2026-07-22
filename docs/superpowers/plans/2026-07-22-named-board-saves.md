# Named Board Saves Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **TL;DR:** Add durable, named local board snapshots under a stable storage key, then expose save and load controls in Setup without changing the disposable live-draft key.

**Goal:** Let Jesse name, overwrite, list, and load board configurations without app releases orphaning those snapshots.

**Architecture:** Keep the existing Zustand persistence entry as the current working draft. Add a small storage module for named snapshots under `game-board-saves-v1`, and route every restored draft through one exported normalization function shared with Zustand hydration. Setup owns the user interaction and refreshes its saved-name list after a successful save.

**Tech Stack:** React 19, TypeScript, Zustand 5, browser localStorage, Vitest, Testing Library.

## Global Constraints

- Never store named snapshots inside `game-board-v5`.
- Snapshot records contain `name`, `savedAt`, `schemaVersion`, and `draft`.
- Loading a snapshot replaces the whole current draft only after the same confirmation semantics used by preset loading.
- Older snapshots must receive default-field and activity-UID backfills plus the landscape template size rule.
- Cross-device synchronization and saved-board deletion are out of scope.
- Preserve the current live-draft behavior and all existing occasion presets.

---

### Task 1: Shared draft normalization and named-save storage

**Files:**
- Create: `src/store/savedBoards.ts`
- Modify: `src/store/wizardStore.ts`
- Test: `tests/store/savedBoards.test.ts`
- Test: `tests/store/wizardStore.test.ts`

**Interfaces:**
- Produces: `normalizeDraft(input: Partial<Draft>): Draft` from `wizardStore.ts`.
- Produces: `SAVED_BOARDS_KEY`, `SavedBoardSnapshot`, `listSavedBoards()`, `saveBoard(name, draft)`, and `loadSavedBoard(name)` from `savedBoards.ts`.
- `saveBoard` returns the stored snapshot. `loadSavedBoard` returns a normalized `Draft | undefined`.

- [ ] **Step 1: Write failing storage and normalization tests**

Cover these observable behaviors with real localStorage: the key is exactly `game-board-saves-v1`; saving does not alter `game-board-v5`; list is newest-first; a same-name save overwrites rather than duplicates; a legacy draft missing fields and activity UIDs is normalized on load; malformed saved JSON is tolerated as an empty list; and a saved landscape-brackets draft loads at `60x48`.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- tests/store/savedBoards.test.ts tests/store/wizardStore.test.ts`

Expected: failure because the named-save module and shared normalization API do not exist.

- [ ] **Step 3: Implement the minimal storage boundary**

Move the current hydration backfill into an exported pure `normalizeDraft` function. The function begins with `defaultDraft()`, shallowly overlays the persisted fields, maps activities to backfill missing `uid` values with `crypto.randomUUID()`, and applies `enforceTemplateSize`. Use it from Zustand `merge`, `replaceDraft`, and snapshot loading. Parse the stable saved-board array defensively, discard structurally unusable entries, and write the entire updated array atomically.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- tests/store/savedBoards.test.ts tests/store/wizardStore.test.ts`

Expected: all focused tests pass.

### Task 2: Setup save and load workflow

**Files:**
- Modify: `src/app/steps/SetupStep.tsx`
- Modify: `src/index.css`
- Test: `tests/app/steps.test.tsx`

**Interfaces:**
- Consumes: `listSavedBoards`, `saveBoard`, and `loadSavedBoard` from `src/store/savedBoards.ts`.
- Consumes: `replaceDraft` from the wizard store.

- [ ] **Step 1: Write failing UI tests**

Test the full user flow: enter a save name and save the current draft; the name appears in the saved-board dropdown; saving the same name asks for overwrite confirmation and preserves the old snapshot when declined; loading asks before replacing a customized draft; declining keeps the draft; accepting restores the saved roster, activities, and design. Confirm the existing occasion preset still loads.

- [ ] **Step 2: Run the focused UI tests and verify RED**

Run: `npm test -- tests/app/steps.test.tsx`

Expected: failure because named save and load controls are absent.

- [ ] **Step 3: Implement the minimal Setup controls**

Keep occasion presets available, but label them as presets rather than saved boards. Add a `Board name` text input and `Save board` button, plus a saved-name select and `Load saved board` button. Trim names, disable actions with no usable name or selected snapshot, call `window.confirm` before same-name overwrite, and call `window.confirm('Load this saved board? It replaces your current board.')` whenever the current draft differs from the selected snapshot. Refresh the list after saving and clear transient roster editing state after loading.

- [ ] **Step 4: Add only the layout styles needed for the new controls**

Reuse existing design tokens, fields, button classes, and responsive panel behavior. Do not introduce new colors or unrelated visual changes.

- [ ] **Step 5: Run focused UI tests and verify GREEN**

Run: `npm test -- tests/app/steps.test.tsx`

Expected: all Setup tests pass.

### Task 3: Release verification and repository save

**Files:**
- Modify only if required by verification: files already listed above.

- [ ] **Step 1: Run the complete project gate**

Run: `npm test && npx tsc --noEmit && npm run build`

Expected: all tests pass, TypeScript exits 0, and Vite build exits 0.

- [ ] **Step 2: Review the diff against the handoff**

Confirm the stable key is separate, the live key remains `game-board-v5`, loading normalizes old drafts, overwrite and replace confirmations are covered, and no cross-device or deletion scope slipped in.

- [ ] **Step 3: Commit and push the coherent feature**

Stage only the plan, storage, UI, CSS, and tests. Commit with `feat: add named board saves`, then push `main` to `origin`.
