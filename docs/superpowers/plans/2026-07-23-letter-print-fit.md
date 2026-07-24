# US Letter Print Fit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the portrait 8.5 × 11 inch board fit more activities through compact Letter layout controls, combined scoring, and solver-driven capacity guidance.

**Architecture:** Add two backward-compatible BoardSpec fields, then route portrait rendering through one measured layout planner that owns header height, dynamic Letter rules height, compact-headline feasibility, and grid geometry. Add a pure capacity analyzer that reuses that planner and `solveGrid`, then expose its derived result through the existing debounced `useBoard` state to Preview, Design, and Activities.

**Tech Stack:** TypeScript 5.7, React 19, Zustand 5, Zod 3, Vitest 4, opentype.js font metrics, SVG/PDF scene rendering.

## Global Constraints

- Keep the exact Letter page at 8.5 × 11 inches and preserve the current 0.5-inch content margin.
- Keep every printable primitive at least 0.25 inches from the Letter page edge.
- `letterHeaderStyle` defaults to `'large'`; `includeRules` defaults to `true`.
- Compact Header is exactly 0.65 inches high.
- Compact title sizing is 28 points down to a 12-point floor in 0.5-point steps.
- Compact secondary sizing is 14 points down to an 8-point floor, separated from the title by 0.18 inches.
- Dynamic Letter rules search is 0.75 through 2.5 inches in 0.05-inch steps and requires rules text of at least 8 points.
- Capacity estimates use the real portrait planner and `solveGrid`; no parallel fit formula is allowed.
- Capacity advice never makes a board infeasible. Only the authoritative headline, rules, or grid planner can block export.
- Combined `POINTS (MAX)` display applies only to portrait Letter; large portrait and historical landscape output remain unchanged.
- Do not reduce font floors, silently omit text, automatically switch settings, or automatically remove content.
- Preserve edited rules while `includeRules` is false.
- Preserve existing unrelated working-tree changes. Stage only files belonging to this release.
- The local Git index is known to lag the remote release. Commit steps are conditional on first confirming that Git metadata has been safely aligned without rewriting the worktree.

---

## File Structure

The release creates two focused engine modules and modifies existing model, layout, scene, state, and UI boundaries:

- `src/engine/layout/portraitPlan.ts`: authoritative measured portrait region, rules, and compact-headline planning.
- `src/engine/layout/capacity.ts`: pure Letter activity-capacity probes using `portraitPlan` and `solveGrid`.
- `src/app/letterFit.ts`: shared ready and overloaded Letter-capacity copy.
- `src/models/boardSpec.ts`: persisted schema fields.
- `src/store/toBoardSpec.ts`: Draft fields and defaults.
- `src/store/wizardStore.ts`: older-draft normalization through existing defaults.
- `src/engine/layout/regions.ts`: explicit measured header/rules height inputs.
- `src/engine/layout/gridSolver.ts`: Letter-only combined scoring width and header needs.
- `src/engine/scene/compose.ts`: compact headline and combined scoring primitives.
- `src/engine/buildBoard.ts`: consume the portrait plan and apply rule visibility to landscape.
- `src/engine/index.ts`: export fit types needed by the app.
- `src/app/useBoard.ts`: calculate fit once per debounced validated draft.
- `src/app/App.tsx`: pass fit guidance to Activities.
- `src/app/Preview.tsx`: ready and overloaded fit guidance.
- `src/app/steps/ActivitiesStep.tsx`: show fit after Letter has been selected.
- `src/app/steps/DesignStep.tsx`: Letter controls, printed-rules control, corner-box conflict, and Letter tint behavior.
- `src/index.css`: Letter panel, fit guidance, and excluded-rules states.
- Focused tests in `tests/engine`, `tests/store`, and `tests/app`.

---

### Task 1: Persist Letter Layout Choices Safely

**Files:**
- Modify: `src/models/boardSpec.ts`
- Modify: `src/store/toBoardSpec.ts`
- Modify: `tests/engine/boardSpec.test.ts`
- Modify: `tests/store/wizardStore.test.ts`

**Interfaces:**
- Consumes: existing `boardSpecSchema`, `Draft`, `defaultDraft()`, and `normalizeDraft()`.
- Produces: `BoardSpec['letterHeaderStyle']`, `BoardSpec['includeRules']`, and matching required Draft properties.

- [ ] **Step 1: Write failing schema and normalization tests**

Add assertions equivalent to:

```ts
it('defaults older specs to the established Letter presentation', () => {
  const spec = makeSpec();
  expect(spec.letterHeaderStyle).toBe('large');
  expect(spec.includeRules).toBe(true);
});
```

Extend the legacy persisted-draft test:

```ts
delete legacy.letterHeaderStyle;
delete legacy.includeRules;
// rehydrate...
expect(draft.letterHeaderStyle).toBe('large');
expect(draft.includeRules).toBe(true);
```

- [ ] **Step 2: Run the focused tests and confirm RED**

Run:

```bash
npx vitest run tests/engine/boardSpec.test.ts tests/store/wizardStore.test.ts
```

Expected: failures because the two fields do not exist.

- [ ] **Step 3: Add the schema, Draft, and defaults**

Add to `boardSpecSchema`:

```ts
letterHeaderStyle: z.enum(['large', 'compact']).default('large'),
includeRules: z.boolean().default(true),
```

Add required properties to `Draft`:

```ts
letterHeaderStyle: BoardSpec['letterHeaderStyle'];
includeRules: boolean;
```

Add to `defaultDraft()`:

```ts
letterHeaderStyle: 'large',
includeRules: true,
```

Do not add special migration code. `normalizeDraft()` already merges `defaultDraft()` before restoring older snapshots.

- [ ] **Step 4: Run focused tests and confirm GREEN**

Run the same Vitest command.

Expected: both files pass.

- [ ] **Step 5: Commit if Git metadata is aligned**

```bash
git add src/models/boardSpec.ts src/store/toBoardSpec.ts tests/engine/boardSpec.test.ts tests/store/wizardStore.test.ts
git commit -m "feat: persist Letter print layout choices"
```

---

### Task 2: Create the Authoritative Portrait Planner and Dynamic Letter Rules

**Files:**
- Create: `src/engine/layout/portraitPlan.ts`
- Modify: `src/engine/layout/regions.ts`
- Modify: `src/engine/buildBoard.ts`
- Modify: `tests/engine/regions.test.ts`
- Modify: `tests/engine/letter.test.ts`

**Interfaces:**
- Consumes: `partitionRegions`, `planRules`, `solveGrid`, `BoardSpec`, and `FontMetrics`.
- Produces:

```ts
export type PortraitPlan =
  | {
      ok: true;
      regions: Regions;
      rulesPlan?: RulesPlan;
    }
  | { ok: false; reason: string; kind: 'compact-header' | 'rules' };

export function planPortrait(spec: BoardSpec, metrics: FontMetrics): PortraitPlan;
```

- [ ] **Step 1: Write failing region and rules-height tests**

Cover these exact behaviors:

```ts
expect(partitionRegions(spec, { headerH: 0.65, rulesH: 0 }).header.h).toBe(0.65);
expect(partitionRegions(spec, { headerH: 0.65, rulesH: 0 }).rules).toBeUndefined();
```

Add Letter integration tests asserting:

```ts
const hidden = buildBoard(kidsWeekend({ includeRules: false }), m);
expect(hidden.ok).toBe(true);
expect(texts(hidden.scene)).not.toContain('GAME RULES:');

const short = planPortrait(kidsWeekend({
  rulesContent: '**PLAY FAIR**\nScore honestly.',
}), m);
const long = planPortrait(kidsWeekend(), m);
expect(short.ok && long.ok).toBe(true);
if (short.ok && long.ok) expect(short.regions.rules!.h).toBeLessThan(long.regions.rules!.h);
```

Add a rules-overflow test that expects a rules-specific error after the 2.5-inch bound.

- [ ] **Step 2: Run focused tests and confirm RED**

```bash
npx vitest run tests/engine/regions.test.ts tests/engine/letter.test.ts
```

Expected: missing overload, missing planner, and unchanged fixed rules band.

- [ ] **Step 3: Add explicit region dimensions**

Change `partitionRegions` to:

```ts
export interface RegionDimensions {
  headerH?: number;
  rulesH?: number;
}

export function partitionRegions(spec: BoardSpec, dimensions: RegionDimensions = {}): Regions {
  // existing page and content calculation
  const headerH = dimensions.headerH ?? clamp(pageH * 0.11, 1.1, 6);
  const hasRules = spec.includeRules
    && Boolean(spec.rulesContent.trim() || spec.rules.length > 0 || spec.footnote);
  const defaultRulesH = hasRules ? clamp(pageH * 0.07, 1.5, 4) : 0;
  const rulesH = hasRules ? (dimensions.rulesH ?? defaultRulesH) : 0;
  // existing geometry
}
```

An explicit `rulesH: 0` must omit the region even when rules content is retained.

- [ ] **Step 4: Implement measured Letter rules planning**

Create named constants and planner logic:

```ts
export const COMPACT_HEADER_H = 0.65;
export const LETTER_RULES_MIN_H = 0.75;
export const LETTER_RULES_MAX_H = 2.5;
export const LETTER_RULES_STEP_H = 0.05;
export const LETTER_RULES_TARGET_PT = 8;

function hasPrintedRules(spec: BoardSpec): boolean {
  return spec.includeRules
    && Boolean(spec.rulesContent.trim() || spec.rules.length > 0 || spec.footnote);
}

export function planPortrait(spec: BoardSpec, metrics: FontMetrics): PortraitPlan {
  const headerH = spec.posterSize === '8.5x11' && spec.letterHeaderStyle === 'compact'
    ? COMPACT_HEADER_H
    : undefined;

  if (!hasPrintedRules(spec)) {
    return { ok: true, regions: partitionRegions(spec, { headerH, rulesH: 0 }) };
  }

  if (spec.posterSize !== '8.5x11') {
    const regions = partitionRegions(spec, { headerH });
    const rulesPlan = regions.rules ? planRules(spec, regions.rules, metrics) : undefined;
    return rulesPlan
      ? { ok: true, regions, rulesPlan }
      : { ok: false, kind: 'rules', reason: `The rules do not fit legibly on a ${spec.posterSize} poster. Choose a larger size or shorten the rules.` };
  }

  for (let h = LETTER_RULES_MIN_H; h <= LETTER_RULES_MAX_H + 1e-9; h += LETTER_RULES_STEP_H) {
    const regions = partitionRegions(spec, { headerH, rulesH: Number(h.toFixed(2)) });
    const rulesPlan = regions.rules ? planRules(spec, regions.rules, metrics) : undefined;
    if (rulesPlan && rulesPlan.pt >= LETTER_RULES_TARGET_PT) {
      return { ok: true, regions, rulesPlan };
    }
  }

  return {
    ok: false,
    kind: 'rules',
    reason: 'The rules do not fit at a readable size on this Letter sheet. Shorten them or turn off Include rules on printout.',
  };
}
```

- [ ] **Step 5: Route portrait builds through the planner**

In `buildBoard`, replace direct region/rules planning with:

```ts
const portrait = planPortrait(spec, m);
if (!portrait.ok) return { ok: false, reason: portrait.reason };
const solved = solveGrid(portrait.regions.grid, spec, m);
if (!solved.feasible) return { ok: false, reason: solved.reason };
return {
  ok: true,
  scene: composeScene(spec, portrait.regions, solved, m, portrait.rulesPlan),
  quality: gradeLayout(solved, spec),
};
```

For landscape, pass a display-only copy with empty rule fields when `includeRules` is false:

```ts
const landscapeSpec = spec.includeRules
  ? spec
  : { ...spec, rulesContent: '', rules: [], footnote: undefined };
```

- [ ] **Step 6: Run focused tests and confirm GREEN**

Run the Task 2 test command.

Expected: dynamic rules and visibility tests pass, existing region tests stay green.

- [ ] **Step 7: Commit if Git metadata is aligned**

```bash
git add src/engine/layout/portraitPlan.ts src/engine/layout/regions.ts src/engine/buildBoard.ts tests/engine/regions.test.ts tests/engine/letter.test.ts
git commit -m "feat: plan Letter rules by measured content"
```

---

### Task 3: Add Compact Header Planning and Rendering

**Files:**
- Modify: `src/engine/layout/portraitPlan.ts`
- Modify: `src/engine/scene/compose.ts`
- Modify: `tests/engine/letter.test.ts`
- Modify: `tests/engine/compose.test.ts`

**Interfaces:**
- Consumes: `COMPACT_HEADER_H`, `FontMetrics`, title, honoree, subtitle, and theme colors.
- Produces:

```ts
export interface CompactHeaderPlan {
  titlePt: number;
  secondaryPt?: number;
  secondary: string;
  titleW: number;
  secondaryW: number;
  gapW: number;
}
```

Task 3 extends the successful `PortraitPlan` variant with
`compactHeader?: CompactHeaderPlan` and extends `composeScene` with the same
optional plan argument.

- [ ] **Step 1: Write failing compact-header tests**

Add tests for:

```ts
const built = buildBoard(kidsWeekend({
  letterHeaderStyle: 'compact',
  title: 'CAMP SHEISHEI',
  subtitle: 'KIDS WEEKEND',
}), m);
expect(built.ok).toBe(true);
// title and subtitle share the same vertical band
expect(titleRun.box.y).toBeCloseTo(subtitleRun.box.y, 2);
expect(partitionedHeaderHeight).toBe(0.65);
expect(overflowingRuns(built.scene, m)).toEqual([]);
```

Also cover:

- honoree plus subtitle renders secondary text as `HONOREE · SUBTITLE`;
- an overlong compact headline fails with `shorten` or `Large Header`;
- Compact Header plus corner boxes fails with a specific reason;
- Large Header retains vertically separate title and subtitle behavior.

- [ ] **Step 2: Run focused tests and confirm RED**

```bash
npx vitest run tests/engine/letter.test.ts tests/engine/compose.test.ts
```

Expected: compact title still uses the old stacked composer and conflicts are accepted.

- [ ] **Step 3: Implement compact-headline measurement**

Add constants:

```ts
const COMPACT_TITLE_MAX_PT = 28;
const COMPACT_TITLE_MIN_PT = 12;
const COMPACT_SECONDARY_MAX_PT = 14;
const COMPACT_SECONDARY_MIN_PT = 8;
const COMPACT_HEADLINE_GAP = 0.18;
```

Build the secondary string:

```ts
const secondary = [spec.honoree, spec.subtitle].filter(Boolean).join(' · ');
```

Walk the title ladder by 0.5 points. Scale secondary size linearly between its maximum and floor, measure both strings, and accept the first pair whose total width plus gap fits 90 percent of the Letter content width and whose line heights fit the 0.65-inch band. Return the sizes and measured widths. Return a compact-header failure if no pair fits.

Before measurement, reject `spec.cornerBoxes.length > 0` with:

```ts
'Compact Header cannot be used with corner boxes. Remove the boxes or select Large Header.'
```

- [ ] **Step 4: Render the planned compact headline**

Extend `composeScene` with the optional `CompactHeaderPlan`. In `composeHeader`, branch only when the plan exists:

```ts
const totalW = plan.titleW + (plan.secondary ? plan.gapW + plan.secondaryW : 0);
const startX = h.x + (h.w - totalW) / 2;
const titleLineH = m.lineHeightIn('display', plan.titlePt);
// push centered-vertically title run at startX
// push centered-vertically bodyBold secondary run after titleW + gapW
```

Retain the existing divider and existing Large Header code unchanged.

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run the Task 3 test command.

Expected: compact, legacy-honoree, failure, conflict, and existing large-header tests pass.

- [ ] **Step 6: Commit if Git metadata is aligned**

```bash
git add src/engine/layout/portraitPlan.ts src/engine/scene/compose.ts tests/engine/letter.test.ts tests/engine/compose.test.ts
git commit -m "feat: add measured compact Letter header"
```

---

### Task 4: Merge Points and Maximum Points on Letter

**Files:**
- Create: `src/engine/layout/scoring.ts`
- Modify: `src/engine/layout/gridSolver.ts`
- Modify: `src/engine/scene/compose.ts`
- Modify: `tests/engine/gridSolver.test.ts`
- Modify: `tests/engine/compose.test.ts`
- Modify: `tests/engine/letter.test.ts`

**Interfaces:**
- Produces:

```ts
export const LETTER_MAX_POINTS_RATIO = 0.65;
export function usesCombinedLetterScoring(spec: BoardSpec): boolean;
export function measureCombinedScoreWidth(
  activity: Activity,
  rangeFormat: BoardSpec['pointsRangeFormat'],
  primaryPt: number,
  metrics: FontMetrics,
): number;
```

- [ ] **Step 1: Write failing solver and scene tests**

Create a Letter fixture with:

```ts
activities: [
  { name: 'Repeatable game', points: 3, maxPoints: 6 },
  { name: 'Range game', points: { min: 1, max: 5 }, maxPoints: 10 },
  { name: 'Pending game', points: 'TBD' },
  // minimum five rows
]
```

Assert:

- `maxPointsColW === 0` on Letter;
- Letter primitives include `POINTS`, `(MAX)`, `3`, and `(6)`;
- `(6)` is smaller than `3`;
- large portrait still includes `POSSIBLE POINTS` and `MAX POINTS`;
- all text stays within boxes and the page.

- [ ] **Step 2: Run focused tests and confirm RED**

```bash
npx vitest run tests/engine/gridSolver.test.ts tests/engine/compose.test.ts tests/engine/letter.test.ts
```

Expected: Letter still reserves and renders a separate max-points column.

- [ ] **Step 3: Implement scoring measurement**

Use:

```ts
export function usesCombinedLetterScoring(spec: BoardSpec): boolean {
  return spec.template === 'portrait' && spec.posterSize === '8.5x11';
}
```

The combined width is:

```ts
primaryWidth
  + (maxPoints === undefined ? 0 : 0.04 + parentheticalWidthAt65Percent)
  + 2 * CELL_PAD
```

Update `tryFit` so Letter's `pointsColW` includes combined activity widths, `maxPointsColW` is zero, and the rotated header-band need measures `POINTS` rather than `POSSIBLE POINTS`. Leave the existing large-poster branch intact.

- [ ] **Step 4: Render inline primary and parenthetical runs**

On Letter:

- render the main value and optional `(${maxPoints})` as separately sized runs centered as one measured group;
- use `bodyBold` for both;
- vertically center both on the same baseline band;
- render the scoring header as `POINTS` and `(MAX)`;
- retain `pointsColTint` for the combined strip.

On non-Letter output, retain the current two-column code byte-for-byte.

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run the Task 4 test command.

Expected: combined Letter scoring and unchanged larger-poster tests pass.

- [ ] **Step 6: Commit if Git metadata is aligned**

```bash
git add src/engine/layout/scoring.ts src/engine/layout/gridSolver.ts src/engine/scene/compose.ts tests/engine/gridSolver.test.ts tests/engine/compose.test.ts tests/engine/letter.test.ts
git commit -m "feat: combine Letter scoring columns"
```

---

### Task 5: Add Solver-Driven Letter Capacity Analysis

**Files:**
- Create: `src/engine/layout/capacity.ts`
- Modify: `src/engine/index.ts`
- Create: `tests/engine/capacity.test.ts`

**Interfaces:**
- Consumes: `planPortrait(spec, metrics)`, `solveGrid`, `BoardSpec`, `pointsLabel`, and actual font metrics.
- Produces:

```ts
export interface LetterFit {
  selectedActivities: number;
  estimatedMaxActivities: number;
  estimatedAdditionalActivities: number;
  overBy: number;
}

export function estimateLetterCapacity(
  spec: BoardSpec,
  metrics: FontMetrics,
): LetterFit | undefined;
```

- [ ] **Step 1: Write failing capacity tests**

Cover:

```ts
expect(estimateLetterCapacity(makeSpec({ posterSize: '24x36' }), m)).toBeUndefined();

const fit = estimateLetterCapacity(kidsWeekend(), m)!;
expect(fit.selectedActivities).toBe(10);
expect(fit.estimatedMaxActivities).toBeGreaterThanOrEqual(10);
expect(fit.estimatedAdditionalActivities)
  .toBe(fit.estimatedMaxActivities - fit.selectedActivities);
```

Add exact monotonic probe assertions for every count from 5 to 80. Add comparisons proving:

- Compact Header capacity is at least Large Header capacity;
- rules-off capacity is greater than rules-on capacity for the kids fixture;
- very long rules lower capacity or return no capacity because rules themselves fail;
- actual current build status, not the estimate, controls feasibility.

- [ ] **Step 2: Run the new test and confirm RED**

```bash
npx vitest run tests/engine/capacity.test.ts
```

Expected: module not found.

- [ ] **Step 3: Implement the representative activity**

Prepare displayed activity names using the same `allCaps` rule as `buildBoard`. Select:

- the name with the greatest 9-point `body` width;
- the points value with the greatest 9-point displayed `bodyBold` width;
- the maximum value with the greatest 5.85-point parenthetical width.

Combine those into one schema-valid representative:

```ts
const representative: Activity = {
  name: widestName.name,
  points: widestPoints.points,
  ...(widestMax ? { maxPoints: widestMax.maxPoints } : {}),
  bonus: false,
};
```

- [ ] **Step 4: Implement bounded monotonic probing**

Call `planPortrait` once. If it fails or the board is not portrait Letter, return `undefined`. For a candidate count, call:

```ts
solveGrid(
  portrait.regions.grid,
  { ...displaySpec, activities: Array.from({ length: count }, () => representative) },
  metrics,
).feasible
```

Binary-search 5 through 80 for the last feasible count. In development and tests, verify adjacent monotonicity. If a non-monotonic result is observed, scan 5 through 80 linearly and use the greatest feasible prefix.

If the composite estimate is below the selected activity count, solve the real selected activity set once. When that authoritative current grid is feasible, use the selected count as the estimate's lower bound. This prevents the conservative future-row probe from telling a currently printable heterogeneous board to remove activities.

Return:

```ts
{
  selectedActivities,
  estimatedMaxActivities,
  estimatedAdditionalActivities: Math.max(0, max - selectedActivities),
  overBy: Math.max(0, selectedActivities - max),
}
```

- [ ] **Step 5: Run capacity tests and confirm GREEN**

Run the Task 5 test command.

Expected: all capacity tests pass in under two seconds.

- [ ] **Step 6: Commit if Git metadata is aligned**

```bash
git add src/engine/layout/capacity.ts src/engine/index.ts tests/engine/capacity.test.ts
git commit -m "feat: estimate Letter capacity with the real solver"
```

---

### Task 6: Expose Letter Controls and Fit Guidance

**Files:**
- Create: `src/app/letterFit.ts`
- Modify: `src/app/useBoard.ts`
- Modify: `src/app/App.tsx`
- Modify: `src/app/Preview.tsx`
- Modify: `src/app/steps/ActivitiesStep.tsx`
- Modify: `src/app/steps/DesignStep.tsx`
- Modify: `src/index.css`
- Modify: `tests/app/useBoard.test.ts`
- Modify: `tests/app/steps.test.tsx`
- Modify: `tests/app/appSmoke.test.tsx`

**Interfaces:**
- Consumes: `LetterFit` and `estimateLetterCapacity`.
- Produces BoardState ready/infeasible variants with optional `fit?: LetterFit`.

- [ ] **Step 1: Write failing hook and UI tests**

Add hook assertions:

```ts
const letter = makeDraft({ posterSize: '8.5x11' });
// render hook and await ready
expect(result.current.fit?.estimatedMaxActivities).toBeGreaterThanOrEqual(letter.activities.length);
```

Add Design tests that assert:

- Letter Header controls appear only for portrait Letter;
- Large is initially selected and Compact updates the store;
- Include rules is initially checked and toggling it does not alter `rulesContent`;
- Compact is disabled when corner boxes exist;
- Add Corner Box is disabled while Compact is selected;
- the separate Max points tint control is absent on Letter and returns after switching to a poster.

Add Preview and Activities tests for both ready copy and overloaded copy.

- [ ] **Step 2: Run focused app tests and confirm RED**

```bash
npx vitest run tests/app/useBoard.test.ts tests/app/steps.test.tsx tests/app/appSmoke.test.tsx
```

Expected: missing controls and missing `fit` state.

- [ ] **Step 3: Add fit to the debounced board state**

Extend state:

```ts
type WithFit = { fit?: LetterFit };

export type BoardState =
  | { status: 'loading' }
  | { status: 'invalid'; errors: FieldError[] }
  | ({ status: 'infeasible'; reason: string } & WithFit)
  | ({ status: 'ready'; svg: string; quality: QualityReport } & WithFit);
```

After validation and within the existing debounce, calculate capacity once:

```ts
const fit = estimateLetterCapacity(validated.spec, metrics);
const built = buildBoard(validated.spec, metrics);
```

Attach `fit` to ready and infeasible states. Invalid drafts receive no fit.

- [ ] **Step 4: Add the Design controls**

Render a Letter Layout panel after Poster size when:

```ts
draft.template === 'portrait' && draft.posterSize === '8.5x11'
```

Use an accessible radio group for Large Header and Compact Header. Disable Compact when `cornerBoxes.length > 0`.

Add the printed-rules checkbox at the top of Rules:

```tsx
<input
  id="includeRules"
  type="checkbox"
  checked={draft.includeRules}
  onChange={(event) => patch({ includeRules: event.target.checked })}
/>
```

Keep the rules editor enabled and add `Saved, not included on the printout` when false.

Filter `maxPointsColTint` from `COLOR_FIELDS` only while Letter is selected. Do not clear its stored value.

Disable Add Corner Box while Compact Header is active and show `Choose Large Header to add corner boxes.`

- [ ] **Step 5: Render shared fit copy**

Create `src/app/letterFit.ts` with one formatter:

```ts
export function letterFitMessage(fit: LetterFit): string {
  if (fit.overBy > 0) {
    return `${fit.selectedActivities} activities selected. About ${fit.estimatedMaxActivities} fit with the current Letter layout. Remove about ${fit.overBy}, choose Compact Header, or hide the rules.`;
  }
  if (fit.estimatedAdditionalActivities === 0) {
    return `${fit.selectedActivities} selected. This Letter layout is approximately full.`;
  }
  return `${fit.selectedActivities} selected. About ${fit.estimatedAdditionalActivities} more activities fit with the current Letter layout.`;
}
```

Use it in Preview and the Letter Layout panel. Pass `board.fit` from App to Activities and show a shorter version beside the selected count only when fit exists.

- [ ] **Step 6: Add focused styles**

Add CSS for:

- `.letter-layout-panel`;
- `.letter-header-options`;
- `.letter-fit-guidance`;
- `.rules-excluded-note`;
- disabled-control explanatory copy.

Reuse existing colors, borders, radii, and typography variables. Do not add new hardcoded colors.

- [ ] **Step 7: Run focused app tests and confirm GREEN**

Run the Task 6 test command.

Expected: hook, control, rules preservation, fit-copy, and smoke tests pass.

- [ ] **Step 8: Commit if Git metadata is aligned**

```bash
git add src/app/letterFit.ts src/app/useBoard.ts src/app/App.tsx src/app/Preview.tsx src/app/steps/ActivitiesStep.tsx src/app/steps/DesignStep.tsx src/index.css tests/app/useBoard.test.ts tests/app/steps.test.tsx tests/app/appSmoke.test.tsx
git commit -m "feat: add Letter fit controls and guidance"
```

---

### Task 7: Full Verification, Independent Review, and Release

**Files:**
- Modify only if verification exposes a confirmed defect.
- Update: `HANDOFF.md` only if the release cannot be completed or a genuine cross-tool handoff is needed.

**Interfaces:**
- Consumes the complete release.
- Produces a verified production build and, if repository metadata and site state are safe, a live deployment.

- [ ] **Step 1: Run all automated gates**

```bash
git diff --check
npm test
npx tsc --noEmit
npm run build
```

Expected: every test passes, typecheck exits zero, and Vite produces `dist` with only the known large-chunk warning.

- [ ] **Step 2: Run the measured Camp SheiShei matrix**

Use the five-player kids fixture to record ready status, body type, and estimated capacity for:

- Large Header with rules;
- Compact Header with rules;
- Large Header without rules;
- Compact Header without rules.

Expected ordering:

```text
compact-with-rules >= large-with-rules
large-without-rules > large-with-rules
compact-without-rules >= large-without-rules
```

For the conservative moderately-long-name fixture, the verified capacities are approximately 13, 15, 16, and 17 activities in the order listed above. Tests assert ordering and legibility rather than brittle exact counts.

- [ ] **Step 3: Inspect generated Letter output**

Build a capped row containing `3 (6)`, render SVG, and export PDF. Confirm:

- title and subtitle share the compact band;
- `(6)` is smaller and on the same baseline as `3`;
- rules are absent when excluded and return unchanged when included;
- no content crosses the 0.25-inch safe zone;
- PDF page size is 612 × 792 points.

- [ ] **Step 4: Request a read-only Claude implementation review**

Run:

```bash
~/.local/bin/claude-review "Review the US Letter fit implementation against docs/superpowers/specs/2026-07-23-letter-print-fit-design.md. Focus on solver/render consistency, false capacity precision, rules preservation, compact-header overflow, non-Letter regressions, and missing tests. Do not edit."
```

Evaluate every finding against the code and tests. Fix confirmed defects with focused failing tests. Do not add optional scope without user value.

- [ ] **Step 5: Re-run all gates after review fixes**

Run the Step 1 commands again.

Expected: all green.

- [ ] **Step 6: Save source work only if Git metadata is safe**

First compare local HEAD and `origin/main` without rewriting the worktree. If the stale-index condition in `HANDOFF.md` remains, do not commit duplicate prior release files. Report the exact metadata blocker. If aligned, stage only this plan, spec, and release files, then commit and push a coherent verified unit.

- [ ] **Step 7: Publish the verified build if site state is safe**

Read `/Users/jesse/claude/jessemaddox.com/HANDOFF.md` first. Build with:

```bash
npx vite build --base=/projects/gameboard/
```

Copy only the resulting `dist/` contents to `/Users/jesse/claude/jessemaddox.com/projects/gameboard/`, stage only that site path, follow the site handoff's current deployment procedure, and never run a bare site-repo push while unrelated site work is present.

- [ ] **Step 8: Verify production**

Fetch `/gameboard`, follow its current JS asset path, and confirm the live bundle contains `Compact Header`, `Include rules on printout`, and the Letter fit copy. Confirm live HTML retains `noindex, nofollow`.
