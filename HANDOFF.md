# Handoff

- Original goal: Rebuild Jesse's 2017 bachelor game board as a shelf-stable poster generator, simplify the builder from real-world feedback, and preserve the challenge research for a three-brother mobile web game.

- Current phase: The condensed gameboard release is live at `https://jessemaddox.com/gameboard`. Challenge Lab Tasks 1 through 6 are complete and accepted in `/Users/jesse/claude/challenge-game`; Task 7 is next.

- Done:
  - New boards start as `Kids Weekend` with the sorted family roster and no activities.
  - Setup now contains occasion, Title, Subtitle, and Participants only. Number ornaments were removed, occasion labels use capitalized emoji copy, wide layouts use four occasion columns, and added or edited participants stay alphabetized.
  - The complete historical board remains available as `My Bachelor Party Weekend`, with confirmation before it replaces any customized draft field.
  - Activity selection uses a compact two-column checkbox browser, occasion-ranked ideas, selected-only filtering, `Clear all`, and a lightweight custom-idea form. Wording and points editing moved to Design.
  - Poster size moved to Design. New-board export filenames fall back to Title when no legacy honoree exists.
  - Rules use one title and one safe rich-text-lite document. Paragraphs, paired bold spans, and measured bullets render in portrait and landscape, including hanging indents and honest fit failures.
  - Portrait and landscape cell text is measured independently. Sparse boards grow type, long unspaced labels wrap without dropped characters, and an unfittable landscape returns a generic content-fit message instead of an overflowing scene.
  - Full verification passed: 23 test files, 225 tests, TypeScript, Vite production build, and source `git diff --check`.
  - Independent re-review confirmed all original Important findings were fixed. A final wording defect in the landscape fit error was then fixed and covered.
  - Published website commit `7343189`; live HTML serves `assets/index-Mv37He1A.js`, and HTTP checks confirmed the expected new UI copy.
  - Challenge Lab Task 4 is accepted at `0e14ba0`. Task 5 identity and synchronization is accepted at `41368c3`, with 110 tests, typecheck, production and API builds, and a clean worktree.
  - Challenge Lab Task 6 full-catalog seeding is accepted at `fe42669`. It enforces exactly five categories, exposes all 18 challenge cards in each, requires one calibrated seed per category, blocks submission without two weekly-eligible choices, constructs a valid private seed event, and reveals only readiness in the waiting room. Its full suite has 118 passing tests.

- Pending:
  - Challenge Lab Task 7: build control, delegation, conflict resolution, and week lock.
  - Challenge Lab Task 10 must route production writes through Apps Script `LockService` before deployment because cross-request compare-and-swap remains intentionally deferred.
  - Perform a human visual pass in a normal browser when convenient. The in-app browser runtime was unavailable in this session, so release verification used automated layout invariants, production builds, and live HTTP checks.

- Changed files: Gameboard UI, defaults, activity catalog, historical preset, safe rules parser and renderer, adaptive layout helpers, export naming, regression tests, July 2026 product research, approved design specs, and implementation plans. Challenge Lab Task 5 changed its API client, Zustand store, identity gate, status banner, App integration, and tests in the separate `challenge-game` repo.

- Verify command: In this repo run `npm test && npm run build && git diff --check`. For the live release run `curl -fsS https://jessemaddox.com/gameboard | rg 'index-Mv37He1A.js'`. In `/Users/jesse/claude/challenge-game`, run `npm test && npm run typecheck && npm run build`.

- Current risks / known issues: The local gameboard worktree still appears dirty because this environment cannot write the source repository's Git metadata. The same verified files are saved to GitHub through an isolated writable clone. Vite reports non-blocking large-chunk warnings. Tests print a pre-existing non-blocking Node `--localstorage-file` warning.

- Do not repeat: Do not rebuild Tasks 1 through 6 of Challenge Lab. Do not remove the historical preset or flatten its source-faithful landscape hierarchy. Do not publish from the dirty local `jessemaddox.com` checkout; use an isolated clone and stage only `projects/gameboard`.

- Suggested next step: Implement and review Challenge Lab Task 7, then exercise the selection and lock mechanics across three local identities before adding results and debrief screens.

- Last tool + date: Codex with bounded implementation and read-only review agents, 2026-07-21.
