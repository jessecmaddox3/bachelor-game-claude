# Handoff

- Original goal: Rebuild Jesse's 2017 bachelor game board as a shelf-stable
  names-plus-activities poster generator, then use the challenge library as the
  foundation for a private friend-and-family challenge game. Immediate focus:
  make the wizard UI genuinely good (it currently "sucks" per Jesse) and build
  out real event-specific activity content, then get it live on Vercel.

- Current phase: **Planning complete for the Setup + Activities redesign.**
  Claude (Opus, 2026-07-20) wrote a full build handoff for Codex to execute.
  Next actor is **Codex**. Two new planning docs are the source of truth:
  - `docs/product/2026-07-20-setup-and-activities-redesign-HANDOFF.md` — the
    build spec (interaction fixes, activities flow, visual design pass, build
    order, guardrails, deploy path, verify).
  - `docs/product/2026-07-20-activity-seed-library.md` — ~219 event-specific seed
    challenges across 8 occasions (adds a new `beach-trip` occasion), each with
    category + default points + difficulty + adultOnly, ready to wire into
    `src/content/activities.ts`.

- Done (this session): Confirmed Vercel migration is complete and healthy —
  `jessemaddox.com/gameboard` returns 200, Vercel auto-deploys `main`, the old
  Netlify "credits exceeded" block is gone (the improved picker is already live).
  Generated the full per-occasion seed library (8 parallel agents). Wrote the two
  planning docs above. Committed only those docs.

- Pending (Codex to build, per the redesign handoff, in this order):
  1. Data: add `beach-trip` occasion; port the seed library into
     `src/content/activities.ts`; update `RECOMMENDED_ACTIVITY_IDS`; keep
     `tests/content/content.test.ts` invariants green.
  2. Store: fix `wizardStore.ts` defaults so a fresh board is empty/sane; make
     occasion a single early choice.
  3. Setup step: rebuild player entry as chips + Enter-to-add; move occasion to
     top; make preset loading clearly opt-in (no filler rows to delete).
  4. Activities step: card UI + category grouping; inherit occasion from Setup.
  5. Visual pass: blue design-system token block in `index.css`; restyle both
     steps + wizard chrome + Design step.
  6. Verify, rebuild site output, push `jessemaddox.com` to deploy.

- Changed files (this session): NEW `docs/product/2026-07-20-*` (2 files) and
  updated `HANDOFF.md`. NOTE: the whole app remains uncommitted from prior Codex
  work (its sandbox couldn't write `.git`) — do NOT `git add -A`; stage narrowly.

- Verify command: `git diff --check && npx tsc --noEmit && npm test && npm run build`.
  Baseline before this session: typecheck clean, 180 tests pass, Vite build clean
  (existing chunk-size warning OK). Site rebuild: `npx vite build --base=/projects/gameboard/`.

- Current risks / known issues: Large uncommitted app diff predates this session;
  Codex should review/commit it as part of "cleaning the place up." Seed content
  has minor cross-occasion duplication by design (occasion-scoped); dedupe only on
  identical IDs. Adult-only rows must never land in kids-weekend defaults.

- Do not repeat: Do not rebuild the board engine, renderer, PDF/SVG export, or
  fonts pipeline — scope is the wizard UI + activity content only. Do not build
  the multiplayer "lobbing challenges" game here — it's a separate later project
  (`docs/product/2026-07-20-challenge-chain-mvp.md`). Do not reintroduce risky
  2017 legacy rows into generic/default sets.

- Suggested next step (Codex): Read the redesign handoff + seed library, then
  execute the build order above. Deploy via the site repo → Vercel path when done.

- Last tool + date: Claude Opus (planning + content generation via 8 sub-agents),
  2026-07-20. Next: Codex build.
