# Persistent Board Files and Activity Library Cleanup

> **TL;DR:** Move named-board controls into the sticky application header so a loaded board can be saved from every step. A named board gets one-click Save, visible Saved or Unsaved changes status, Save as, an accessible Boards dialog, and `Cmd+S` or `Ctrl+S`. Keep the existing automatic recovery draft separate. Add explicit activity-description expansion and consolidate duplicate catalog entries through stable aliases so old saved boards continue to load.

## Problem and Outcome

The builder already persists two kinds of state:

- A continuously updated working draft in the Zustand `game-board-v5` store.
- Explicit named snapshots in `game-board-saves-v1`.

The named snapshot controls currently appear only in Setup. After a person loads a board and continues through Activities or Design, saving requires navigating back to the beginning of the flow. The UI also does not identify the active named board or say whether the current draft has changed since its last named save.

Activity descriptions are visually truncated in the picker. The full text is searchable but cannot be opened, which makes similar activities hard to distinguish. The catalog also contains several activity families that appear more than once for the same occasion under identical or substantially equivalent names and instructions.

The finished experience must make the builder feel like a lightweight document editor:

- Save and open controls remain available throughout the flow.
- The current named board and its save status are obvious.
- Saving an already named board takes one action.
- Full activity instructions can be read without changing selection.
- A given occasion does not present redundant choices for the same activity mechanic.
- Existing named saves and the automatic recovery draft remain compatible.

## Scope

This release includes:

- Persistent header controls for Save and Boards.
- Active named-board identity persisted with the working draft.
- Saved and Unsaved changes status.
- One-click overwrite of the active named snapshot.
- Save as for creating a named snapshot or a separate copy.
- Opening a saved board from any wizard step.
- `Cmd+S` and `Ctrl+S`.
- Protection against replacing unsaved work.
- Removal of the old Setup-only save and load section.
- An explicit expand and collapse control for catalog activity instructions.
- A quick catalog deduplication pass, stable catalog ID aliases, and regression tests.

This release does not include:

- Cloud accounts, server storage, sharing, or cross-device sync.
- Automatic overwriting of named snapshots after every edit.
- Version history, undo across sessions, folders, rename, or delete.
- Automatic semantic deletion based only on fuzzy text similarity.
- The optional second-sheet Activity Guide proposed for a future release.

## Chosen Saving Model

Named saves remain explicit snapshots. The continuously persisted working draft remains the recovery layer.

This separation is intentional:

- The recovery draft protects work if the tab closes or the page reloads.
- A named snapshot changes only when the person presses Save or confirms Save as.
- Loading a named board establishes it as the active board.
- Editing an active board changes its status to Unsaved changes.
- Saving updates that same named snapshot without another overwrite confirmation.
- Save as creates or replaces a different named snapshot and makes it active.

This avoids the surprise of silent named-save overwrites while making frequent saving easy.

## Header Experience

The existing sticky header gains a `BoardFileControls` area. It is visible in Setup, Activities, and Design.

The control shows:

- The active save name when one exists.
- `Not saved yet` when the current draft has no active named snapshot.
- `Saved` when the current normalized draft matches the active snapshot.
- `Unsaved changes` when the current draft differs from the active snapshot.
- A primary `Save` button.
- A secondary `Boards` button.

Save behavior:

- If an active named board exists, Save immediately updates that snapshot and changes the status to Saved.
- If no active named board exists, Save opens the Save as dialog.
- `Cmd+S` on macOS and `Ctrl+S` elsewhere invoke the same behavior and prevent the browser's default Save Page action.
- Save as suggests the board title as the initial name when no save name exists.
- A same-name Save as requires overwrite confirmation because it may replace a snapshot other than the active board.
- A successful save is announced in a polite live region.
- Local storage failure leaves the status unchanged and displays a non-blocking error in the dialog or header control.

Boards behavior:

- Boards opens a modal dialog listing named snapshots newest first.
- Each row displays the board name and a readable last-saved timestamp.
- Each row has an Open action.
- The dialog includes Save as and Close actions.
- Opening a saved board loads its complete normalized draft, marks that name active, closes the dialog, and preserves the current wizard step.
- If the current draft has unsaved changes, Open requires confirmation before replacing it.
- If the current draft is clean, Open does not require confirmation.
- An empty list explains that no named boards exist yet and offers Save as.

Start over behavior:

- The existing confirmation remains.
- Confirming Start over clears the active named-board identity and resets the draft and wizard step.
- It does not delete any named snapshots.

Responsive behavior:

- Desktop shows name, status, Save, Boards, and Start over in the header action region.
- Narrow layouts may hide the status text visually, but the accessible name of Save must still communicate the active board state.
- Save and Boards remain reachable without horizontal scrolling.

## State and Persistence

`WizardState` gains:

```ts
activeSavedBoardName: string | null;
setActiveSavedBoardName: (name: string | null) => void;
```

The field is persisted inside `game-board-v5`. The existing merge path treats a missing field as `null`, so no storage-key change is required.

`replaceDraft` continues to normalize a replacement draft. Callers that load a preset must clear the active save name. The saved-board opening path must replace the draft and then set the opened board name as active. `reset` clears the active save name.

`src/store/savedBoards.ts` adds pure comparison and display helpers:

```ts
draftFingerprint(draft: Draft): string;
savedBoardMatchesDraft(name: string, draft: Draft): boolean;
workingDraftHasChanges(draft: Draft): boolean;
```

`draftFingerprint` serializes `normalizeDraft(draft)` after removing activity `uid` values. Those values are editor-only identities and an older saved snapshot can receive fresh values during normalization. Excluding them prevents false Unsaved changes results while retaining every user-editable field. The remaining draft is a stable plain-data structure, so a deterministic JSON representation is sufficient. The helper is not a security hash.

`workingDraftHasChanges` compares the draft with `defaultDraft()` through the same fingerprint. It controls discard confirmation when no active named save exists. A clean active named board can open another saved board without a prompt, while an edited active board and a modified unnamed draft require confirmation.

When the active name no longer resolves to a saved snapshot, the UI treats the draft as unsaved and requires Save as.

Storage reads and writes must be wrapped so malformed JSON or a browser storage failure does not crash the builder. Existing malformed-data behavior remains an empty saved-board list.

## Component Boundaries

`src/app/BoardFileControls.tsx` owns the document-control UI and keyboard shortcut. It consumes the wizard store and the saved-board storage API. It does not own board rendering or wizard navigation.

`src/app/BoardFileDialog.tsx` renders the accessible modal, save-name form, saved-board list, and local error copy. It receives state and callbacks from `BoardFileControls`.

`src/app/App.tsx` places `BoardFileControls` in the sticky header and retains Start over as a separate destructive action.

`src/app/steps/SetupStep.tsx` removes its named save and load state, callbacks, and section. Preset loading continues to live beside occasion selection and clears active named-board identity when accepted.

`src/app/ActivityPickerRow.tsx` renders one catalog activity choice. It keeps selection and description expansion as separate actions:

- The checkbox and its text label add or remove the activity.
- A Details button has `aria-expanded` and `aria-controls`.
- Activating Details never toggles the checkbox.
- Collapsed text retains the compact picker layout.
- Expanded text wraps to its full instruction and remains within the same activity row.

Custom activities and hidden-selection notices do not need Details controls because they do not contain truncated catalog instructions.

## Activity Deduplication Policy

Deduplication is based on the choices visible for one occasion, not merely duplicate text anywhere in the source seed archive.

An entry is consolidated when:

- It represents the same action and success condition as a reusable entry.
- Its different wording does not create a meaningfully different game.
- Showing both entries for the same occasion makes selection harder rather than adding a useful variant.

An entry remains separate when:

- It changes the participant relationship, trigger, success condition, or meaningful social context.
- It represents a true variant that a board creator could reasonably select alongside the other activity.
- Similarity is only lexical.

The initial canonical migrations are:

| Legacy catalog IDs | Canonical catalog ID | Reason |
|---|---|---|
| `fam-taste-test`, `ann-blind-taste`, `fri-blind-taste`, `gen-taste-mystery` | `blind-snack-rank` | One blind tasting mechanic |
| `fam-photo-recreate`, `ann-photo-recreate` | `recreate-photo` | One old-photo recreation mechanic |
| `fri-first-coffee` | `first-up-coffee` | Same first-person-up service activity |
| `fam-timeline-build` | `family-timeline` | Same family timeline activity |
| `kid-thank-you-note` | `thank-you-note` | Same thank-you note activity |
| `fam-help-cleanup`, `fri-plate-wash` | `meal-cleanup` | Same complete meal cleanup activity |
| `gen-help-clean`, `fri-cabin-fix` | `cabin-improvement` | Same unassigned shared-space improvement |
| `fam-toast-honor`, `gen-toast`, `fri-toast-story` | `specific-toast` | Same specific group toast mechanic |
| `kid-set-table`, `fam-help-setup` | `set-table` | Same table-setting activity |
| `bte-card-game-win`, `kid-card-game` | `board-game-win` | Same card, dice, or board-game win |

`set-table` is a new reusable canonical entry for kids weekends and family reunions.

`board-game-win` is renamed to `Win a Card, Dice, or Board Game`, with one inclusive instruction and its existing stable ID.

The existing `CONSOLIDATED_SEED_IDS` pattern remains the public-library filter. Recommended activity arrays are updated to canonical IDs.

## Saved-Board Catalog Migration

Removing an activity from the public library must not strand activities already stored in a working draft or named snapshot.

`src/content/activityAliases.ts` exports the legacy-to-canonical ID map and:

```ts
canonicalActivityId(id: string | undefined): string | undefined;
```

`normalizeDraft` applies the alias to each activity row. It preserves the saved row's user-editable name, points, maximum points, and bonus value. This is important because a person may have customized those fields after selecting the original catalog activity.

If normalization maps multiple rows in one draft to the same canonical ID, the rows remain separate. Silent row deletion could remove intentional scoring rows. The activity picker treats the canonical item as selected if any matching row exists, while the advanced activity table remains the place to remove or merge board-specific duplicates.

The source-faithful 2017 historical occasion pack is not deduplicated or rewritten.

## Duplicate Audit and Regression Rules

The content test suite adds:

- Every public activity ID is unique.
- Every recommended ID resolves to a public activity.
- No two activities visible for the same occasion share a normalized title.
- The legacy IDs in the migration table are absent from the public library.
- Every legacy alias resolves to an existing canonical public activity.
- The known blind-taste, old-photo, coffee, timeline, cleanup, toast, table-setting, and game-win families resolve to their canonical entries.

Normalized title comparison lowercases text, removes punctuation and articles, collapses whitespace, and compares the remaining phrase.

A fuzzy similarity audit may be run as a development check, but fuzzy similarity does not automatically fail the build. Borderline pairs are reviewed manually because activities such as teaching a skill and performing a talent can share vocabulary without being duplicates.

## Accessibility and Interaction Requirements

- Dialogs use `role="dialog"`, `aria-modal="true"`, a labelled heading, and an initial focused control.
- Escape closes a dialog unless a save is actively being submitted.
- Focus returns to the button that opened the dialog.
- Save status and successful saves use `aria-live="polite"`.
- Errors use `role="alert"`.
- Details buttons expose expanded state and control relationships.
- Details can be opened with keyboard, pointer, or touch.
- Clicking Details never changes activity selection.
- All controls retain visible focus styles and meet the existing minimum mobile target sizing.
- Reduced-motion preferences remain respected.

## Error and Edge-Case Behavior

- Empty or whitespace-only save names are rejected inline.
- Names are trimmed and remain capped at 80 characters.
- Opening a missing snapshot leaves the current board untouched and shows an error.
- Declining an overwrite or discard confirmation leaves all state untouched.
- A malformed saved-board collection is treated as empty.
- A local storage write failure keeps the active draft intact and reports that the named save was not updated.
- A page reload restores the draft, wizard step, and active save name. The status is recomputed against the named snapshot.
- A preset load clears active named-board identity because it creates a new working document.
- Changing only the selected activity descriptions' expanded state does not dirty or persist the board.

## Testing Strategy

Implementation follows red, green, refactor cycles.

Store and persistence tests cover:

- Active save identity defaults, persistence merge, preset replacement, and reset.
- One-click overwrite of an active board.
- Save as and same-name confirmation boundaries.
- Clean and dirty fingerprint comparison.
- Missing active snapshot behavior.
- Storage exceptions.
- Legacy activity ID normalization without loss of customized row values.

Component tests cover:

- Header controls on all three wizard steps.
- Initial Save opening Save as.
- Active Save updating the current snapshot.
- Boards opening and loading without returning to Setup.
- Unsaved-change confirmation.
- `Cmd+S` and `Ctrl+S`.
- Save success and failure announcements.
- Full description expansion without checkbox changes.
- Keyboard-accessible Details behavior.

Content tests cover every rule in Duplicate Audit and Regression Rules.

The complete verification gate is:

```bash
npm test -- --run
npx tsc --noEmit
npm run build
git diff --check
```

## Acceptance Criteria

The release is complete when:

- A board loaded from named saves can be edited and saved without leaving Activities or Design.
- The header identifies the active board and accurately reports Saved or Unsaved changes.
- Save is one click for an active board and opens Save as for an unnamed board.
- Boards can be opened from every step.
- Keyboard saving works without triggering the browser Save Page dialog.
- The automatic recovery draft still restores work and does not silently overwrite named snapshots.
- The Setup-only named-save section is gone.
- Every truncated catalog instruction can be expanded in place.
- Expanding an instruction never selects or removes an activity.
- The specified duplicate families appear only through their canonical public entries.
- Old saved catalog IDs migrate to canonical IDs without losing customized board-row data.
- The historical 2017 preset remains source-faithful.
- Focus, announcements, mobile layout, tests, type checking, and production build pass.

## Deployment and Concurrency

Implementation occurs only in `bachelor-game-claude`. The source commit is pushed after verification.

Deployment to `jessemaddox.com` must wait until its other active session is no longer writing overlapping deployment files. When safe, deployment uses an isolated site worktree and the existing gameboard artifact-copy process. The deployed route is verified at `https://jessemaddox.com/gameboard`.
