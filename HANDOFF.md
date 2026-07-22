# Handoff

- Original goal: Rebuild Jesse's 2017 bachelor game board as a shelf-stable poster generator. The gameboard is now content-complete, deployed, and in active family use; the separate challenge game lives in `/Users/jesse/claude/challenge-game` (its own `HANDOFF.md` is authoritative for that repo). The two products are intentionally separate (see `docs/product/2026-07-22-decision-register.md`).

- Current phase: **Codex takes over as the single writer (2026-07-22).** Claude's session ended after shipping three releases today; all work is committed and pushed, both trees clean. One new feature is requested and NOT started: named save/load of board configurations (details in Pending). Jesse wants it before he builds this weekend's kids board, which he plans to print on Letter paper tomorrow.

- Done (today, commit range `ca17046..80aaf80`, all deployed to `jessemaddox.com/gameboard`):
  - `33e1b00` review-pass fixes: family roster spellings (Kait, Bobbie, Caz, Shasha), relevance badges restored, occasion-hidden selections surfaced with notice + removable rows, Clear-all confirm, Bold no-op without selection, boot styling, occasion-keyed placeholders, dead CSS sweep, landscape locked to truthful 60x48, click-to-enlarge preview zoom (Fit/100%/200%). Engine: landscape labels moved into BoardSpec, honest non-60x48 infeasibility, real rail-rules quality report, dead gap code removed, bracket cap 4.
  - `426fa27` docs governance: `docs/product/README.md` index, decision register, status banners on superseded docs.
  - `80aaf80` US Letter (8.5x11) home-printer size: friendly size labels, size-aware grid start sizing, close-read quality grading (arm's-length advice, never "from a distance"), players floor lowered 8 to 2, exact 612x792pt PDF with all content inside 0.25in printer margins. Verified: 246 tests, typecheck, build; the concrete kids scenario (5 players, 10 activities) renders 10pt and grades good.

- Pending — **build next: named save/load of board configurations** (Jesse, 2026-07-22, verbatim intent: save the current configuration at any point under a chosen name; reload via a dropdown; no privacy needed; he refuses to set up the kids board if a later app change can destroy it):
  1. Store saved boards under a SEPARATE stable localStorage key (e.g. `game-board-saves-v1`) holding `{name, savedAt, schemaVersion, draft}` snapshots. Do NOT reuse the live-draft persist key `game-board-v5`: its versioned-key pattern deliberately orphans state on schema change, which is exactly the loss Jesse fears. On load, run the snapshot through the store's existing normalization (uid backfill, `enforceTemplateSize`) and tolerate older schemaVersions.
  2. UI: Save (name prompt/inline field; confirm on overwrite of an existing name) and a Load dropdown of saved names. Loading must reuse the existing confirm-before-replace semantics that preset loading uses. Suggested surface: Setup step or header near "Start over". Delete-a-save is optional polish.
  3. Tests: store-level save/list/load/overwrite + a step test. Cross-device sync is explicitly out of scope (localStorage is fine per Jesse).

- Changed files: see `git log --oneline ca17046..80aaf80`; per-area diffs via `git diff ca17046..80aaf80 -- src/app` etc.

- Verify command: `npm test && npx tsc --noEmit && npm run build` (246 tests green at `80aaf80`). Live check: `curl -fsS https://jessemaddox.com/gameboard`, fetch the referenced JS bundle, grep for a release-distinctive string such as "Letter (home printer)". Never verify against a pinned asset hash.

- Publish procedure (this repo to the live site): `npx vite build --base=/projects/gameboard/`, copy `dist/` over `~/claude/jessemaddox.com/projects/gameboard/`, commit ONLY that path in the site repo, then deploy with `~/.claude/bin/vercel-jessemaddox --prod --yes` from the site root. **Never bare `git push` the site repo** — it carries another session's large uncommitted site-rebuild that is live via CLI deploys; a push-triggered git deploy would revert it. Read the site repo's own `HANDOFF.md` first.

- Current risks / known issues: none in this repo; tree clean at `80aaf80`, local == origin. Vite's large-chunk warning is pre-existing and non-blocking. Manual visual QA in a real browser remains lightly covered (automated invariants + headless checks only).

- Do not repeat: Do not re-unify the gameboard and challenge-game content systems (dropped 2026-07-22). Do not rebuild the challenge game from this repo's historical `docs/product/2026-07-21-*` research (superseded by the challenge-game repo's docs). Do not store saved boards inside the `game-board-v5` persist entry.

- Suggested next step: Implement save/load exactly as scoped in Pending, verify, publish via the procedure above, and tell Jesse — he is waiting on it to build the kids weekend board (players: Jack, Bobbie, Shasha, Hunter, SG) and print it on Letter by 2026-07-23.

- Last tool + date: Claude (Fable 5), 2026-07-22. Codex is now the writer; no Claude session is active on this repo.
