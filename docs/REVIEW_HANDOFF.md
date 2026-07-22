# Review Handoff: Setup and Activities Release

> **Status, 2026-07-22:** Review executed. All findings from this review were fixed in commit
> `33e1b00` (the review-pass release, deployed to `jessemaddox.com/gameboard`). This document is
> retained as a historical record of the review, not as an open task list.

Branch: local `main`. Review the uncommitted working tree against `77d3fd1`.

## TL;DR: What to Review

The highest-value review target is the Setup and Activities experience: blank-board defaults, single occasion state, player chip entry and paste handling, occasion-specific recommendations, and responsive selectable cards. Secondarily, check the blue visual-system pass across the wizard shell and Design step.

## Context

This release finishes the self-contained poster-builder setup before work moves to the separate Challenge Chain product. The approved source documents are `docs/product/2026-07-20-setup-and-activities-redesign-HANDOFF.md` and `docs/product/2026-07-20-activity-seed-library.md`.

The repository already carried a large uncommitted Phase 1 diff when this session started. That pre-existing work includes the occasion-pack architecture, the 2017 landscape board, renderer changes, font assets, export updates, and related tests. The Setup and Activities files were already dirty and now also contain this session's changes.

## Change Surface

This session changed:

- `src/app/App.tsx`, `Preview.tsx`, and all three wizard step components
- `src/content/activities.ts` and new `src/content/activitySeeds.ts`
- `src/index.css`
- `src/store/toBoardSpec.ts` and `src/store/wizardStore.ts`
- focused app, content, store, and fixture tests
- `tests/setup.ts` to register the existing jest-dom dependency

Pre-existing engine, renderer, font, export, occasion-pack, and product-document changes remain in the same working tree. Do not attribute those to this session, but flag any confirmed regression that blocks the complete release.

## Design of the Key Part

`defaultDraft()` now starts as `Kids Weekend` with a blank honoree, the sorted family roster as players, and no activities. The persisted storage key is `game-board-v5`, which deliberately prevents older filler rows from surviving the redesign.

Setup owns `draft.libraryOccasion`. Activities reads that value and no longer asks the occasion again. Player entry accepts Enter, comma-separated paste, and multiline paste, then renders removable chips with inline editing. Saved boards remain an explicit optional replacement path.

The 219 approved seed challenges live as typed data in `activitySeeds.ts`. `activities.ts` maps them into the existing catalog model and defines 16 curated recommended rows for each of eight occasions. Kids recommendations contain no drinking or adult-only rows.

The visual system uses Montserrat headings, the approved Volt-blue palette through CSS variables, a compact scorecard-style progress rail, quiet setup cards, and selected activity cards with the prescribed blue wash.

## Verified Already

The following command passed on 2026-07-20:

```bash
git diff --check && npx tsc --noEmit && npm test && npm run build
```

Result: 22 test files and 186 tests passed, typecheck passed, and Vite production build passed. The existing large-chunk warning remains.

## Known Issues and Open Questions

- The in-app browser backend was unavailable, so this session could not capture fresh desktop and phone screenshots. Responsive behavior is implemented in CSS and DOM-tested, but visual device inspection remains the main review gap.
- The read-only Claude review command hung and was terminated without producing findings. Do not treat the independent review as completed.
- `npm install` reports 12 existing dependency advisories. No dependency versions changed in this session.
- The generated site output is live and committed in the `jessemaddox.com` repo as `bbe7f18`. Production serves `index-CXsTrqJc.js` and `index-B0gpm_Lh.css` with HTTP 200 responses.
- The repo is 65 commits ahead of `origin/main`, and the full working tree includes pre-existing edits. Staging must remain path-specific.

## How to Run

```bash
git diff 77d3fd1 -- src/app src/content src/store src/index.css tests/app tests/content tests/store tests/helpers/fixtures.ts tests/setup.ts
npm install
npm test
npm run dev
```

On a fresh board, confirm the following flow: choose Beach trip, add at least eight players with Enter or paste, add the recommended set, browse cards and filters, continue to Design, and inspect the preview and export hierarchy.
