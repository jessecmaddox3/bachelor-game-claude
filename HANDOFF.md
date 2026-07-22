# Handoff

- Original goal: Rebuild Jesse's 2017 bachelor game board as a shelf-stable poster generator. The separate Challenge Lab lives in `/Users/jesse/claude/challenge-game`.
- Current phase: Named board save/load is complete, verified, pushed, and live at `https://jessemaddox.com/gameboard` as of 2026-07-22. Product commit: `2e7f781`. Final site deploy commit: `a8464f4`.
- Done:
  - Named snapshots use the stable `game-board-saves-v1` localStorage key, separate from the disposable `game-board-v5` live draft.
  - Setup now has a named Save flow, overwrite confirmation, saved-board dropdown, and confirm-before-replace Load flow. Occasion presets remain separate.
  - Saved drafts share the store's normalization path, including default-field backfill, activity UID backfill, and the fixed `60x48` landscape rule. Older schema versions are tolerated.
  - Full gate passed: 256 tests, `tsc --noEmit`, and production build. Live bundle contains `game-board-saves-v1` and `Save board`.
  - The prior Letter-size, design, engine, content, and preview work remains live.
- Pending: Jesse can now build and save the kids board for Jack, Bobbie, Shasha, Hunter, and SG, then export the Letter version. A real-browser visual pass is optional follow-up, not a release blocker.
- Changed files: `src/store/savedBoards.ts`, `src/store/wizardStore.ts`, `src/app/steps/SetupStep.tsx`, `src/index.css`, three test files, and `docs/superpowers/plans/2026-07-22-named-board-saves.md`.
- Verify command: `npm test && npx tsc --noEmit && npm run build`. Site builds must use `npx vite build --base=/projects/gameboard/`. Live verification must fetch the JS path referenced by `/gameboard` and check for `game-board-saves-v1`.
- Current risks / known issues: Saves are intentionally browser-local and disappear if that browser's site storage is cleared. Cross-device sync is out of scope. Vite's large-chunk warning remains non-blocking.
- Workspace metadata note: this sandbox could not write this repo's local `.git`. The reviewed workspace files match the remote commits byte-for-byte, but local `git status` still compares them to old HEAD `fea943f`. In a Git-writable terminal, run `git fetch origin && git reset --mixed origin/main` to advance metadata without rewriting the worktree. Do not recommit the apparent duplicate changes.
- Do not repeat: Do not store named saves in `game-board-v5`. Do not build the site artifact without `/projects/gameboard/` as Vite's base. Do not reunify this product with Challenge Lab.
- Suggested next step: Jesse creates the kids board, saves it by name, and prints the Letter PDF.
- Last tool + date: Codex, 2026-07-22.
