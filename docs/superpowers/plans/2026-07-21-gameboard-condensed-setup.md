# Gameboard Condensed Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/gameboard` family-ready by default, faster to configure, easier to scan, and typographically resilient across sparse and dense boards.

**Architecture:** Preserve the React, Zustand, Zod, Vite, and pure poster-engine architecture. Add focused pure helpers for participant ordering and safe rules parsing, then fit text to each cell after structural layout. Publish generated output from an isolated website clone so unrelated dirty work is never staged.

**Tech Stack:** React 19, TypeScript 5.7, Zustand 5, Zod 3, Vitest 4, Testing Library, Vite 6, SVG/PDF/PNG poster renderers.

## Global Constraints

- Normal Setup exposes only `Title` and `Subtitle`; legacy honoree remains internal and optional.
- New boards start as `Kids Weekend` with the exact family roster and no activities.
- Participants sort case-insensitively after add, paste, or edit.
- Occasion labels use proper capitalization and one visible emoji each.
- Changing occasion never silently clears selected activities.
- Activity browsing uses native checkboxes, two desktop columns, one mobile column, and `Clear all`.
- Wording and point customization lives in Design.
- Rules accept only paragraphs, `- ` bullets, and paired double-asterisk bold spans.
- Poster text stays inside resolved cells with padding and existing legibility floors.
- Preserve `My Bachelor Party Weekend` as the complete historical preset.
- Use test-driven development and preserve unrelated dirty files.

---

### Task 1: Revise the Draft Model, Defaults, and Historical Preset

**Files:**
- Modify: `src/models/boardSpec.ts`
- Modify: `src/store/toBoardSpec.ts`
- Modify: `src/store/wizardStore.ts`
- Modify: `src/content/activities.ts`
- Modify: `src/content/occasions/jesse2017.ts`
- Test: `tests/store/toBoardSpec.test.ts`
- Test: `tests/store/wizardStore.test.ts`
- Test: `tests/content/content.test.ts`

**Interfaces:**
- Produces: `sortParticipantNames(names)`, optional legacy `honoree`, `rulesContent`, revised `defaultDraft()`, and renamed historical preset.
- Consumes: existing Draft, BoardSpec, occasion pack, starter copy, and theme interfaces.

- [ ] **Step 1: Write failing model and default tests**

Assert that `defaultDraft()` has Title `Kids Weekend`, blank honoree and Subtitle, occasion `kids-weekend`, no activities, and exactly this participant set:

```ts
[
  'Jess', 'Kate', 'Jack', 'Bobby', 'Kaz', 'Brett', 'Rachel', 'Bo',
  'Eleanor', 'Hunter', 'SG', 'Coco', 'Nona', 'Shay Shay', 'Steven', 'Mary',
]
```

Assert the stored roster is case-insensitively alphabetic. Assert `sortParticipantNames(['zoe', 'Amy', 'bob'])` returns `['Amy', 'bob', 'zoe']`. Assert blank honoree validates when Title is present, `rulesContent` validates, and the old rules array is no longer required. Assert the historical pack is named `My Bachelor Party Weekend` and retains its roster, activities, legacy honoree, and full rules content.

- [ ] **Step 2: Run focused tests and confirm RED**

```bash
npm test -- tests/store/toBoardSpec.test.ts tests/store/wizardStore.test.ts tests/content/content.test.ts
```

Expected: the old empty general draft, required honoree, old rules array, missing ordering helper, and old preset name fail.

- [ ] **Step 3: Implement the model changes**

Export `DEFAULT_PARTICIPANTS` and:

```ts
export function sortParticipantNames(names: readonly string[]): string[] {
  return [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}
```

Replace Draft rules and heading-suffix fields with `rulesContent: string`. Default to Kids Weekend, the sorted family roster, no activities, no write-ins, no honoree bonus, and no corner boxes. Make BoardSpec honoree a maximum-30-character string with an empty default. Replace the rules array with a maximum-12,000-character `rulesContent` string while retaining `rulesTitle`.

Bump persistence to `game-board-v5`; deep-merge defaults, sort participants, and backfill activity UIDs. Convert each historical rule to an optional bold heading line followed by body text, separated by blank lines. Rename the historical preset.

- [ ] **Step 4: Run focused tests and confirm GREEN**

Run the Step 2 command. Expected: all focused tests pass.

- [ ] **Step 5: Attempt an explicit-path source commit**

```bash
git add src/models/boardSpec.ts src/store/toBoardSpec.ts src/store/wizardStore.ts src/content/activities.ts src/content/occasions/jesse2017.ts tests/store/toBoardSpec.test.ts tests/store/wizardStore.test.ts tests/content/content.test.ts
git commit -m "feat: add family-ready gameboard defaults"
```

If sandboxed Git metadata blocks the commit, preserve the verified working-tree diff and continue without staging unrelated files.

---

### Task 2: Condense Setup and Move Poster Size to Design

**Files:**
- Modify: `src/app/steps/SetupStep.tsx`
- Modify: `src/app/steps/DesignStep.tsx`
- Modify: `src/index.css`
- Test: `tests/app/steps.test.tsx`
- Test: `tests/app/appSmoke.test.tsx`

**Interfaces:**
- Consumes: `sortParticipantNames`, occasion label metadata, poster sizes, and wizard state.
- Produces: compact occasion, naming, participants, and poster-settings UI.

- [ ] **Step 1: Write failing setup interaction tests**

Assert Setup contains Title with placeholder `The Bachelor Weekend of Jesse Cordell Maddox III`, Subtitle with placeholder `October 19th - 22nd, 2022 - Blue Ridge, GA`, heading `Participants`, and field `Add participants`. Assert Honoree and Poster size are absent. Assert all eight capitalized emoji occasion labels are visible.

Add interactions for adding `Aaron`, pasting `Zoe, Abbie`, and editing a participant; after each operation, assert the store roster remains alphabetic. Render Design and assert Poster size is present there.

- [ ] **Step 2: Run setup tests and confirm RED**

```bash
npm test -- tests/app/steps.test.tsx tests/app/appSmoke.test.tsx
```

Expected: old labels, old fields, and append-only ordering fail.

- [ ] **Step 3: Implement compact Setup**

Remove numbered ornaments, Honoree, and Poster size from normal Setup. Use the exact Title and Subtitle labels and placeholders. Rename participant copy and sort after add, paste, or edit. Add the exact emoji labels through occasion metadata rather than hardcoding them in the component.

Add a `Poster settings` section near the top of Design using the existing poster-size values. Reduce Setup section padding and copy. Use four occasion columns on wider panels, two on narrower panels, and stacked saved-board controls on mobile. Preserve 44-pixel controls and visible focus states.

- [ ] **Step 4: Run setup tests and confirm GREEN**

Run the Step 2 command and `npm run build`. Expected: tests, TypeScript, and Vite pass.

- [ ] **Step 5: Attempt the explicit-path commit**

```bash
git add src/app/steps/SetupStep.tsx src/app/steps/DesignStep.tsx src/index.css tests/app/steps.test.tsx tests/app/appSmoke.test.tsx
git commit -m "feat: condense gameboard setup"
```

---

### Task 3: Compact Activity Selection and Move Details to Design

**Files:**
- Create: `src/app/steps/ActivityDetails.tsx`
- Modify: `src/app/steps/ActivitiesStep.tsx`
- Modify: `src/app/steps/DesignStep.tsx`
- Modify: `src/index.css`
- Test: `tests/app/steps.test.tsx`

**Interfaces:**
- Produces: `ActivityDetails`, direct checkbox browsing, `Clear all`, and simplified custom activity entry.
- Consumes: activity catalog, occasion ranking, point parser, and draft patching.

- [ ] **Step 1: Write failing activity-flow tests**

Assert the browse screen shows `You can customize points and text for each activity later.`, disabled `Clear all` when empty, `Add a new activity`, and no Customize wording button. Select two activities, clear all, and assert both the draft and count return to zero. Add a new activity and assert the form asks only for a name, stores one point, and labels the row `Your idea`. Render Design and assert Activity details exposes activity name and points controls.

- [ ] **Step 2: Run the picker tests and confirm RED**

```bash
npm test -- tests/app/steps.test.tsx
```

Expected: missing note and Clear all, old customization branch, and custom points field fail.

- [ ] **Step 3: Extract ActivityDetails and simplify browsing**

Move the selected-activity editing table into `ActivityDetails.tsx` and render it in Design before Theme. Remove the customizing branch from ActivitiesStep. Add the note and Clear all action. Rename custom activity copy, remove the initial points input, assign one point, and use `Your idea` instead of `Custom`.

Make each category's row list a two-column CSS grid with individually bordered checkbox options. Restore one column at the mobile breakpoint. Keep points visually secondary and preserve accessible Add or Remove names.

- [ ] **Step 4: Run activity tests and confirm GREEN**

Run the Step 2 command. Expected: all picker and detail interactions pass.

- [ ] **Step 5: Attempt the explicit-path commit**

```bash
git add src/app/steps/ActivityDetails.tsx src/app/steps/ActivitiesStep.tsx src/app/steps/DesignStep.tsx src/index.css tests/app/steps.test.tsx
git commit -m "feat: streamline gameboard activity selection"
```

---

### Task 4: Add One Rich-Text-Lite Rules Document

**Files:**
- Create: `src/engine/rules/richText.ts`
- Create: `src/app/steps/RulesEditor.tsx`
- Modify: `src/app/steps/DesignStep.tsx`
- Modify: `src/engine/scene/compose.ts`
- Modify: `src/engine/scene/composeLandscapeBrackets.ts`
- Modify: `src/engine/buildBoard.ts`
- Modify: `src/index.css`
- Test: `tests/engine/richText.test.ts`
- Test: `tests/engine/compose.test.ts`
- Test: `tests/engine/samples.test.ts`
- Test: `tests/app/steps.test.tsx`

**Interfaces:**
- Produces: `parseRulesDocument(source): RulesBlock[]`, styled rules wrapping, one RulesEditor, and complete portrait and landscape rendering.
- Consumes: `rulesTitle`, `rulesContent`, font metrics, and scene text primitives.

- [ ] **Step 1: Write parser and editor RED tests**

Test `parseRulesDocument` with a paragraph containing a paired bold span followed by a bullet. The expected blocks must preserve normal and bold spans without marker characters. Cover unmatched markers as literal text, blank paragraphs, consecutive bullets, and empty source.

In app tests, assert one Rules title field, one Rules content editor, Bold and Bulleted list controls, and no `+ Rule` button.

- [ ] **Step 2: Run focused tests and confirm RED**

```bash
npm test -- tests/engine/richText.test.ts tests/app/steps.test.tsx
```

Expected: missing parser and RulesEditor fail.

- [ ] **Step 3: Implement deterministic parsing and editing**

Create:

```ts
export type RulesSpan = { text: string; bold: boolean };
export type RulesBlock = { kind: 'paragraph' | 'bullet'; spans: RulesSpan[] };
export function parseRulesDocument(source: string): RulesBlock[];
```

Parse only blank-line paragraphs, line-leading bullet markers, and paired bold markers. Never parse HTML. RulesEditor uses a textarea with two toolbar buttons. Bold wraps the current selection in paired markers. Bulleted list prefixes every selected nonblank line. Restore focus and selection after formatting.

- [ ] **Step 4: Write renderer RED tests**

Assert marker characters never appear in scene text, bold spans use the bold font, bullets render a bullet glyph, all source text is represented, and long content either fits completely or returns the established infeasibility result.

- [ ] **Step 5: Implement measured styled rules layout**

Tokenize spans into measured words, wrap them greedily, and place each span using accumulated measured width. Use a fixed measured bullet prefix and hanging indent. Try sizes from 9 down to 5 points. Select one, two, or three columns from block count and place complete blocks into the shortest column. Never truncate.

Use the same blocks with landscape and landscape-bold fonts in the historical rules rail. Keep the existing honest rules-do-not-fit result.

- [ ] **Step 6: Run rules tests and confirm GREEN**

```bash
npm test -- tests/engine/richText.test.ts tests/engine/compose.test.ts tests/engine/samples.test.ts tests/app/steps.test.tsx
npm run build
```

Expected: parser, editor, renderer, TypeScript, and Vite pass.

- [ ] **Step 7: Attempt the explicit-path commit**

```bash
git add src/engine/rules/richText.ts src/app/steps/RulesEditor.tsx src/app/steps/DesignStep.tsx src/engine/scene/compose.ts src/engine/scene/composeLandscapeBrackets.ts src/engine/buildBoard.ts src/index.css tests/engine/richText.test.ts tests/engine/compose.test.ts tests/engine/samples.test.ts tests/app/steps.test.tsx
git commit -m "feat: add fitted rich text rules"
```

---

### Task 5: Scale Text to Resolved Poster Cells

**Files:**
- Modify: `src/engine/layout/wrap.ts`
- Modify: `src/engine/layout/gridSolver.ts`
- Modify: `src/engine/scene/compose.ts`
- Modify: `src/engine/scene/composeLandscapeBrackets.ts`
- Test: `tests/engine/wrap.test.ts`
- Test: `tests/engine/gridSolver.test.ts`
- Test: `tests/engine/compose.test.ts`
- Test: `tests/engine/samples.test.ts`
- Test: `tests/helpers/invariants.ts`

**Interfaces:**
- Produces: `fitWrappedText(...)` and per-cell participant, activity, points, and totals sizes.
- Consumes: solved grid geometry, FontMetrics, CELL_PAD, and current type floors.

- [ ] **Step 1: Write sparse and dense poster RED tests**

Create fixtures with 30 participants and five activities, five participants and 30 activities, long participant names, and long activity names. Assert no text primitive escapes its box. Assert the sparse board's activity labels are meaningfully larger than the structural floor and larger than dense-board labels. Assert rotated participant and centered points text remain contained.

- [ ] **Step 2: Run focused tests and confirm RED**

```bash
npm test -- tests/engine/wrap.test.ts tests/engine/gridSolver.test.ts tests/engine/compose.test.ts tests/engine/samples.test.ts
```

Expected: sparse activity labels remain at the old global size and fail the growth assertion.

- [ ] **Step 3: Implement a pure wrapped-text fitter**

Export:

```ts
export function fitWrappedText(
  text: string,
  maxW: number,
  maxH: number,
  fontId: FontId,
  metrics: FontMetrics,
  options: { minPt: number; maxPt: number; maxLines: number },
): { pt: number; lines: string[] } | null;
```

Walk downward by 0.5 points. At each size, wrap without accepting ellipsis and require total line height to fit.

- [ ] **Step 4: Fit each rendered cell after structural solving**

Keep `GridLayout.bodyPt` as the structural minimum. Fit each activity label inside its task cell with a 20-point maximum. Fit points and totals independently with the same cap. Fit each rotated participant using header height as text width and participant-column width as line height, capped at 18 points. Center line groups and preserve CELL_PAD. Apply equivalent measured fitting in landscape without changing its historical hierarchy.

- [ ] **Step 5: Run engine and full-suite GREEN checks**

```bash
npm test -- tests/engine/wrap.test.ts tests/engine/gridSolver.test.ts tests/engine/compose.test.ts tests/engine/samples.test.ts
npm test
npm run build
```

Expected: every focused and full-suite test passes with no containment failure.

- [ ] **Step 6: Attempt the explicit-path commit**

```bash
git add src/engine/layout/wrap.ts src/engine/layout/gridSolver.ts src/engine/scene/compose.ts src/engine/scene/composeLandscapeBrackets.ts tests/engine/wrap.test.ts tests/engine/gridSolver.test.ts tests/engine/compose.test.ts tests/engine/samples.test.ts tests/helpers/invariants.ts
git commit -m "feat: scale gameboard text to cells"
```

---

### Task 6: Integrate, Inspect, and Publish

**Files:**
- Generate: `dist/`
- Publish: `projects/gameboard/` in an isolated temporary clone of `jessecmaddox3/jessemaddox.com`
- Modify only if its description changes: `PAGES.md`

**Interfaces:**
- Consumes: verified source build and latest remote website main.
- Produces: updated `https://jessemaddox.com/gameboard`.

- [ ] **Step 1: Run the complete source verification matrix**

```bash
npm test
npm run build
git diff --check
```

Expected: all tests, TypeScript, Vite, and whitespace checks pass.

- [ ] **Step 2: Run responsive visual checks**

At desktop and mobile widths verify compact Setup, keyboard-selectable occasion cards, participant sorting, two-column and one-column activity layouts, Clear all, later activity details, Poster size in Design, rich rules without visible markers, sparse-board text growth without overflow, and the historical preset.

- [ ] **Step 3: Protect the dirty website checkout**

Create a temporary clone from current remote main. Do not edit the existing dirty website checkout. Replace only the temporary clone's `projects/gameboard/` with the new `dist/` contents. Inspect the diff and ensure no other project or website file changed.

```bash
site_publish_dir=$(mktemp -d /private/tmp/gameboard-site.XXXXXX)
git clone https://github.com/jessecmaddox3/jessemaddox.com.git "$site_publish_dir"
```

- [ ] **Step 4: Publish the exact generated path**

From the temporary clone, run the link checker and whitespace check, stage only `projects/gameboard` plus `PAGES.md` if its description changed, commit, rebase on the latest remote main, recheck the path diff, and push.

- [ ] **Step 5: Verify production**

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://jessemaddox.com/gameboard
```

Expected: `200`. Confirm the live index references the new asset hashes and perform one mobile-width smoke check.

## Plan Self-Review

- **Spec coverage:** Tasks 1 through 5 cover defaults, setup, occasion flair, ordering, selection, later customization, poster size, rules, and adaptive typography. Task 6 covers responsive inspection and isolated publishing.
- **Type consistency:** Draft and BoardSpec use `rulesTitle` plus `rulesContent`; portrait and landscape use the same parser.
- **Safety:** Source edits preserve unrelated dirty work. Deployment uses a temporary clone and replaces only `projects/gameboard`.
- **Scope:** Accounts, cloud save, automatic occasion clearing, and unrelated challenge mechanics remain excluded.
