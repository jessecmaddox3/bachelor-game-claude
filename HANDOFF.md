# Handoff

- Original goal: Rebuild Jesse's 2017 bachelor game board as a shelf-stable poster generator, simplify the builder from real-world feedback, and preserve the challenge research that seeded a separate three-brother mobile web game.

- Current phase: The gameboard is content-complete. The 2026-07-22 review-pass release (commit `33e1b00`) is pushed and deployed to `https://jessemaddox.com/gameboard`. For the challenge game (`/Users/jesse/claude/challenge-game`, live at `jessemaddox.com/challenge-lab`), that repo's own `HANDOFF.md` is authoritative; do not restate its task status here. The two products are intentionally separate (see `docs/product/2026-07-22-decision-register.md`).

- Done:
  - Setup, Activities, and Design steps redesigned and shipped (blue visual system, per-occasion seed library, chip-based player entry).
  - Review-pass release `33e1b00`: family roster spelling fixes (Kait, Bobbie, Caz, Shasha), restored relevance/difficulty badges, hidden-selection notice with removable rows, Clear-all confirmation, disabled Bold with no selection, click-to-enlarge preview zoom overlay (Fit/100%/200%), landscape locked to a truthful 60x48.
  - Engine fixes: landscape labels moved into BoardSpec (content-agnostic engine), honest infeasible result for non-60x48 landscape specs, real rail-rules quality report (replacing a fabricated value), dead gap machinery removed, bracket cap of 4, shared overlong-word splitter.
  - 238 tests, TypeScript, and production build green at release. Deployed and spot-checked live.
  - Documentation governance pass 2026-07-22: added `docs/product/README.md` index, status banners on historical/superseded product docs, `docs/product/2026-07-22-decision-register.md`, and a historical banner on `docs/REVIEW_HANDOFF.md`.

- Pending:
  - Human visual QA pass in a normal browser (the last release session's checks were automated layout invariants, production builds, and live HTTP checks, not a manual look).
  - No other build work is queued for this repo. Future gameboard work should start from a fresh brainstorming/planning pass, not from resuming the challenge-game research docs here.

- Changed files (this doc-governance pass): `docs/product/README.md` (new), `docs/product/2026-07-22-decision-register.md` (new), status banners added to `docs/product/2026-07-18-beyond-the-board.md`, `docs/product/2026-07-18-starter-challenge-catalog.md`, `docs/product/2026-07-20-activity-seed-library.md`, banner and stale-fact fixes on `docs/REVIEW_HANDOFF.md`, this file. No `src/**` or `tests/**` changes.

- Verify command: In this repo, `npm test && npx tsc --noEmit && npm run build`. For the live release, `curl -fsS https://jessemaddox.com/gameboard` then fetch the referenced JS bundle from the returned HTML and `grep` it for a release-distinctive string such as `"Kait"` (the roster spelling fix). Do not verify against a pinned asset filename/hash; bundle hashes rot on every rebuild. For the challenge game, use the verify command in `/Users/jesse/claude/challenge-game/HANDOFF.md`.

- Current risks:
  - The `jessemaddox.com` repo (separate, at `/Users/jesse/claude/jessemaddox.com`) carries a large uncommitted site-rebuild from another session. Any gameboard publish must be a narrow, path-scoped commit plus a CLI deploy, never a bare `git push` on that repo. See that repo's own `HANDOFF.md` before touching it.
  - This repo's own working tree may show as dirty in some environments due to sandboxing quirks with Git metadata; confirm actual state with `git status` rather than trusting stale notes.

- Do not repeat:
  - Do not re-unify the gameboard's and challenge game's content systems or backends; that idea was explicitly dropped 2026-07-22.
  - Do not rebuild or resume the challenge game from this repo's historical `docs/product/2026-07-21-challenge-*` and `2026-07-21-cooperative-rivalry-mechanics-library.md` docs; they are historical research only, superseded by the challenge-game repo's own docs.
  - Do not publish the site via a bare `git push` in `/Users/jesse/claude/jessemaddox.com` until that repo's site-rebuild session has committed its pending work.

- Suggested next step: Do the human visual QA pass on the live `/gameboard` release. If Jesse wants further gameboard work, start a fresh brainstorming pass rather than resuming any of the challenge-game-oriented docs in `docs/product/`.

- Last tool + date: Claude, 2026-07-22.
