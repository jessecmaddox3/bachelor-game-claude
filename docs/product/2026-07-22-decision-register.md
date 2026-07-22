# Decision Register

Dated entries recording product-direction decisions. See `README.md` in this directory for the
full document index and current status of each file referenced below.

## 2026-07-22: Gameboard and challenge game are intentionally separate products

Jesse confirmed the original shared-backend/shared-library idea (one challenge library powering
a printable board, a phone app, a card deck, etc., as proposed in
`2026-07-18-beyond-the-board.md`) is dropped. The bachelor gameboard (this repo) and the
three-brother challenge game (`/Users/jesse/claude/challenge-game`, live at
`jessemaddox.com/challenge-lab`) are separate products with separate content systems, separate
docs, and separate release cadences. Do not re-unify them.

## 2026-07-21 -> 2026-07-21: "Build around Return Serve" set aside for the weekly lab format

`2026-07-21-challenge-motivation-and-gameplay.md` recommended building the challenge game around
a reciprocal "Return Serve" exchange loop. The same day, Jesse redirected toward a weekly
three-brother lab format instead (see `/Users/jesse/claude/challenge-game/PROJECT-INTENT.md` and
`MECHANICS-DECISIONS.md` for the accepted mechanics). Turn-passing/reciprocal exchange is
preserved as a documented future-research candidate, not the current build.

## 2026-07-21 -> 2026-07-22: Shortlist recommendation overruled twice

`2026-07-21-challenge-atlas-editorial-review.md` recommended starting product testing with an
80-item shortlist drawn from the 360-item atlas. That recommendation was first overruled in favor
of seeding the full 360/247-candidate catalog into Challenge Lab Task 6 (V1: all categories, full
catalog exposed). It was then effectively superseded again on 2026-07-22 by reducing the
selectable/playable pool to the top 30 growth-oriented challenges (challenge-game commit
`dcd01da`). Canonical details (which 30, why, and the tagging mechanism) live in
`/Users/jesse/claude/challenge-game/HANDOFF.md` and `MECHANICS-DECISIONS.md`.

## 2026-07-22: Gameboard review-pass release shipped

Commit `33e1b00` ("fix: review-pass fixes across wizard, engine, and content defaults") shipped
and was deployed to `jessemaddox.com/gameboard`. Highlights: family roster spelling fixes (Kait,
Bobbie, Caz, Shasha), restored relevance/difficulty badges, hidden-selection notice, Clear-all
confirmation, preview zoom overlay, landscape locked to a truthful 60x48, and several engine
label/quality/dead-code fixes. 238 tests, typecheck, and production build green at the time of
release.

## Band naming: Spark / Nudge / Stretch / Quest

The challenge game's difficulty/size band names settled as Spark, Nudge, Stretch, and Quest (see
`2026-07-21-challenge-atlas-360.md` and later challenge-game docs). The 2026-07-18 docs in this
repo (`2026-07-18-starter-challenge-catalog.md`) used an earlier "1 Spark, 2 Try, 3 Stretch, 5
Quest" naming; "Try" is historical and was replaced by "Nudge" before the challenge game's current
naming was finalized. Canonical naming lives in the challenge-game repo.
