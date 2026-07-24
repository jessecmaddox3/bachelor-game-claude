# Review Handoff: Built-In Bachelor Board and Board Toolbar

Branch: `feature/persistent-board-controls-20260724`

Review range: `3cf5d7b..HEAD`

> **TL;DR:** Review the template replacement and save-association logic in `BoardFileControls` first. The key safety contract is that **Jesse Maddox Bachelor 2017** always opens as a fresh unnamed draft, preserves the wizard step, confirms before replacing unsaved work, and cannot overwrite the built-in or create a named snapshot until the user completes Save as. Secondarily, inspect the responsive toolbar behavior at the `980px` breakpoint.

## Context

The previous release made browser-saved boards available from sticky header controls. Real use showed that Save and Boards were still difficult to find, and Jesse wanted the complete historical 2017 bachelor board available as a built-in choice.

The approved design and implementation plan are:

- `docs/superpowers/specs/2026-07-24-builtin-board-toolbar-design.md`
- `docs/superpowers/plans/2026-07-24-builtin-board-toolbar.md`

The implementation is complete and live at `https://jessemaddox.com/gameboard`. Source `main` is `3af90d5`; the website deployment commit is `1a18fda`.

## Change Surface

The review range changes only:

- `src/app/App.tsx`
- `src/app/BoardFileControls.tsx`
- `src/app/BoardFileDialog.tsx`
- `src/content/occasions/jesse2017.ts`
- `src/index.css`
- `tests/app/boardFiles.test.tsx`
- `tests/content/content.test.ts`
- the approved design, plan, and handoff documents

The separate `jessemaddox.com` checkout has extensive unrelated work from another active session. This release did not touch it. Deployment used the clean isolated worktree at `/Users/jesse/claude/jessemaddox.com/.worktrees/gameboard-save-deploy-20260724` and committed only `projects/gameboard/`.

## Design of the Key Part

`OCCASION_PACKS` remains the source of truth for built-in metadata. `BoardFileControls` maps it to dialog display data, resolves the selected ID again through `occasionById`, and calls:

```ts
replaceDraft(occasion.createDraft(), null);
```

The fresh factory prevents edits from leaking between openings. Passing `null` clears named-save association, so the existing `saveActive` path opens Save as instead of overwriting anything.

The Boards dialog displays built-ins before browser saves. When browser saves exist, initial keyboard focus goes to the first browser-saved board, which avoids an immediate Enter keypress silently switching to the built-in.

The document toolbar is the first child of `.builder-layout`, above the editor and preview in both visual and document order. Desktop panels scroll internally, so the toolbar remains visible. At `980px` and below, the taller app header becomes static and the toolbar becomes sticky at the top. This preserves the save controls without stacking two large sticky regions on a phone.

## Verified Already

Fresh verification on 2026-07-24:

```bash
npm test -- --run
npm run build
git diff --check
```

Result: 29 test files and 309 tests passed. TypeScript and Vite production build passed. The existing large-chunk warning remains.

The deployment build used:

```bash
npx vite build --base=/projects/gameboard/
```

`dist/` matched the deployed `projects/gameboard/` directory exactly before commit. Production HTML, CSS, application JavaScript, and PDF JavaScript returned HTTP 200 from Vercel. The live application bundle contained `Jesse Maddox Bachelor 2017`, `Open built-in board`, and `board-reset-group`. Production retains `noindex, nofollow`.

Claude completed an independent read-only review. Confirmed focus, mobile persistence, direct protection-test, accessible-name, and Start over separation findings were fixed in `a17b84a`.

## Known Issues and Open Questions

- The in-app browser was unavailable. No screenshot-based desktop or phone review was completed. Responsive behavior was checked through DOM tests, CSS review, minimum-width calculations, builds, and live asset verification.
- The suggestion to confirm when replacing a clean saved board with the built-in was deliberately not adopted. The approved spec confirms only for unsaved work, and the clean named snapshot remains available in browser storage.
- `npm install` reports 12 existing dependency advisories. This release changed no dependency versions.
- The website's global link checker reports unrelated existing preview, Spoiler Alert, and Pizza links. It reports no broken file inside `projects/gameboard/`.
- Generated minified JavaScript triggers a trailing-whitespace warning in the website artifact's `git diff --check`. The source tree passes the check, and the deployed artifact exactly matches Vite output.
- The managed sandbox can block local remote-tracking ref updates after successful pushes. Direct `git ls-remote` checks confirmed both published commits.

## How to Run

```bash
git log --oneline 3cf5d7b..HEAD
git diff 3cf5d7b..HEAD -- src tests
npm install
npm test -- --run
npm run dev
```

Manual review flow:

1. Open Boards and verify the built-in appears above browser saves.
2. Open **Jesse Maddox Bachelor 2017** from Activities or Design and confirm the current step is preserved.
3. Press Save and verify Save as appears.
4. Create and reopen a browser save, then verify Save performs a one-click update.
5. At phone width, scroll a long Activities screen and verify the board toolbar sticks while the app header scrolls away.
