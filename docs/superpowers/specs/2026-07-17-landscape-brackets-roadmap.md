# Landscape "Brackets" Template + Jesse 2017 Preset — Phased Spec

## Context

Jesse's real 2017 bachelor party board (`~/Downloads/BACHELOR_BRACKETS.pdf`) is the new fidelity target. He wants (a) all of its names + activities + rules loaded as a reusable **preset**, and (b) the engine able to reproduce its design pixel-perfect. The catch: this board is a **landscape** layout that differs structurally from the portrait "Steven" template the v5 engine was built around — it has tournament **brackets** down the left, the scoring grid in the center with **diagonally-rotated** player names, and a **results-boxes + multi-section rules block** down the right. So the *data* is a trivial preset, but the *visual match* is a large engine expansion. This spec breaks that expansion into phases.

**Locked decisions (Jesse, 2026-07-17):**
- **Font:** closest free Gotham-alike (Montserrat, or Jost). No commercial licensing. Legally clean, ~95% visual match to the board's geometric sans.
- **Sequencing:** ship the *data preset* first (usable on today's portrait engine), then build the landscape template in stages toward pixel-perfect.
- **Template:** the landscape/brackets layout becomes a **reusable second template** (variable players/activities/tournaments), not a hardcoded one-off — future occasions (bachelorette, golf) reuse it.
- **Phased:** each phase below gets its own spec → plan → subagent-execution cycle (like Plans 1/2/2.5/3). This file is the roadmap.

## Reference board anatomy (what we're matching)

Landscape, three columns, on a 60×48in (5:4) source artboard:
- **Left rail:** four stacked single-elimination **tournament brackets** — Beer Pong (teams of 2), Ping Pong (individual), Pool (individual), Rock Paper Scissors. Blank seed slots + connector lines feeding a center "WINNER" box. Hand-filled during the party.
- **Center:** "THE GAME" grid. "ACTIVITIES (DEADLINE FOR POINTS: 9PM SATURDAY)" sub-label. A single **"POINTS (MAX)"** column with inline notation like `2 (4)` (2 points each, cap 4), ranges `1-5` / `0-4`, and negatives `-1`. Player names ("VICTIMS") run at a **~45° diagonal**. A bottom **"TOTAL POINTS — 100"** target row.
- **Right rail:** "THE AWFUL RESULTS:" with four labeled write-in boxes (GRAND CHAMPION; 2ND PLACE / VALIANT EFFORT; 3RD PLACE / WORTHY COMPETITOR; GRAND LOSER / R.I.P.), then a tall multi-section **rules block** (a legal-parody NDA with Sections 1–6).
- **Palette:** teal title, blue date + section labels + "THE GAME", teal accent rules/dividers, black activity text. Close to our "Classic Teal" but exact hues to be tuned.

## Engine gap analysis (current → needed)

Grounded in the current code (verified):

| Reference element | Engine today | Gap / phase |
|---|---|---|
| Landscape orientation | `POSTER_SIZES` all portrait, `boardSpec.ts:3-8`; no orientation flag | Add landscape sizes — **P2** |
| Diagonal (−45°) names | `place.ts` + `types.ts:18` support only `0`/`-90`; invariants `invariants.ts:10` | Add −45 rotation across type/place/invariants/svg/pdf — **P2** |
| Left rail w/ real bracket widgets | single rail, renders empty titled box, `compose.ts:136-141` | Bracket renderer + multi-widget rail — **P4** |
| Dual (left+right) rails | one rail only, schema `boardSpec.ts:82-88`, `regions.ts:61-74` | Two-rail schema + partition — **P3** |
| Right-rail results boxes | cornerBoxes in header, `compose.ts:40-72`, max 3 | Rail-placed results boxes, allow 4 + sub-labels — **P3** |
| Right-rail rules block | rules = bottom strip, `compose.ts:407-483` | Rail-mode rules layout — **P3** |
| Inline "POINTS (MAX)" `2 (4)` | separate MAX POINTS column, `compose.ts:270-285` | Inline points+max display mode — **P3** |
| Dash range `1-5` | `pointsLabel` renders "1 to 5", `boardSpec.ts:24-27` | Dash format option — **P1** (cheap, reusable) |
| TOTAL target value (100) | TOTAL row has label only, no value, `compose.ts:328-339` | Optional totals-target value — **P1** |
| Gotham-alike font | fixed 3 faces (Archivo Black + Lato), `metrics.ts:9`, `svg.ts:15-16` | Bundle Montserrat/Jost via a small font registry — **P2** |
| The data (names/activities/rules) | none | Occasion-pack preset — **P1** |

## Phased roadmap

### Phase 1 — Occasion presets + Jesse's 2017 data (ships on today's portrait engine)
**Status:** data infrastructure implemented and verified on 2026-07-17. Human review rejected the portrait rendering as a design match; this phase is not template approval. See `docs/superpowers/specs/2026-07-17-phase1-occasion-presets.md`.

**Goal:** the real data is loadable in the wizard immediately; a couple of cheap reusable schema touches.
- Occasion-pack infrastructure (a `src/content/occasions/` registry the wizard's step-zero/preset picker reads).
- The **"Jesse's Bachelor 2017"** pack: 30 players, 37 activities with exact points (Appendix A — `2 (4)` → `points:2, maxPoints:4`; `1-5` → `{min:1,max:5}`; `-1` → `-1`), the 4 results boxes as cornerBoxes, the Sections 1–6 rules transcribed verbatim as structured rules, teal theme, "THE BACHELOR WEEKEND OF …" title + date subtitle.
- Cheap reusable schema/render touches: cornerBoxes max 3→4; `pointsLabel` gains a dash-range format option; optional `totalsTarget` value drawn in the TOTAL row.
- **Renders on the current PORTRAIT engine** — data-correct and usable now (two-column points, vertical names). Not yet the landscape look; that's P2–P5.
- **Done:** pick "Jesse's Bachelor 2017" in the wizard → a populated, feasible portrait poster with all his content; content tests validate every activity/point maps and parses.

### Phase 2 — Landscape foundation (the cross-cutting primitives)
**Goal:** the engine can lay out and render a landscape page with diagonal names in the correct font. No brackets yet.
- Add landscape `POSTER_SIZES`, including the reference board's exact 5:4 ratio (`60x48`, with a smaller 5:4 option if useful), with an orientation that flips region math where it assumes portrait.
- Bundle the free Gotham-alike (Montserrat weights, likely Regular/Medium/Bold/Black) and introduce a **small font registry** so `FontId` maps to family+weight+buffer in one place (`metrics.ts` + `svg.ts` FAMILY/WEIGHT + `fonts.ts` FontFace + pdf embed) — also satisfies the earlier Plan-4 "themes can pick fonts" goal.
- Add **−45° rotation**: extend `TextRun.rotate` and `Placement` to include `-45`, the `placeText` math, the invariant budget (`invariants.ts`), and both renderers (SVG `transform="rotate(-45 …)"`, PDF `degrees(45)`). Diagonal text needs a diagonal bounding-box fit — the trickiest bit; unit-test the placement like the −90 work was.
- **Done:** a landscape sample renders header + grid + diagonal player names in Montserrat, invariant-clean, PDF≈SVG.

### Phase 3 — Dual rails + right-rail content + inline points
**Goal:** the non-bracket landscape structure is complete.
- Schema: `sideRails` (left and/or right, each with width + role) replacing the single `sideRail`; `regions.ts` partitions a landscape page into left-rail / grid / right-rail.
- **Right-rail results boxes** (generalize cornerBoxes into a rail-placed stack with main + sub label) and **right-rail rules block** (the multi-section legal text laid out vertically in a rail instead of the bottom strip — raise the rules count/length caps to hold the real content).
- **Inline "POINTS (MAX)" display mode:** one column rendering `2 (4)` / `1-5` / `-1`, gated by a theme/template flag, instead of the separate MAX POINTS column.
- TOTAL POINTS target row; "VICTIMS" diagonal label; "THE GAME" + "ACTIVITIES (deadline…)" corner treatment.
- **Done:** the center + right two-thirds of the board match the reference (minus brackets), invariant-clean across player/activity counts.

### Phase 4 — Tournament bracket widget (the big new subsystem)
**Goal:** real single-elimination brackets render in the left rail.
- Pure-TS bracket geometry: given N entrants (or N/2 teams for "teams of 2"), compute a single-elim bracket — rounds as columns, matches as slot pairs, connector lines, a center/right "WINNER" box — sized to fit an assigned rail slot. Empty slots (hand-filled), like the reference.
- A rail can stack **multiple** bracket widgets (Beer Pong teams-of-2, Ping Pong, Pool, RPS), each labeled. Schema: a `brackets` list (title, entrant count, teamSize).
- Emits only Scene primitives (lines + text + rects) — invariant-tested like everything else; feasibility-gated when a bracket can't fit legibly.
- **Done:** the left rail renders the four brackets at the reference's structure; sweep tests confirm no overflow across entrant counts.

### Phase 5 — Assemble the "Landscape / Brackets" template + pixel-match pass
**Goal:** a selectable template that reproduces the board; tune to pixel-perfect.
- Wire P2–P4 into a named template the wizard offers alongside the portrait one; the Jesse pack targets it.
- Build the landscape "Jesse 2017" sample; **side-by-side against `BACHELOR_BRACKETS.pdf`**, tune spacing/hues/sizes/margins until it matches.
- **Done:** generated poster is visually indistinguishable from the reference at print scale (within the free-font substitution); regenerated sample committed for eyeballing.

## Appendix A — Jesse 2017 preset data (concrete)

**Players (30, "VICTIMS"):** Beej, Billy, Brett, Chris B., Chris W., Dan, Dave, Drew, Grant, Hugh, Hunter B., Hunter M., James, Jesse, Jim, Jon, Kent, Luckey, Luke, Marshall, Mason, Matt P., Matt W., Micah, Mike, Preston, Rob L., Rob W., Ryan, Steven.

**Activities (37) — name → points (maxPoints):**
Eat the Mystery Thing (It's Edible, Mostly) → 1; Don't Sleep in a Bed → 2; Karaoke Serenade → 1 (max 2); Meal Cleanup → 1; Sleep After 3am → 2 (max 4); Sleep Before 7pm → −1; 100 Total Pullups → 2; 100 Pushups in 10 Minutes → 2; 69 Burpees → 2; Canoe Time Trials → range 1–5; Catch a Fish (Biggest) → 3 (max 4); Indoor Bball Shot → 2; Win Paintball Duel → 2 (max 4); Lose Paintball Duel → 1 (max 4); Throwing Axe Bullseye → 2; Win a Game of CanJam → 1; Win a Game of Stump → 1; Win Game of Chess → 1; Win Hide and Seek → 2 (max 4); 2 Shots in a Row → 2 (max 4); Beer Bong → 2 (max 4); Buffalo Someone → 1 (max 4); Spin Coin, Finish Beer First → 2 (max 4); Hit Target with Football → 1; Life Someone → 1 (max 4); Shotgun a Beer → 1 (max 3); Bleed (Involuntarily) → 1; Eat a (Really Hot) Pepper → 2; Jump in the Lake → 2 (max 4); Throw Up → 2 (max 8); Drink 2 Beers in Handcuffs → 2; Beer Pong Tournament → range 0–4; Ping Pong Tournament → range 0–4; Pool Tournament → range 0–4; RPS Tournament → range 0–4; Know the Name → 2; Bonus Awarded by Bachelor → range 1–5.

**Totals target:** 100. **Results boxes:** Grand Champion; 2nd Place (Valiant Effort); 3rd Place (Worthy Competitor); Grand Loser (R.I.P.). **Tournaments (P4):** blank hand-fill brackets matching the source: Beer Pong has 8 team slots (16-person capacity); Ping Pong, Pool, and Rock Paper Scissors each have 16 individual slots. They are not seeded directly from all 30 players.

## Appendix B — Rules

The board's rules are a multi-section legal-parody NDA (Sections 1–6: Game Rules, General Conduct, Confidential Information, Non-Use/Non-Disclosure, Maintenance, Term). During Phase 1 implementation, transcribe them **verbatim from the PDF** into the preset's structured rules data (raising the rules count/length caps as needed). They render in the bottom strip in P1 and move to the right rail in P3.

## Verification

Per phase: unit + invariant tests (the existing overflow/out-of-page harness extends to landscape, diagonal text, and brackets), a resvg-rasterized sample written to `samples/`, and — for P5 — a direct side-by-side of the generated PNG/PDF against `BACHELOR_BRACKETS.pdf`. Each phase ends green (`npm test`, `npm run build`) before the next begins, on its own branch, merged when the human approves.
