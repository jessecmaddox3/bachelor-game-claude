# Built-In Bachelor Board and Board Toolbar

> **TL;DR:** Surface the complete original bachelor-party board as a protected built-in template named **Jesse Maddox Bachelor 2017**. Move Save, Boards, save status, and Start over into a prominent full-width toolbar directly below the builder steps and above the editing workspace.

## Summary and recommendation

The builder already contains Jesse's complete 2017 bachelor-party board, but it is presented only as an occasion preset during Setup. The save and load controls also live in the crowded application header, where they are easy to overlook.

This release will make the original board directly accessible from the Boards dialog and will group all board-level actions in a dedicated toolbar above the editor and preview. The toolbar will be prominent on desktop and will remain above the editing form on mobile.

## Goals

- Make the original 2017 bachelor-party board easy to find and load.
- Use the exact public name **Jesse Maddox Bachelor 2017** everywhere the built-in template appears.
- Prevent users from changing or overwriting the built-in template.
- Make Save and Boards obvious throughout Setup, Activities, and Design.
- Preserve the existing named-board storage model, keyboard shortcut, recovery draft, and unsaved-change protections.

## Non-goals

- Do not make the bachelor-party board load automatically on first launch.
- Do not add cloud accounts, synchronization, sharing, rename, or delete features.
- Do not change the historical board's roster, activities, scoring, design, or rules.
- Do not change print layouts or add the proposed second rules sheet in this release.

## Built-in board behavior

The Boards dialog will begin with a **Built-in boards** section. Its first entry will be **Jesse Maddox Bachelor 2017**, with a short description explaining that it contains the complete original roster, activities, scoring, results boxes, and rules.

Selecting Open will:

1. Check whether the current working board has unsaved changes.
2. Ask for confirmation before replacing unsaved work.
3. Load a fresh copy of the complete 2017 draft while preserving the current Setup, Activities, or Design step.
4. Clear any association with a browser-saved board.
5. Announce that **Jesse Maddox Bachelor 2017** was opened.

Because the loaded board is an editable copy with no saved-board association, its first Save action will open Save as. The built-in template itself cannot be overwritten.

The existing occasion preset in Setup will use the same **Jesse Maddox Bachelor 2017** name so the product does not show two names for the same board.

## Board toolbar

Save, Boards, current save status, and Start over will move out of the global application header into a dedicated board toolbar. The toolbar will occupy a full-width row immediately below the builder step navigation and immediately above the editor and preview.

The toolbar will contain:

- A concise **Board** context label.
- The active saved-board name when one exists.
- A clear Saved, Unsaved changes, or Not saved yet status.
- Primary Save and secondary Boards actions.
- A visually separated Start over action.

The toolbar will use the builder's existing visual system. A restrained accent edge and clear spacing will distinguish it as the place for document-level actions without competing with the editing form.

On narrower screens, the toolbar will wrap cleanly while keeping Save and Boards visible. Because it precedes both workspace columns in document order, mobile users will encounter it above the editing form instead of below the preview.

## Application structure

`App` will retain responsibility for the shell, wizard steps, and Start over behavior. It will render a new board-toolbar section as the first child of the main builder grid. `BoardFileControls` will continue to own saved-board status, Save, Boards, keyboard saving, and dialog behavior.

`BoardFileDialog` will receive built-in board metadata and an open callback. It will present built-in templates separately from browser-saved boards so the storage distinction is clear.

The occasion catalog remains the source of truth for the built-in board's ID, name, description, and draft factory. No historical board data will be duplicated in UI components.

## Error handling and safeguards

- Canceling the unsaved-work confirmation will leave the current board and dialog unchanged.
- A built-in board will always be created from a fresh draft factory, preventing edits from leaking into future openings.
- Existing browser-storage failures will continue to show the current recovery message.
- Existing saved boards remain untouched and compatible.
- Start over will retain its current confirmation.

## Accessibility

- The toolbar will have an accessible board-controls label.
- Built-in Open buttons will include the full board name in their accessible label.
- Opening a built-in board will use the existing polite live announcement.
- Dialog focus restoration, Escape behavior, backdrop dismissal, keyboard focus visibility, and `Cmd+S` or `Ctrl+S` behavior will remain intact.
- Responsive ordering will match visual ordering.

## Testing and acceptance criteria

The release is complete when:

- The Boards dialog shows **Jesse Maddox Bachelor 2017** before browser-saved boards.
- Opening it loads the complete historical draft, preserves the current wizard step, and leaves the active saved-board name empty.
- Opening it over unsaved work requires confirmation and respects cancellation.
- Saving the loaded template opens Save as rather than overwriting a built-in.
- The Setup occasion preset uses the same exact name.
- Save, Boards, save status, and Start over are in the full-width board toolbar, not the global header.
- The toolbar appears before the editor and preview in document order.
- Existing named-save, shortcut, dialog, draft-recovery, and storage-error tests continue to pass.
- The complete test suite, TypeScript build, production Vite build, and whitespace checks pass.
- An independent read-only review finds no unresolved correctness or usability defects.

## Deployment

After verification, the source changes will be committed and pushed to the game-board repository. The application will be rebuilt with the `/projects/gameboard/` base path and deployed through an isolated `jessemaddox.com` worktree so the other active website session remains untouched.
