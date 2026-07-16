# Bachelor Game Board — Rebuild Design (v5)

Date: 2026-07-15
Status: Approved pending user review

## Why a rebuild

Four previous builds all failed at the same place: the renderer. Build 4 (the current repo) sized text as guessed percentages of its box and used Canvas 2D `fillText`'s `maxWidth` argument as the fitting fallback, which horizontally squishes glyphs instead of shrinking or wrapping. Long player names and task titles rendered distorted with no warning. This rebuild replaces the rendering pipeline from scratch. Content decisions (preset activities, game concept, wizard flow) carry over.

The rebuild happens in this repo: the old `src/` is replaced wholesale (git history preserves build 4), and `examples/` is kept as the reference material.

## Decisions locked during brainstorming

- Existing content (activities, themes, limits, wizard flow) carries over; content changes deferred to later.
- Quality bar: match the hand-made reference poster `examples/BACHELOR_Steven_GAME.pdf`, including its bespoke elements.
- Side-of-board tracker regions (e.g. beer pong bracket) are architected in now; actual tracker widgets are built later.
- Poster sizes: 18x24, 24x36, 36x48, 48x72 inches.
- Fit philosophy: auto-fit with honest quality warnings, never silent distortion.
- Export: both vector PDF (primary) and 300 DPI PNG.
- Architecture: SVG-first (Approach A) — measurement-driven layout engine producing a Scene, rendered by thin SVG/PDF/PNG backends.

## Architecture

React + TypeScript + Vite SPA with the three-step wizard (roster → activities → design) and localStorage persistence, over a strict one-way pipeline:

```
BoardSpec  →  measure  →  layout  →  Scene  →  SVG preview
(content +    (font      (auto-fit           →  PDF export (pdf-lib)
 design)      metrics)    solver)            →  PNG export (SVG rasterize)
```

### BoardSpec

The single Zod-validated input: players, activities, poster size, theme, design options, optional side-rail reservation. The wizard edits this and nothing else. Limits carried from build 4: 8–35 players, 5–80 activities.

### Measurement module

Loads the actual font files bundled with the app via `opentype.js`. Answers "how wide is this string at this point size" exactly. The PDF and PNG embed the same font files, so a measurement is identical across preview and every export.

### Layout engine

Pure TypeScript, zero DOM/React dependencies. `BoardSpec` in, `Scene` out. Deterministic, directly unit-testable in Node.

**Pass 1 — Region partition.** Poster divides into named regions: header (title, honoree, subtitle), rules strip, main scoring grid, and zero or more side rails. A side rail is a reserved vertical band (left or right of the grid) for future tracker widgets. In this build, a rail renders as a titled empty box if requested; no widgets ship. With no rail requested, the grid gets full width.

**Pass 2 — Grid solve.** Task-label column width is driven by the measured longest task name at the candidate font size. Player columns split the remainder evenly. If natural sizes don't fit, degrade in defined order: (1) shrink fonts stepwise toward the floor, (2) abbreviate — ellipsize task names at a max line count, wrap player names — and only then (3) report infeasible. Every step is a measured decision.

**Pass 3 — Quality score.** Grade the solved layout (final body point size, count of wrapped/ellipsized names, proximity to minimum row heights) into Good / Tight / Poor, shown live in the wizard with specific advice ("Consider 36x48 or fewer activities"). Export is allowed at any grade except infeasible.

**Print-informed floors:** body text ≥ 9pt physical size on the printed poster, rows ≥ 0.28", columns ≥ 0.55".

**Steven-poster bespoke elements are first-class layout primitives**, theme-controlled and on by default in the Steven-look theme:
- Highlight box around the "POSSIBLE POINTS" column header
- Bracket/arrow annotation pointing at bonus/TBD rows
- Solid divider rule between header and grid
- Blue-tinted alternate-row shading (replacing build 4's flat gray)

### Scene

Flat list of primitives — text runs, rects, lines — with final positions and sizes in inches. Every text run has already been measured and is guaranteed to fit its box. Renderers make no layout decisions.

### Renderers

- **SVG preview:** live-updates as the wizard edits the spec; screen-scaled but geometrically identical to print.
- **PDF export:** Scene drawn into `pdf-lib` with fonts embedded. True vector at exact physical dimensions; crisp and small even at 48x72.
- **PNG export:** rasterize the SVG at 300 DPI. Where that exceeds browser canvas limits (36x48 and up), render in horizontal strips and stitch; this path gets an automated test.

## Data model changes vs. build 4

- Theme gains Steven-style options: row-tint color, highlight box, annotation styles.
- `BoardSpec` gains the optional side-rail field.
- The Gemini AI-suggestions stub is dropped (future separate project if wanted).
- localStorage persistence keyed by schema version; build-4 saved boards are ignored, not migrated.

## Error handling

- Infeasible spec: export blocked with a specific message naming what to change (size up, or reduce players/activities).
- Tight/Poor quality: export allowed, warning shown with specific advice.
- Export failures (font load, canvas limits): surfaced as UI messages, never silent.

## Testing

- **Layout invariant tests (the core):** unit tests feed the pure engine extreme specs (35 long-named players, 80 activities, smallest poster, rail reserved) and assert no text run overflows its box and no primitive escapes its region — the bug class that killed builds 1–4, caught in CI.
- **Renderer snapshot tests:** SVG output snapshots for reference specs.
- **Integration test:** rebuild a Steven-equivalent 20-player board; eyeball-compare against the reference PDF.
- **PNG strip-stitch test:** automated coverage for the oversized-canvas path.

## Out of scope

- Actual side-rail tracker widgets (beer pong bracket, etc.)
- AI activity suggestions
- Migration of build-4 saved boards
- Content/activity list changes (deferred by Jesse)
