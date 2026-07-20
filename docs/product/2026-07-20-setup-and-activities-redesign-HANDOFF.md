# Handoff: Setup + Activities Redesign (for Codex to build)

**Author:** Claude (planning), 2026-07-20
**Executor:** Codex CLI
**Repo:** `/Users/jesse/claude/bachelor-game-claude` (app source). Built output is
deployed to `jessemaddox.com/gameboard` via the `jessemaddox.com` repo → Vercel.
**Companion data file:** `docs/product/2026-07-20-activity-seed-library.md`
(the full per-occasion seed activity library — wire this into `src/content/activities.ts`).

---

## 0. TL;DR for the executor

The wizard *works* but looks and feels like unstyled plumbing. Jesse's verdict:
"the UI sucks." Three things to fix, in priority order:

1. **Interaction correctness** — player entry is broken/awkward (preset filler
   rows you must delete, no clean "type name → Enter → adds"), defaults aren't
   sensible. Fix the mechanics first.
2. **Content** — the activity library is generic. Replace/augment it with the
   **event-specific seed library** in the companion file: ~24-26 curated
   challenges per occasion, each with category + default points + difficulty.
3. **Visual design** — make it genuinely nice. Use the blue-based design-system
   palette (below). This is a real design pass, not a coat of paint.

**Do not** rebuild the engine, the board renderer, export, or the occasion-preset
architecture — those are fine. Scope is the **wizard UI** (`src/app/steps/*`,
`src/index.css`, the store where defaults live) and the **activity content**
(`src/content/activities.ts`).

Verify at the end: `git diff --check && npx tsc --noEmit && npm test && npm run build`.

---

## 1. Current state (ground truth as of 2026-07-20)

- Vercel migration is **done**. `jessemaddox.com/gameboard` is live (HTTP 200),
  Vercel auto-deploys `main`. The old Netlify "credits exceeded" block is gone.
- The wizard is 3 steps: **Setup** (`SetupStep.tsx`) → **Activities**
  (`ActivitiesStep.tsx`) → **Design** (`DesignStep.tsx`) → export.
- All current work is **uncommitted** in this repo (prior Codex sandbox couldn't
  write `.git`). Typecheck is clean. 180 tests pass.
- Activity content lives in `src/content/activities.ts` (89 generic items,
  11 categories, 7 occasions). Occasion presets live in
  `src/content/occasions/` (only `jesse2017.ts` is fully built).

### Category taxonomy (keep these 11 keys)
`social` (Social & performance), `games` (Games & competition), `sports`,
`outdoors`, `creative`, `food` (Food & taste), `service` (Helpful acts),
`learning`, `movement` (Movement & fitness), `drinking` (Adult drinks),
`bold` (Bold but safe).

### Occasions (7 today; add an 8th)
`bachelor`, `bachelorette`, `kids-weekend`, `anniversary`, `family-reunion`,
`friends-weekend`, `general` — **plus add `beach-trip`** ("Beach trip"). Wire it
into `ACTIVITY_OCCASIONS`, `ACTIVITY_OCCASION_LABELS`, `RECOMMENDED_ACTIVITY_IDS`,
and the occasion preset picker on the Setup step.

---

## 2. Interaction fixes (Setup step) — HIGHEST PRIORITY

File: `src/app/steps/SetupStep.tsx` (+ default state in
`src/store/wizardStore.ts`).

**Problems to fix:**

1. **Player entry is awkward.** Today there's a separate "Add player…" input at
   the bottom; the roster above it is a list of controlled inputs. Jesse expects:
   type a name, press **Enter**, it's added, the input clears and keeps focus so
   you can type the next one. (The Enter-to-add handler exists but the flow is
   confusing because the roster is also a pile of editable rows.)
   - **Desired:** a single obvious "add" affordance at the *top* of the roster:
     input + Add button, Enter submits, focus stays. Below it, the added players
     render as compact removable **chips/pills** (name + ✕), not a stack of full
     text inputs. Editing a name = click the chip to make it editable inline, or
     remove + re-add. Keep it dead simple.
   - Empty state: show a friendly hint ("Add everyone who's playing — you can
     paste a list too") instead of an empty box.
   - Nice-to-have: accept a pasted multiline / comma list and split into chips.

2. **Preset filler rows.** Loading an occasion preset dumps players/activities
   the user then has to hand-delete. Decide the default: **start empty** (no
   filler players; honoree/title blank) unless the user explicitly clicks
   "Load preset." The occasion preset loader should be clearly opt-in and clearly
   say "this replaces your current board." Do **not** pre-populate 8 mystery
   players.

3. **Sensible defaults.** New board should open with: empty player list, a
   sensible default poster size, empty title/honoree, and **zero activities**
   until the user picks an occasion and taps "Add recommended set" (or hand-picks).
   Confirm defaults in `wizardStore.ts` match this.

4. **Occasion is chosen too late.** Occasion currently lives half on Setup
   (preset loader) and half on Activities (`libraryOccasion` selector). Unify:
   pick the occasion **once, early** (top of Setup), and have it drive both the
   preset and the Activities library filter. One source of truth.

**Acceptance for this section:** A first-time user can, with no confusion: pick
an occasion, type 6 player names each followed by Enter (they appear as chips),
and move to Activities — with nothing they have to delete first.

---

## 3. Activities step — content + flow

File: `src/app/steps/ActivitiesStep.tsx`, content in `src/content/activities.ts`.

**Content:** Replace the thin generic library with the **event-specific seed
library** (companion file). Each occasion gets ~24-26 curated challenges spread
across its relevant categories, each with a default point value and difficulty.
Keep the existing generic items only where they still earn their place; the seed
library is the new backbone. `RECOMMENDED_ACTIVITY_IDS[occasion]` should point at
a strong default ~12-16 of that occasion's set so "Add recommended set" produces
a great board in one click.

**Flow (mostly good already — polish, don't rebuild):**
- Occasion is inherited from Setup (don't re-ask "What are you planning?").
- Keep: search, "Add recommended set," "Selected only," category chips.
- Improve the **category browse**: make categories visually grouped (a labeled
  section per category with its items under it) OR keep the chip filter but make
  the selected/unselected activity cards look clearly like tappable cards with a
  checkmark state. Right now they're plain `<label>` rows. Cards should show
  name, one-line instruction, category tag, and points, with an obvious
  selected state.
- Keep the "Customize selected activities" and "Board scoring options" as
  collapsed advanced sections — that part of the IA is good.
- Enforce the existing caps (min 5 to build, max 80 selected).

**Acceptance:** Picking an occasion + "Add recommended set" yields a board that
looks intentional and occasion-appropriate. Browsing by category is pleasant on
desktop and mobile.

---

## 4. Visual design pass

Use the blue-based design-system palette (from `~/.claude/skills/design_system.py`).
This is the "Volt blues" scheme Jesse referenced. Core tokens:

| Role | Hex |
|------|-----|
| Primary / section bar | `#4a86c8` |
| Deeper blue (headers, active) | `#2d6cb4` |
| Dark navy (accents, labels) | `#1a3d6d` |
| Very dark navy (deep headers) | `#0f2b4c` |
| Light blue wash (selected/callout bg) | `#e1ecf7` |
| Blue-tinted off-white (surfaces) | `#f8fafc` |
| Light blue-gray (cards/data) | `#f0f4f8` |
| Separator | `#c4cdd6` |
| Body text | `#4a4a4a` |
| Success / positive | `#27763d` |
| Caution | `#e67e22` |
| Danger / remove | `#c0392b` |

Fonts already in repo: **Montserrat** (headings) is bundled in
`src/assets/fonts/`. Use it for the wizard headings to match the board output;
a clean system/sans stack for body is fine.

**Design intent:**
- A calm, confident, "premium party tool" feel — generous spacing, clear
  hierarchy, one accent color doing the work. Not corporate, not childish.
- Wizard chrome: a slim progress header (Step 1 Setup · 2 Activities · 3 Design)
  with the current step in `#2d6cb4`.
- Selected activity cards: `#e1ecf7` bg + `#2d6cb4` border + check. Unselected:
  `#f8fafc` surface, `#c4cdd6` hairline border.
- Category chips: pill buttons, active = `#2d6cb4` filled white text.
- Buttons: primary `#4a86c8`→hover `#2d6cb4`; ghost/secondary outlined; remove/×
  uses `#c0392b` on hover only (keep it quiet otherwise).
- Player chips: `#f0f4f8` bg, `#1a3d6d` text, ✕ turns `#c0392b` on hover.
- Respect reduced-motion; keep transitions subtle (120-160ms).
- **Mobile-first responsive:** editor is the dominant column on desktop with the
  live preview as a sidebar (already the layout) — verify it collapses cleanly to
  a single column on phones, since people will build these on a phone.
- Keep it theme-light (the tool is light-mode); no dark mode required.

All colors go through CSS custom properties in `src/index.css` (define a
`:root` token block, e.g. `--c-primary`, `--c-primary-deep`, `--c-wash`, …) so
there are no scattered hardcoded hexes.

---

## 5. Build order for Codex (suggested)

1. **Data first.** Add `beach-trip` occasion. Port the seed library from the
   companion file into `src/content/activities.ts` (extend `ACTIVITY_LIBRARY`,
   set each item's `occasions`, `category`, `points`, `difficulty`,
   `adultOnly`). Update `RECOMMENDED_ACTIVITY_IDS` per occasion. Update tests in
   `tests/content/content.test.ts` (there are invariants — keep them green).
2. **Store defaults.** Fix `wizardStore.ts` so a fresh board is empty/sane; make
   occasion the single early choice.
3. **Setup step interaction.** Rebuild player entry as chips + Enter-to-add;
   move occasion to the top; make preset loading clearly opt-in.
4. **Activities step polish.** Card UI + category grouping + inherited occasion.
5. **Visual pass.** Token block in `index.css`; restyle both steps + wizard
   chrome + Design step to match.
6. **Verify + deploy.** Run the verify command. Then rebuild the site output and
   push `jessemaddox.com` so it goes live (see §7).

Each step should keep `npx tsc --noEmit` and `npm test` green before moving on
(TDD where content invariants exist).

---

## 6. Guardrails / do-nots

- Do NOT reintroduce the risky 2017 legacy rows into any generic/default set.
  Keep adult content behind `adultOnly` and only in adult occasions. The kids
  and family-reunion default sets must be clean.
- Do NOT rebuild the board engine, renderer, PDF/SVG export, or fonts pipeline.
- Do NOT `git add -A` — the repo has many intentional uncommitted files. Stage
  narrowly.
- Keep the honor-system framing: every challenge is self-judged, no scoring
  backend. (The multiplayer "lobbing challenges" game is a *separate, later*
  project — see `docs/product/2026-07-20-challenge-chain-mvp.md`. Do not build it
  here.)

---

## 7. Deploy path (after approval)

App build → site repo → Vercel:
```
# in bachelor-game-claude:
npx vite build --base=/projects/gameboard/
# copy dist/* into jessemaddox.com/projects/gameboard/ (replace assets + index.html)
# in jessemaddox.com: stage only projects/gameboard, commit, push main
```
Vercel auto-deploys `main` to `jessemaddox.com/gameboard` within ~1 minute.
Confirm with `curl -s -o /dev/null -w "%{http_code}" https://jessemaddox.com/gameboard`.

---

## 8. Verify command

```
git diff --check && npx tsc --noEmit && npm test && npm run build
```
Expect: typecheck clean, all tests pass, Vite build clean (existing chunk-size
warning is OK).
