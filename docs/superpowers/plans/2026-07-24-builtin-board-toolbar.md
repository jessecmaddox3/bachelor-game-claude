# Built-In Bachelor Board and Board Toolbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the complete 2017 bachelor board a protected built-in choice named **Jesse Maddox Bachelor 2017**, and move all board-level actions into a prominent responsive toolbar above the workspace.

**Architecture:** Keep the occasion catalog as the source of truth for built-in board metadata and draft creation. Extend the existing file-controls dialog boundary to open catalog templates as unsaved editable copies, then move the existing file controls and Start over button into a full-width first row of the builder grid.

**Tech Stack:** React 19, TypeScript, Zustand, CSS, Vitest, Testing Library, Vite

## Global Constraints

- The exact built-in and occasion name is **Jesse Maddox Bachelor 2017**.
- Do not change the historical board's roster, activities, scoring, design, or rules.
- Opening a built-in board creates a fresh editable copy and never creates or overwrites a named browser save.
- Preserve the current wizard step when opening the built-in board.
- Preserve named saves, automatic recovery, unsaved-change confirmation, focus restoration, and `Cmd+S` or `Ctrl+S`.
- Keep the toolbar above the editor and preview in both visual and document order.
- Do not add dependencies.
- Do not use em dashes in product copy or documentation.

---

### Task 1: Protected built-in bachelor board

**Files:**
- Modify: `src/content/occasions/jesse2017.ts`
- Modify: `src/app/BoardFileDialog.tsx`
- Modify: `src/app/BoardFileControls.tsx`
- Modify: `src/index.css`
- Test: `tests/content/content.test.ts`
- Test: `tests/app/boardFiles.test.tsx`

**Interfaces:**
- Consumes: `OCCASION_PACKS: OccasionPack[]`, `occasionById(id: string): OccasionPack | undefined`, and `replaceDraft(draft: Draft, activeSavedBoardName?: string | null): void`
- Produces: `BuiltInBoardOption { id: string; name: string; description: string }`, `BoardFileDialogProps.builtInBoards`, and `BoardFileDialogProps.onOpenBuiltIn(id: string): void`

- [ ] **Step 1: Write the failing catalog-name test**

Update the historical occasion assertion in `tests/content/content.test.ts`:

```ts
it('labels the historical preset as Jesse Maddox Bachelor 2017', () => {
  expect(OCCASION_PACKS.find((pack) => pack.id === 'jesse-bachelor-2017')?.name)
    .toBe('Jesse Maddox Bachelor 2017');
});
```

- [ ] **Step 2: Write failing built-in opening tests**

Add these imports and tests to `tests/app/boardFiles.test.tsx`:

```ts
import { createJesse2017Draft } from '../../src/content/occasions';

it('opens the historical bachelor board as an unsaved built-in copy', async () => {
  const historical = createJesse2017Draft();
  useWizardStore.getState().setStep(2);
  render(<App metrics={testMetrics()} buffers={null} />);

  await userEvent.click(screen.getByRole('button', { name: /^boards$/i }));
  await userEvent.click(screen.getByRole('button', {
    name: /open jesse maddox bachelor 2017/i,
  }));

  const state = useWizardStore.getState();
  expect(state.step).toBe(2);
  expect(state.activeSavedBoardName).toBeNull();
  expect(state.draft.title).toBe(historical.title);
  expect(state.draft.honoree).toBe(historical.honoree);
  expect(state.draft.players).toEqual(historical.players);
  expect(state.draft.activities).toHaveLength(historical.activities.length);
});

it('keeps unsaved work when built-in replacement is canceled', async () => {
  useWizardStore.getState().patch({ subtitle: 'Keep this work' });
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  render(<App metrics={testMetrics()} buffers={null} />);

  await userEvent.click(screen.getByRole('button', { name: /^boards$/i }));
  await userEvent.click(screen.getByRole('button', {
    name: /open jesse maddox bachelor 2017/i,
  }));

  expect(confirm).toHaveBeenCalledWith(
    'Open this built-in board? Unsaved changes will be replaced.',
  );
  expect(useWizardStore.getState().draft.subtitle).toBe('Keep this work');
  expect(screen.getByRole('dialog', { name: /saved boards/i })).toBeDefined();
});
```

- [ ] **Step 3: Run the focused tests to verify they fail**

Run:

```bash
npm test -- --run tests/content/content.test.ts tests/app/boardFiles.test.tsx
```

Expected: FAIL because the catalog still uses the previous name and the dialog has no built-in board entry.

- [ ] **Step 4: Rename the catalog entry**

In `src/content/occasions/jesse2017.ts`, change only the occasion metadata:

```ts
export const JESSE_2017_OCCASION: OccasionPack = {
  id: 'jesse-bachelor-2017',
  name: 'Jesse Maddox Bachelor 2017',
  description: 'The complete 2017 roster, scoring activities, results boxes, target, and agreement.',
  createDraft: createJesse2017Draft,
};
```

- [ ] **Step 5: Add built-in board props and dialog rendering**

In `src/app/BoardFileDialog.tsx`, export the display interface and extend the props:

```ts
export interface BuiltInBoardOption {
  id: string;
  name: string;
  description: string;
}

interface BoardFileDialogProps {
  builtInBoards: BuiltInBoardOption[];
  snapshots: SavedBoardSnapshot[];
  activeName: string | null;
  suggestedName: string;
  initialFocus: 'browse' | 'save';
  error: string;
  onClose: () => void;
  onOpenBuiltIn: (id: string) => void;
  onOpen: (name: string) => void;
  onSaveAs: (name: string) => boolean;
}
```

Render a distinct section before the named-board list. Use `data-board-open` on built-in Open buttons so browse focus lands on the first available board:

```tsx
<section className="board-library-section" aria-labelledby="built-in-boards-heading">
  <div className="board-library-heading">
    <h3 id="built-in-boards-heading">Built-in boards</h3>
    <span>Ready to customize</span>
  </div>
  <div className="saved-board-list built-in-board-list">
    {builtInBoards.map((board) => (
      <div className="saved-board-row built-in" key={board.id}>
        <div className="saved-board-copy">
          <strong>{board.name}</strong>
          <span>{board.description}</span>
        </div>
        <button
          className="secondary"
          type="button"
          data-board-open
          aria-label={`Open ${board.name}`}
          onClick={() => onOpenBuiltIn(board.id)}
        >
          Open
        </button>
      </div>
    ))}
  </div>
</section>
```

Add a **Saved in this browser** heading immediately before the existing browser-save list. Keep the existing empty-state copy and Save as form unchanged.

- [ ] **Step 6: Connect catalog templates to file controls**

In `src/app/BoardFileControls.tsx`, import `OCCASION_PACKS` and `occasionById`, then derive display metadata without duplicating the catalog:

```ts
const builtInBoards = OCCASION_PACKS.map(({ id, name, description }) => ({
  id,
  name,
  description,
}));
```

Add a shared unsaved-state calculation:

```ts
const hasUnsavedChanges = useCallback(() => (
  activeSavedBoardName === null
    ? workingDraftHasChanges(draft)
    : !savedBoardMatchesDraft(activeSavedBoardName, draft)
), [activeSavedBoardName, draft]);
```

Use it in the existing named-board open flow and add:

```ts
const openBuiltInBoard = useCallback((id: string) => {
  if (
    hasUnsavedChanges()
    && !window.confirm('Open this built-in board? Unsaved changes will be replaced.')
  ) return;

  const occasion = occasionById(id);
  if (!occasion) {
    setError('That built-in board is no longer available.');
    return;
  }

  replaceDraft(occasion.createDraft(), null);
  setAnnouncement(`Opened ${occasion.name}.`);
  setDialogFocus(null);
  setError('');
}, [hasUnsavedChanges, replaceDraft]);
```

Pass `builtInBoards={builtInBoards}` and `onOpenBuiltIn={openBuiltInBoard}` to `BoardFileDialog`.

- [ ] **Step 7: Style the library sections**

Add focused styles to `src/index.css`:

```css
.board-library-section { margin-top: 16px; }
.board-library-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.board-library-heading h3 { margin: 0; color: var(--c-navy-deep); font-size: 12px; }
.board-library-heading span { color: var(--c-muted); font-size: 10px; }
.built-in-board-list { max-height: none; margin: 0; }
.saved-board-row.built-in { background: var(--c-wash); border-color: color-mix(in srgb, var(--c-primary) 42%, var(--c-border)); }
```

Adjust the existing `.saved-board-list` margins so the two labeled lists have consistent spacing without nested excess.

- [ ] **Step 8: Run focused tests and commit**

Run:

```bash
npm test -- --run tests/content/content.test.ts tests/app/boardFiles.test.tsx
git diff --check
```

Expected: all focused tests PASS and no whitespace errors.

Commit:

```bash
git add src/content/occasions/jesse2017.ts src/app/BoardFileDialog.tsx src/app/BoardFileControls.tsx src/index.css tests/content/content.test.ts tests/app/boardFiles.test.tsx
git commit -m "feat: add built-in bachelor board"
```

---

### Task 2: Prominent responsive board toolbar

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/index.css`
- Test: `tests/app/boardFiles.test.tsx`

**Interfaces:**
- Consumes: `BoardFileControls(): JSX.Element` and `useWizardStore().reset(): void`
- Produces: `.board-document-bar` as the full-width first child of `.builder-layout`

- [ ] **Step 1: Write the failing toolbar-location test**

Add to `tests/app/boardFiles.test.tsx`:

```ts
it('places board actions in a document toolbar above the workspace', () => {
  const { container } = render(<App metrics={testMetrics()} buffers={null} />);
  const header = container.querySelector('.app-header');
  const layout = container.querySelector('.builder-layout');
  const toolbar = container.querySelector('.board-document-bar');
  const panel = container.querySelector('.panel');
  const preview = container.querySelector('.preview-pane');
  const save = screen.getByRole('button', { name: /^save board/i });
  const boards = screen.getByRole('button', { name: /^boards$/i });
  const startOver = screen.getByRole('button', { name: /^start over$/i });

  expect(toolbar).not.toBeNull();
  expect(header).not.toContainElement(save);
  expect(toolbar).toContainElement(save);
  expect(toolbar).toContainElement(boards);
  expect(toolbar).toContainElement(startOver);
  expect(layout?.firstElementChild).toBe(toolbar);
  expect(toolbar?.nextElementSibling).toBe(panel);
  expect(panel?.nextElementSibling).toBe(preview);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- --run tests/app/boardFiles.test.tsx -t "places board actions"
```

Expected: FAIL because controls and Start over still live in `.app-header` and `.board-document-bar` does not exist.

- [ ] **Step 3: Move the board actions in App**

In `src/app/App.tsx`, remove `.header-actions` from the header. Add the toolbar as the first child of `main`:

```tsx
<section className="board-document-bar" aria-label="Board controls">
  <div className="board-document-heading">
    <span className="eyebrow">Board</span>
    <strong>Save your progress</strong>
  </div>
  <BoardFileControls />
  <button
    className="ghost board-reset-button"
    onClick={() => window.confirm('Start over? This clears the current board.') && reset()}
  >
    Start over
  </button>
</section>
```

Keep the existing header brand and wizard progress unchanged.

- [ ] **Step 4: Implement the toolbar layout**

Replace header-specific file-control styles in `src/index.css` with:

```css
.board-document-bar {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 11px 14px;
  background: var(--c-white);
  border: 1px solid var(--c-border-soft);
  border-left: 4px solid var(--c-primary-deep);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
}
.board-document-heading { display: grid; margin-right: auto; }
.board-document-heading strong { color: var(--c-navy-deep); font-family: var(--font-display); font-size: 14px; }
.board-file-controls { position: relative; display: flex; align-items: center; gap: 7px; min-width: 0; }
.board-file-status { display: grid; min-width: 110px; max-width: 190px; color: var(--c-muted); font-size: 10px; line-height: 1.25; text-align: right; }
.board-file-status strong { overflow: hidden; color: var(--c-navy-deep); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.header-file-button, .board-reset-button { flex: 0 0 auto; min-height: 38px !important; padding: 7px 11px !important; font-size: 12px; }
```

Remove `.header-actions` rules. Change the header grid to two columns on desktop because the third action column no longer exists. Preserve the existing two-row wizard navigation at the `980px` breakpoint.

At `680px`, add:

```css
.board-document-bar { flex-wrap: wrap; gap: 8px; }
.board-document-heading { width: 100%; }
.board-file-controls { flex: 1 1 auto; }
.board-file-status { margin-right: auto; text-align: left; }
.header-file-button, .board-reset-button { min-height: 38px !important; padding: 7px 9px !important; }
```

At `480px`, keep the save status compact if needed, but do not hide the brand title solely to make room for file actions. Ensure buttons remain at least 38 pixels high and do not overflow the viewport.

- [ ] **Step 5: Run focused tests and commit**

Run:

```bash
npm test -- --run tests/app/boardFiles.test.tsx
git diff --check
```

Expected: all board-file tests PASS and no whitespace errors.

Commit:

```bash
git add src/app/App.tsx src/index.css tests/app/boardFiles.test.tsx
git commit -m "feat: move board actions above workspace"
```

---

### Task 3: Verification, independent review, and release

**Files:**
- Modify if review finds a defect: files changed in Tasks 1 and 2
- Modify: `HANDOFF.md`
- Build output only: `dist/`
- Deployment artifact only: `jessemaddox.com/projects/gameboard/`

**Interfaces:**
- Consumes: completed built-in board and toolbar behavior
- Produces: verified source commits and a base-path-correct deployed artifact

- [ ] **Step 1: Run the complete source gate**

Run:

```bash
npm test -- --run
npm run build
git diff --check
git status --short
```

Expected: every test passes, TypeScript and Vite production build pass, no whitespace errors, and only intentional files are changed.

- [ ] **Step 2: Request an independent read-only Claude review**

Run from the source worktree:

```bash
~/.local/bin/claude-review "Review the built-in Jesse Maddox Bachelor 2017 board loading and relocated board toolbar. Look for data-loss risks, built-in overwrite paths, focus/accessibility regressions, responsive discoverability issues, and missing tests. Read-only review only."
```

Evaluate every confirmed finding. Add a failing regression test before any behavioral fix, rerun the focused test, and commit only verified corrections.

- [ ] **Step 3: Re-run the complete gate after review**

Run:

```bash
npm test -- --run
npm run build
git diff --check
```

Expected: all commands pass after review fixes.

- [ ] **Step 4: Update the handoff and commit release notes**

Update `HANDOFF.md` with the final source commit, verified commands, built-in board behavior, toolbar placement, any review fixes, deployment commit, and live checks. Keep the file under 800 words.

Commit:

```bash
git add HANDOFF.md
git commit -m "docs: record built-in board toolbar release"
```

- [ ] **Step 5: Push source main**

Run:

```bash
git push origin HEAD:main
```

Expected: remote source `main` advances to the verified release commit.

- [ ] **Step 6: Build the deployment artifact with the required base path**

Run:

```bash
npx vite build --base=/projects/gameboard/
```

Expected: `dist/index.html` references `/projects/gameboard/assets/...`.

- [ ] **Step 7: Deploy through the isolated website worktree**

Follow the `host-on-jessemaddox` skill. Fetch the website remote, confirm the isolated deployment worktree is clean and based on current `origin/main`, replace only `projects/gameboard/` with the exact `dist/` contents, compare the directories, stage only `projects/gameboard/`, commit, and push the isolated deployment branch to website `main`.

- [ ] **Step 8: Verify production**

Verify:

```bash
curl --fail --silent --show-error --location https://jessemaddox.com/gameboard
```

Confirm the page and referenced CSS and JavaScript return HTTP 200, the live bundle contains `Jesse Maddox Bachelor 2017` and `board-document-bar`, and the production artifact still contains `noindex, nofollow`.
