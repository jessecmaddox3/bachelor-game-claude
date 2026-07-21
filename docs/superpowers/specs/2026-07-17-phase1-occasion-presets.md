# Phase 1 Specification: Occasion Presets and Jesse 2017

> **TL;DR:** Add a typed occasion-pack registry and a wizard picker, ship the complete Jesse 2017 board as a feasible portrait preset, add compact range labels and a totals target, support four result boxes, and guarantee that rules are either fully composed or the build refuses honestly.

## Outcome

The wizard can replace the current draft with a complete named occasion pack. Selecting "Jesse's Bachelor 2017" loads the source roster, activity order and scoring, full agreement, result labels, colors, date, and total target. The result is usable in the existing portrait engine while the landscape structure remains scheduled for Phases 2 through 5.

## Data contract

An occasion pack has a stable ID, user-facing metadata, and a factory that creates a complete `Draft`. Factories must return independent arrays and fresh activity UIDs on every call. Applying a pack replaces the draft atomically and does not change the current wizard step.

The Jesse pack contains:

- 30 ordered players and 37 ordered activities from the source board.
- Exact integer, negative, range, and maximum-point mappings.
- Title `THE BACHELOR WEEKEND OF`, honoree `JESSE CORDELL MADDOX, III`, and subtitle `OCTOBER 19–22, 2017`.
- Four result labels, total target 100, dash-form ranges, and no synthetic bonus row.
- The agreement title, preamble, Sections 1 through 6, and all named Section 1 game rules.
- A 48x72 portrait size and teal-blue styling that the current engine can render feasibly.

## Reusable engine changes

`pointsLabel` keeps its existing word format by default and accepts a dash format. The selected format must be used in width measurement, scene composition, and the activity editor. `totalsTarget` is optional, contributes to points-column width, and renders once in the total row.

The schema and wizard allow four corner boxes. Rule limits increase enough to retain the source agreement. Rule composition preserves source line and paragraph boundaries and measures every heading and body line without a fixed six-line cap. Generic boards retain the `GAME RULES:` strip and heading colons, while source-faithful packs may suppress both. If all content cannot fit at the 5pt floor, `buildBoard` returns an infeasible result rather than omitting content.

Theme colors are validated as six-digit hex values at the schema boundary. The two optional tint fields also allow an empty string. This prevents valid `BoardSpec` input from reaching the PDF renderer with an unparseable color.

## Acceptance

- The registry exposes the Jesse pack and the Setup step can load it accessibly.
- The pack parses through `toBoardSpec`, strips editor UIDs, and preserves every source mapping.
- Two factory calls have different UIDs and independent nested data.
- The pack builds with production font metrics, reaches the agreement's final sentence, and has no text overflow or out-of-page primitives.
- Existing drafts retain word-form ranges and no totals target.
- Oversized rules produce a clear infeasible result.
- Unit tests, type checking, the production build, and the rasterized SVG/PDF sample all pass.

## Deferred

Landscape sizes, diagonal names, Montserrat, dual rails, rail-based result boxes and rules, inline points, and brackets remain in Phases 2 through 5. Pixel matching is not a Phase 1 goal.
