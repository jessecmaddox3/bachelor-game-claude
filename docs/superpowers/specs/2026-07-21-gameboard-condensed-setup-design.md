# Gameboard Condensed Setup and Flexible Poster Design

> **TL;DR:** Make `/gameboard` faster to start, easier to scan, and more resilient when a board has unusual numbers of participants or activities. New boards begin as a Kids Weekend with Jesse's family roster and no selected activities. Setup contains only occasion, Title, Subtitle, and Participants. Activities become a compact checkbox grid with Clear all, while customization and poster size move to the final step. Rules become one titled rich-text-lite document, and poster typography scales to the actual cells without clipping.

## Outcome

The first useful moment should be selecting activities, not filling out setup fields. A new visitor can open the builder, see a plausible family roster, confirm or change the occasion, and continue. The historical bachelor board remains available as an explicit preset rather than controlling the default state.

The update preserves the current three-step architecture and existing visual identity. It changes the information hierarchy and underlying content model only where the current model makes the requested experience awkward.

## Step 1: Compact Setup

Step 1 remains `Setup`, but its content is condensed into three compact areas:

1. Occasion and saved-board loading share the first row.
2. Board naming contains only `Title` and `Subtitle` in a two-column row.
3. `Participants` contains one compact composer and alphabetized editable chips.

Remove the numbered 01, 02, and 03 ornaments. Reduce section padding and explanatory copy so the normal desktop setup fits without page scrolling and remains comfortable on mobile.

### Occasion choices

Use properly capitalized labels with one restrained emoji each:

- `💍 Bachelor Weekend`
- `🥂 Bachelorette Weekend`
- `🧸 Kids Weekend`
- `💛 Anniversary / Couples`
- `🌳 Family Reunion`
- `🏡 Friends Weekend`
- `🏖️ Beach Trip`
- `🎲 General Gathering`

Emoji is supportive flair, not the only identifying information. Radio inputs and visible text remain accessible.

### Title model

The normal setup UI exposes only:

- `Title`, placeholder `The Bachelor Weekend of Jesse Cordell Maddox III`
- `Subtitle`, placeholder `October 19th - 22nd, 2022 - Blue Ridge, GA`

New boards use `Kids Weekend` as the initial Title and an empty Subtitle. The internal legacy `honoree` line becomes optional so the historical preset can retain its source-faithful three-line masthead. New boards render one Title line plus an optional Subtitle. Export filenames use the legacy honoree when present, otherwise the Title.

### Participants

Rename `Add the players` to `Participants` and `Add players` to `Add participants`. Sort names case-insensitively after adding, pasting, or editing. Preserve explicit removal and inline editing.

The new default roster is:

`Jess, Kait, Jack, Bobbie, Caz, Brett, Rachel, Bo, Eleanor, Hunter, SG, Coco, Nona, Shasha, Steven, Mary`

The default occasion is Kids Weekend. The default has no selected activities, so the visitor can go directly to the fun selection step.

### Historical preset

Keep the complete historical board and rename its visible preset to `My Bachelor Party Weekend`. Loading it continues to replace roster, activities, rules, format, and design after confirmation.

## Step 2: Compact Activity Selection

The activity catalog remains occasion-ranked. Changing occasion does not silently delete already selected activities. Loading a complete preset may still bring its saved selections because it intentionally replaces the entire board.

The picker begins with a faint note:

`You can customize points and text for each activity later.`

Primary actions are:

- `Add recommended set`
- `Selected only`
- `Clear all`, disabled when nothing is selected
- `Add a new activity`

`Clear all` removes all selected catalog and user-created activities immediately. The selection count provides immediate confirmation.

The browse view uses native checkboxes in a two-column grid within each category on desktop and one column on narrow screens. Each option shows the activity name and concise instruction. Points remain visible but visually secondary. Difficulty or relevance badges must not dominate scanning.

Rename the custom-idea language so the result is clear. `Add a new activity` asks only for its name during selection and assigns a temporary default of one point. User-created rows are labeled `Your idea`, not the ambiguous `Custom`. Wording and point controls do not interrupt browsing.

Move the existing selected-activity table to the final Design step under `Activity details`. It supports wording, points, maximum points, bonus status, and removal. This is where the note at the top of Step 2 promises customization will happen.

## Step 3: Poster Settings and Rules

Move `Poster size` into the final Design step near export settings. Theme, corner boxes, activity details, rules, and export remain in this step.

### Rules editor

Replace the list of separate rule cards with:

- one `Rules title` field
- one rich-text-lite content editor

The editor supports paragraphs, bold text, and bulleted lists. Use a small safe syntax and toolbar rather than arbitrary HTML. The stored source is deterministic plain text with Markdown-like markers:

- blank lines separate paragraphs
- `- ` begins a bullet
- `**text**` marks bold text

The historical preset is migrated into this single document while preserving its section headings and paragraphs. The poster parser converts the safe syntax into measured styled lines. The layout engine reduces type size until the complete document fits the allocated rules region. It does not clip, overflow, or silently omit content. If content cannot fit at the existing legibility floor, the preview continues to report an honest infeasibility message.

## Responsive Poster Typography

The poster currently uses one conservative global grid type size. That produces undersized text when there are many participants but only a few activities because tall activity rows do not influence the chosen size enough.

Keep the global grid solver for structural feasibility, then fit text to each resolved cell:

- activity labels use the largest comfortable size that fits the wrapped label inside the row with padding
- points and totals scale to their individual cells
- participant names use the largest size that fits the rotated participant header cell
- maximum sizes remain bounded so sparse boards look intentional rather than cartoonishly large
- the current minimum legibility floors and no-overflow invariants remain in force

Add regression fixtures for a sparse board with about 30 participants and five activities, a tall board with few participants and many activities, long participant names, and long activity names. Assertions cover cell containment, padding, and meaningful type growth on the sparse board.

## State and Migration

Bump the persisted builder key so the revised Kids Weekend default appears predictably instead of being overwritten by older empty defaults. Loading the historical preset remains the supported path to the complete bachelor board.

Board validation changes:

- Title remains required.
- Legacy honoree becomes optional.
- Subtitle remains optional.
- At least eight participants and five activities are still required for a valid export.
- Rules store a title and one rich-text-lite source document.

No general account, cloud save, public gallery, or collaboration feature is added.

## Testing and Release

Implement behavior test-first. Cover:

- Kids Weekend default and exact roster
- occasion labels and emoji
- Title and Subtitle only in normal setup
- alphabetic participant ordering after add, paste, and edit
- poster size in Design rather than Setup
- Clear all and compact activity selection
- customization in Design
- rich-text-lite parsing, wrapping, and complete rendering
- historical preset migration and loading
- sparse and dense poster typography containment

Run the full Vitest suite, TypeScript build, production build, and visual browser checks at desktop and mobile widths. Deploy only the generated `projects/gameboard/` output in the website repository, preserve unrelated website changes, and verify `https://jessemaddox.com/gameboard` after publishing.

## Explicit Non-Goals

- No arbitrary HTML or unrestricted contenteditable storage
- No new activity auction, challenge, or linked-score mechanics
- No automatic replacement of selections when occasion changes
- No redesign of the overall gameboard visual identity
- No changes to unrelated website pages
