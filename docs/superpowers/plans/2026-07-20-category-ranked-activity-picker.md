# Category-Ranked Activity Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a compact, category-ranked activity picker with radio-card occasion selection, reusable ideas, explicit customization, and local custom activities.

**Architecture:** Extend the catalog data with primary occasion and browse-tag metadata, then put safety, relevance, and grouping rules in a focused `activityBrowse.ts` module. Keep `SetupStep` responsible for occasion and saved-board choice, and keep `ActivitiesStep` responsible for browsing, selection, custom idea creation, and the explicit selected-item editor.

**Tech Stack:** React 19, TypeScript 5.7, Zustand 5, Vitest 4, Testing Library, CSS.

## Global Constraints

- Keep every safe catalog idea discoverable from every occasion.
- Hide adult-only and drinking ideas from Kids weekend.
- Show adult-only ideas for Family reunion only when explicitly tagged for Family reunion.
- Display no more than eight rows per category until the user expands it.
- Keep customization out of the DOM until the user explicitly opens it.
- Custom ideas stay in the current Zustand draft and browser storage only.
- Preserve the existing 80-activity selection limit and 90-character activity-name limit.
- Use native radio inputs for occasion selection and native checkboxes for activity selection.
- Do not add a backend or central custom-idea collection.
- Do not use em dashes in user-facing copy or documentation.
- The source repository `.git` directory is read-only in the current sandbox. Run commit steps only when git metadata is writable; deploy the verified build through the website repository according to `HANDOFF.md`.

---

## File Map

- Create `src/content/activityBrowse.ts`: category order, safety policy, relevance scoring, and duplicate-free grouping.
- Modify `src/content/activities.ts`: catalog metadata, canonical additions, duplicate exclusions, labels, and recommended sets.
- Modify `src/content/activitySeeds.ts`: approved copy and safety revisions.
- Modify `src/app/steps/SetupStep.tsx`: radio-card occasion choice and adjacent saved-board loader.
- Modify `src/app/steps/ActivitiesStep.tsx`: grouped compact browser, expansion, custom form, and explicit editor mode.
- Modify `src/index.css`: occasion cards, compact groups, custom form, editor layout, and responsive behavior.
- Modify `tests/content/content.test.ts`: catalog model, grouping, safety, deduplication, copy, and recommended-set coverage.
- Modify `tests/app/steps.test.tsx`: Setup and Activities interaction coverage.

---

### Task 1: Catalog Browse Model and Canonical Content

**Files:**
- Create: `src/content/activityBrowse.ts`
- Modify: `src/content/activities.ts`
- Modify: `src/content/activitySeeds.ts`
- Test: `tests/content/content.test.ts`

**Interfaces:**
- Produces: `ActivityBrowseCategory = ActivityCategory | 'kids'`.
- Produces: `PresetActivity.primaryOccasion?: ActivityOccasion` and `PresetActivity.browseTags?: readonly ActivityBrowseCategory[]`.
- Produces: `ACTIVITY_BROWSE_CATEGORY_LABELS: Record<ActivityBrowseCategory, string>`.
- Produces: `ACTIVITY_CATEGORY_ORDER: Record<ActivityOccasion, readonly ActivityBrowseCategory[]>`.
- Produces: `isActivitySafeForOccasion(activity: PresetActivity, occasion: ActivityOccasion): boolean`.
- Produces: `activityRelevance(activity: PresetActivity, occasion: ActivityOccasion): number`.
- Produces: `groupActivitiesForOccasion(activities: readonly PresetActivity[], occasion: ActivityOccasion): ActivityBrowseGroup[]`.

- [ ] **Step 1: Write failing catalog behavior tests**

Add imports for the new browse module and tests that assert the exact category prefixes, safety policy, stable relevance order, Family Kids grouping without duplicate IDs, revised titles, removed duplicate seed IDs, and one or two canonical IDs in every recommended set.

```ts
expect(ACTIVITY_CATEGORY_ORDER.bachelor.slice(0, 5)).toEqual([
  'drinking', 'movement', 'sports', 'games', 'social',
]);
expect(ACTIVITY_CATEGORY_ORDER['family-reunion'][0]).toBe('kids');

const groups = groupActivitiesForOccasion(ACTIVITY_LIBRARY, 'family-reunion');
expect(groups[0]?.category).toBe('kids');
const groupedIds = groups.flatMap((group) => group.activities.map((item) => item.id));
expect(new Set(groupedIds).size).toBe(groupedIds.length);
expect(groups[0]?.activities.some((item) => item.id === 'kid-teaches-game')).toBe(true);

expect(isActivitySafeForOccasion(
  ACTIVITY_LIBRARY.find((item) => item.id === 'house-drink')!,
  'kids-weekend',
)).toBe(false);
expect(ACTIVITY_LIBRARY.find((item) => item.id === 'bch-best-man-story')?.name)
  .toBe('Share a Favorite Groom Story');

for (const removedId of ['bch-cornhole-champ', 'fri-cornhole-champ', 'fri-blind-taste', 'fri-karaoke-song']) {
  expect(ACTIVITY_LIBRARY.some((item) => item.id === removedId)).toBe(false);
}
for (const occasion of ACTIVITY_OCCASIONS) {
  const canonicalCount = RECOMMENDED_ACTIVITY_IDS[occasion]
    .filter((id) => !/^(bch|bte|kid|ann|fam|fri|sea|gen)-/.test(id)).length;
  expect(canonicalCount).toBeGreaterThanOrEqual(1);
}
```

- [ ] **Step 2: Run the content tests and verify the new assertions fail**

Run: `npm test -- tests/content/content.test.ts`

Expected: FAIL because the browse metadata and helper functions do not exist and old copy and duplicate rows remain.

- [ ] **Step 3: Extend the catalog types and labels**

Add these exact fields and labels in `src/content/activities.ts`:

```ts
export type ActivityBrowseCategory = ActivityCategory | 'kids';

export const ACTIVITY_BROWSE_CATEGORY_LABELS: Record<ActivityBrowseCategory, string> = {
  ...ACTIVITY_CATEGORY_LABELS,
  kids: 'Kids',
};

export interface PresetActivity {
  // existing fields remain
  primaryOccasion?: ActivityOccasion;
  browseTags?: readonly ActivityBrowseCategory[];
}
```

Change the `movement` label to `Physical challenges`. Extend the `a()` options type to include `primaryOccasion` and `browseTags`.

- [ ] **Step 4: Implement browse ordering, safety, and grouping**

Create `src/content/activityBrowse.ts` with the exact occasion orders from the design spec. Use these rules:

```ts
export function isActivitySafeForOccasion(activity: PresetActivity, occasion: ActivityOccasion) {
  if (occasion === 'kids-weekend') return !activity.adultOnly && activity.category !== 'drinking';
  if (occasion === 'family-reunion' && (activity.adultOnly || activity.category === 'drinking')) {
    return activity.occasions.includes('family-reunion');
  }
  return true;
}

export function activityRelevance(activity: PresetActivity, occasion: ActivityOccasion) {
  if (activity.primaryOccasion === occasion) return 0;
  if (activity.occasions.includes(occasion)) return 1;
  if (!activity.primaryOccasion || activity.occasions.length >= 4) return 2;
  return 3;
}
```

`groupActivitiesForOccasion` must filter unsafe rows, sort by relevance, difficulty (`easy`, `stretch`, `quest`), then name, and assign each row to the first matching category in the occasion order. Its output type is:

```ts
export interface ActivityBrowseGroup {
  category: ActivityBrowseCategory;
  label: string;
  activities: PresetActivity[];
}
```

- [ ] **Step 5: Consolidate generic seed duplicates and add canonical ideas**

Exclude generic duplicate seed IDs through an explicit `Set` before mapping seeds into the library. Consolidate at least cornhole, generic sunrise, generic blind taste, cold plunge, arm wrestling, karaoke, generic group photo, and generic scavenger rows. Keep occasion-flavored variants only when their instruction materially depends on the groom, bride, family generations, couple, or beach setting.

Add the approved canonical records: `crew-shared-connection`, `honoree-superlative`, `photo-caption-contest`, `team-trick-shot`, `wall-sit-chorus`, `balance-high-five`, `build-snack-board`, `secret-helper`, `kid-teaches-game`, `family-lookalike`, `object-with-story`, `local-recommendation`, `one-song-dj`, and `two-truths-one-lie`. Add canonical rows for consolidated concepts only when no safe canonical row already exists.

Map retained seeds with their source occasion as `primaryOccasion`; map all retained `kid-` seeds with `browseTags: ['kids']`. Give canonical records no primary occasion unless their wording is truly occasion-specific.

- [ ] **Step 6: Apply copy and safety revisions at the source**

Update `src/content/activitySeeds.ts` so the seven confirmed titles match the spec. Replace the cannonball instruction with a judged splash or form challenge that does not target people. Make water and an easy decline explicit for hot wings. Remove sunburn from the beach outfit instruction. Change stranger prompts to ask or invite participation.

- [ ] **Step 7: Refresh recommended sets**

Keep 12 to 16 IDs for each occasion, remove every excluded seed ID, and include one or two safe canonical multi-occasion ideas. Preserve the strongest occasion-specific seeds so `Add recommended set` remains immediately useful.

- [ ] **Step 8: Run content tests and typecheck**

Run: `npm test -- tests/content/content.test.ts && npx tsc -b --pretty false`

Expected: content tests PASS and TypeScript exits 0.

- [ ] **Step 9: Commit when git metadata is writable**

```bash
git add src/content/activityBrowse.ts src/content/activities.ts src/content/activitySeeds.ts tests/content/content.test.ts docs/superpowers/specs/2026-07-20-category-ranked-activity-picker-design.md
git commit -m "feat: rank reusable activities by occasion"
```

### Task 2: Setup Occasion Radio Cards and Saved Board

**Files:**
- Modify: `src/app/steps/SetupStep.tsx`
- Modify: `src/index.css`
- Test: `tests/app/steps.test.tsx`

**Interfaces:**
- Consumes: `ACTIVITY_OCCASIONS` and `ACTIVITY_OCCASION_LABELS` from `src/content/activities.ts`.
- Produces: a radio group named `occasion` and an adjacent `.saved-board-panel` inside `.occasion-layout`.

- [ ] **Step 1: Replace the dropdown test with radio-card and proximity tests**

```ts
render(<SetupStep />);
const beach = screen.getByRole('radio', { name: 'Beach trip' });
await userEvent.click(beach);
expect(beach).toBeChecked();
expect(useWizardStore.getState().draft.libraryOccasion).toBe('beach-trip');

const section = screen.getByRole('region', { name: /choose an occasion/i });
expect(section).toContainElement(screen.getByLabelText(/saved board/i));
expect(section).toContainElement(screen.getByRole('button', { name: /load preset/i }));
expect(screen.queryByText(/start from a saved board/i)).toBeNull();
```

- [ ] **Step 2: Run the Setup test and verify it fails**

Run: `npm test -- tests/app/steps.test.tsx -t "SetupStep"`

Expected: FAIL because the occasion is still a select and the preset loader is outside the occasion section.

- [ ] **Step 3: Implement the split Setup section**

Give the occasion section `role="region"`. Replace the select with a fieldset whose labels contain native radio inputs:

```tsx
<fieldset className="occasion-options">
  <legend className="sr-only">What’s the occasion?</legend>
  {ACTIVITY_OCCASIONS.map((occasion) => (
    <label className="occasion-card" key={occasion}>
      <input
        type="radio"
        name="occasion"
        value={occasion}
        checked={draft.libraryOccasion === occasion}
        onChange={() => patch({ libraryOccasion: occasion })}
      />
      <span>{ACTIVITY_OCCASION_LABELS[occasion]}</span>
    </label>
  ))}
</fieldset>
```

Move the saved-board select, description, replacement warning, and `Load preset` button into `.saved-board-panel` beside the fieldset. Remove the old bottom preset `<details>`.

- [ ] **Step 4: Add responsive styles and run tests**

Use a two-column `.occasion-layout` on desktop, a four-column radio grid in its main area, and a two-column radio grid on small screens. Stack `.saved-board-panel` below the radios at 680px.

Run: `npm test -- tests/app/steps.test.tsx -t "SetupStep"`

Expected: all SetupStep tests PASS.

- [ ] **Step 5: Commit when git metadata is writable**

```bash
git add src/app/steps/SetupStep.tsx src/index.css tests/app/steps.test.tsx
git commit -m "feat: make occasion selection scannable"
```

### Task 3: Compact Grouped Activity Browser

**Files:**
- Modify: `src/app/steps/ActivitiesStep.tsx`
- Modify: `src/index.css`
- Test: `tests/app/steps.test.tsx`

**Interfaces:**
- Consumes: `groupActivitiesForOccasion`, `activityRelevance`, and `ACTIVITY_BROWSE_CATEGORY_LABELS`.
- Produces: `.activity-group`, `.activity-row`, category jump buttons, and per-category expansion state.

- [ ] **Step 1: Write failing browser tests**

Add tests for Bachelor category order, Family Kids grouping, cross-occasion search, eight-row initial limit, expansion, kids safety, and selected-only behavior.

```ts
useWizardStore.getState().patch({ libraryOccasion: 'bachelor', activities: [] });
const { container } = render(<ActivitiesStep />);
const headings = [...container.querySelectorAll('.activity-group h3')].map((node) => node.textContent);
expect(headings.slice(0, 5)).toEqual(expect.arrayContaining([
  expect.stringContaining('Adult drinks'),
  expect.stringContaining('Physical challenges'),
]));

await userEvent.type(screen.getByLabelText(/search ideas/i), 'Let a Kid Teach the Game');
expect(screen.getByRole('checkbox', { name: /add let a kid teach the game/i })).toBeDefined();
```

For the category order assertion, compare exact DOM indices so Adult drinks precedes Physical challenges, which precedes Sports, Games, and Social. For expansion, select a category with more than eight rows, assert eight `.activity-row` elements, click `Show N more`, then assert the full count.

- [ ] **Step 2: Run ActivitiesStep tests and verify the new tests fail**

Run: `npm test -- tests/app/steps.test.tsx -t "ActivitiesStep"`

Expected: FAIL because the current component filters by occasion and renders a flat card grid.

- [ ] **Step 3: Replace category filtering with grouped results**

Remove the `category` state and old filter chips. Filter only by safety through the browse helper, search text, and selected-only state. Group filtered rows with `groupActivitiesForOccasion`.

Maintain expanded categories as `Set<ActivityBrowseCategory>`. Show all rows when search or selected-only is active; otherwise show `group.activities.slice(0, 8)` unless expanded.

Render category jump buttons that call:

```ts
document.getElementById(`activity-group-${category}`)?.scrollIntoView({
  behavior: 'smooth',
  block: 'start',
});
```

Render one compact `<label className="activity-row">` per item with checkbox, title, one-line instruction, points, and difficulty. Keep the 80-row disabled behavior and add/remove accessible names.

- [ ] **Step 4: Style the dense grouped browser**

Remove the large two-column card rules. Make each group a bordered white section, each row a single compact grid line, and selected rows blue. Clamp instructions to one line on desktop and two lines on mobile. Keep a visible focus treatment for checkbox labels and jump buttons.

- [ ] **Step 5: Run the focused tests**

Run: `npm test -- tests/app/steps.test.tsx -t "ActivitiesStep"`

Expected: grouped browser tests PASS.

- [ ] **Step 6: Commit when git metadata is writable**

```bash
git add src/app/steps/ActivitiesStep.tsx src/index.css tests/app/steps.test.tsx
git commit -m "feat: add compact category-ranked activity browser"
```

### Task 4: Custom Ideas and Explicit Selected-Activity Editor

**Files:**
- Modify: `src/app/steps/ActivitiesStep.tsx`
- Modify: `src/index.css`
- Test: `tests/app/steps.test.tsx`

**Interfaces:**
- Produces: local component state `customizing`, `customIdeaOpen`, `customName`, and `customPoints`.
- Produces: a custom draft activity with `{ uid, name, points, bonus: false }` and no `catalogId`.

- [ ] **Step 1: Write failing interaction tests**

```ts
render(<ActivitiesStep />);
expect(screen.queryByRole('table')).toBeNull();
await userEvent.click(screen.getByRole('button', { name: /customize wording and points/i }));
expect(screen.getByRole('table')).toBeDefined();
expect(screen.queryByLabelText(/search ideas/i)).toBeNull();
await userEvent.click(screen.getByRole('button', { name: /back to ideas/i }));
expect(screen.getByLabelText(/search ideas/i)).toBeDefined();

await userEvent.click(screen.getByRole('button', { name: /add your own idea/i }));
await userEvent.type(screen.getByLabelText(/activity name/i), 'Find the best porch story');
await userEvent.clear(screen.getByLabelText(/^points$/i));
await userEvent.type(screen.getByLabelText(/^points$/i), '3');
await userEvent.click(screen.getByRole('button', { name: /^add idea$/i }));
expect(useWizardStore.getState().draft.activities.at(-1)).toMatchObject({
  name: 'Find the best porch story', points: 3, bonus: false,
});
expect(useWizardStore.getState().draft.activities.at(-1)?.catalogId).toBeUndefined();
```

- [ ] **Step 2: Run focused tests and verify they fail**

Run: `npm test -- tests/app/steps.test.tsx -t "custom|stable row identity"`

Expected: FAIL because the editor is always in the DOM and the custom form does not exist.

- [ ] **Step 3: Implement the local custom-idea form**

Render the form only after `Add your own idea` is clicked. Require a trimmed name, cap it at 90 characters, clamp numeric points from 1 through 99, default to 1, and stop submission at 80 activities. On success, append the draft row, close the form, and clear its state.

- [ ] **Step 4: Implement explicit customization mode**

When `customizing` is false, render the search, picker actions, groups, custom form, and scoring options. When true, replace that browser with the selected activity table and a `Back to ideas` button. Render no table before the user opens the editor. Preserve the existing stable `uid` keys, points parser, max-points handling, bonus toggles, and removal controls.

Update the stable-row tests to open customization before querying editable inputs. Replace the old repeated `New activity` test setup with two custom form submissions using the same name.

- [ ] **Step 5: Style the custom form and editor header, then run tests**

Run: `npm test -- tests/app/steps.test.tsx`

Expected: all step tests PASS.

- [ ] **Step 6: Commit when git metadata is writable**

```bash
git add src/app/steps/ActivitiesStep.tsx src/index.css tests/app/steps.test.tsx
git commit -m "feat: add local ideas and explicit activity editor"
```

### Task 5: Full Verification and Deployment

**Files:**
- Modify only if verification reveals a defect: files already listed above.
- Build output: website repository destination documented in `HANDOFF.md`.

**Interfaces:**
- Consumes: all completed tasks.
- Produces: a passing production build and updated live personal-site assets.

- [ ] **Step 1: Run the complete test suite**

Run: `npm test`

Expected: all tests PASS with no unhandled errors.

- [ ] **Step 2: Run typecheck and production build**

Run: `npx tsc -b --pretty false && npm run build`

Expected: both commands exit 0 and `dist/` contains the generated app assets.

- [ ] **Step 3: Inspect the production artifact**

Run: `rg -n "Choose an occasion|Add your own idea|Customize wording and points|Physical challenges" dist`

Expected: the built JavaScript contains all four current UI strings and contains none of the retired ambiguous titles.

- [ ] **Step 4: Run an independent read-only review**

Run: `/Users/jesse/.local/bin/claude-review "Review the category-ranked picker implementation against docs/superpowers/specs/2026-07-20-category-ranked-activity-picker-design.md. Focus on confirmed bugs, safety regressions, catalog duplication, accessibility, and mobile layout. Do not edit files."`

Expected: a concise review. Fix confirmed defects, then repeat Steps 1 and 2.

- [ ] **Step 5: Deploy using the existing website workflow**

Follow the source and destination paths in `HANDOFF.md`, copy the verified `dist/` output into the Bachelor app destination, inspect `git diff`, stage only those destination files, commit, and push the website repository main branch. Do not stage the unrelated local archive commit or unrelated site files.

- [ ] **Step 6: Verify the live assets**

Fetch the live Bachelor app HTML, confirm it references the new hashed JavaScript and CSS, then confirm each referenced asset returns HTTP 200.

- [ ] **Step 7: Update the handoff only if unfinished work remains or a cross-tool handoff is needed**

Keep `HANDOFF.md` under 800 words and record the exact test count, build command, deployed website commit, live hashes, known limitations, and the source-repo git restriction.
