# docs/product/ index

Dated 2026-07-22. This repo (`bachelor-game-claude`) and `/Users/jesse/claude/challenge-game` are
intentionally separate products (see `2026-07-22-decision-register.md`). Files below are listed
oldest first; status meanings are ACTIVE (current and accurate for this repo), HISTORICAL
REFERENCE/RESEARCH (kept for context, not a build target), COMPLETED (its work shipped), or
SUPERSEDED (a newer document replaced it).

| File | What it is | Status |
|---|---|---|
| `2026-07-18-beyond-the-board.md` | Founding product-direction memo proposing one challenge library powering many formats (board, app, cards, etc.) | HISTORICAL REFERENCE: the "one library, many formats" architecture was abandoned when the products split (2026-07-22); its five Human Review Questions were resolved by later decisions, see `2026-07-22-decision-register.md` |
| `2026-07-18-codex-claude-review.md` | Joint Codex/Claude review converging on five shared conclusions about the board vs. the broader challenge idea | HISTORICAL REFERENCE (process doc) |
| `2026-07-18-starter-challenge-catalog.md` | 100-item human-review challenge catalog draft (10 packs), first "Spark/Try/Stretch/Quest" point ladder | SUPERSEDED by the challenge atlas work; canonical catalog now lives in `challenge-game` repo |
| `2026-07-20-activity-seed-library.md` | Per-occasion gameboard activity seed content, written as a build spec for Codex | ACTIVE for the gameboard, with a caveat: shipped data in `src/content/activitySeeds.ts` is the source of truth, this doc describes intent, not exact shipped text (see banner) |
| `2026-07-20-challenge-chain-mvp.md` | First challenge-game MVP spec (single active challenge, turn-passing chain) | SUPERSEDED (banner already in file); mechanics research preserved, superseded by motivation/atlas research and then by the weekly three-brother lab format |
| `2026-07-20-setup-and-activities-redesign-HANDOFF.md` | Build handoff for the gameboard Setup/Activities UI redesign and per-occasion seed library | COMPLETED: built 2026-07-20/21, refined 2026-07-22 (review-pass release, commit `33e1b00`) |
| `2026-07-21-challenge-atlas-360.md` | 360-item challenge candidate atlas across 20 categories | HISTORICAL RESEARCH for the challenge game; canonical product docs now live in `/Users/jesse/claude/challenge-game` |
| `2026-07-21-challenge-atlas-editorial-review.md` | Editorial QA pass on the 360-item atlas, proposed 80-item shortlist | HISTORICAL RESEARCH for the challenge game; canonical product docs now live in `/Users/jesse/claude/challenge-game` (its shortlist recommendation was superseded, see decision register) |
| `2026-07-21-challenge-difficulty-scoring-audit.md` | Difficulty/points ladder audit across the full atlas | HISTORICAL RESEARCH for the challenge game; canonical product docs now live in `/Users/jesse/claude/challenge-game`. Note: this copy has drifted from the challenge-game repo's copy; the challenge-game copy wins |
| `2026-07-21-challenge-game-naming-and-design-prompts.md` | Prompts for naming and visual-identity exploration | HISTORICAL RESEARCH for the challenge game; canonical product docs now live in `/Users/jesse/claude/challenge-game` |
| `2026-07-21-challenge-motivation-and-gameplay.md` | Motivation research, recommends building around a "Return Serve" reciprocal-exchange loop | HISTORICAL RESEARCH for the challenge game; canonical product docs now live in `/Users/jesse/claude/challenge-game`. Its Return Serve recommendation was set aside same-day for the weekly three-brother lab format (see decision register) |
| `2026-07-21-cooperative-rivalry-mechanics-library.md` | Library of cooperative-rivalry mechanics (linked partnerships, simultaneous commitments, etc.) | HISTORICAL RESEARCH for the challenge game; canonical product docs now live in `/Users/jesse/claude/challenge-game` |
| `2026-07-22-decision-register.md` | Dated register of the product-split and challenge-game direction decisions made 2026-07-21/22 | ACTIVE |

For all challenge-game product status, tasks, and mechanics decisions, `/Users/jesse/claude/challenge-game/HANDOFF.md`, `PROJECT-INTENT.md`, `MECHANICS-DECISIONS.md`, and `ARCHITECTURE.md` are canonical, not this directory.
