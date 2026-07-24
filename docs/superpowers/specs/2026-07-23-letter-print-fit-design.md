# US Letter Print Fit Design

## TL;DR

The portrait 8.5 × 11 inch output will gain explicit Letter-layout controls and honest capacity guidance. Users can keep the current large masthead or choose a compact single-line header, include or hide rules without deleting them, and see an estimated activity capacity calculated by the same layout solver that produces the board. On Letter only, points and maximum points will share one column using values such as `3 (6)`. Existing large-poster and historical landscape output will remain unchanged by default.

In the conservative five-player Camp SheiShei fixture with moderately long activity names and capped `3 (6)` scoring, the measured limits are about 13 activities with Large Header and rules, 15 with Compact Header and rules, 16 with Large Header and no rules, and 17 with Compact Header and no rules. These figures validate the design direction, but the product will label future-row capacity as an estimate because unknown activity wording can change fit.

## Goal and Success Criteria

The goal is to make the home-printer board use Letter paper efficiently without sacrificing legibility, predictable exports, or the user's control over visible content.

The change succeeds when:

- a five-player Letter board can gain several additional activity rows by choosing Compact Header, hiding rules, or both;
- rules can be excluded from the export and later restored with their content unchanged;
- a capped activity displays one scoring cell such as `3 (6)` rather than separate possible-points and max-points columns;
- the interface reports the current activity count and an honestly labeled estimate of how many activities fit under the current Letter settings;
- an overloaded board explains approximately how many rows must be removed and which Letter controls can create space;
- the Letter PDF remains exactly 612 × 792 points with every printable primitive at least 0.25 inches from the page edge; and
- existing large-poster and landscape boards render as before unless the user explicitly turns off printed rules.

## Current Behavior and Constraints

The current Letter geometry uses 0.5-inch page margins, a 1.21-inch title band, 0.25-inch region gaps, and a fixed 1.5-inch rules band whenever rules or a footnote exist. With rules included, those reserved regions consume roughly 28 percent of the usable vertical sheet before the activity grid is solved.

Grid feasibility is not a simple function of activity count. It emerges from the measured font-size ladder, the longest rotated player name, task wrapping, scoring-label width, write-in rows, bonus rows, and the remaining grid height. Capacity guidance must therefore reuse the real region and grid-solving path. A separately maintained capacity formula is prohibited.

The 0.5-inch Letter margin will remain unchanged. Although reducing it can recover additional rows in a synthetic test, printer hardware varies and the current margin is the more dependable home-printing choice.

## User-Facing Design

The Design step will show a Letter Layout panel whenever the portrait template and 8.5 × 11 inch size are selected. The panel will contain the title-layout control and Letter fit guidance. The existing Rules section will gain the printed-rules control.

The controls and defaults are:

| Control | Choices | Default |
|---|---|---|
| Letter header | Large Header, Compact Header | Large Header |
| Include rules on printout | On, Off | On |

Large Header is the existing masthead and preserves established boards. Compact Header is a 0.65-inch band containing the title in the display face and any secondary headline in smaller accent text on the same line.

The secondary headline is assembled from the legacy honoree and subtitle fields. When both exist, they are separated by a centered dot. The title and secondary headline are measured as one centered group with a 0.18-inch visual gap. The title starts at 28 points and may step down by 0.5 points to a 12-point floor. The secondary headline starts at 14 points and scales down with the title to an 8-point floor. The engine must not omit, truncate, or silently wrap either value. If the complete compact headline cannot fit at those floors, the board becomes infeasible with guidance to shorten the headline or select Large Header.

Compact Header and corner award boxes are incompatible because multiple existing boxes become illegible inside the shallow band. While Compact Header is selected, the Add Corner Box control is disabled with an explanation. While any corner boxes exist, Compact Header is disabled. A loaded or externally constructed board containing both produces an actionable infeasibility result rather than silently changing the selected layout.

The Rules section keeps its editor visible when printed rules are off and labels the content as saved but not included. Re-enabling the control restores the rules exactly as entered. An empty rules document continues to reserve no rules region.

The Letter scoring header will read `POINTS` with a smaller `(MAX)` sublabel. A capped activity will render its primary points and smaller parenthetical maximum on one baseline, for example `3 (6)`. An uncapped activity renders only its primary points. Inline rendering is required because a second scoring line would increase the minimum activity-row height and defeat the space-saving goal.

The fit guidance will use copy such as:

> 10 selected. About 6 more activities fit with the current Letter layout.

If the current board is overloaded, it will use copy such as:

> 17 activities selected. About 16 fit with the current Letter layout. Remove about 1, choose Compact Header, or hide the rules.

The actual render verdict is exact. Only the capacity of unknown future activities uses `about`. The fit guidance appears beside the Letter controls and in the Activities step whenever the saved poster size is already Letter. No capacity guidance is shown for large-poster or landscape output.

## Data Model and Compatibility

`Draft` and `BoardSpec` gain two persisted fields:

- `letterHeaderStyle: 'large' | 'compact'`, defaulting to `'large'`;
- `includeRules: boolean`, defaulting to `true`.

`letterHeaderStyle` affects rendering only when the template is portrait and the poster size is `8.5x11`. It remains stored when the user switches sizes so the preference returns if Letter is selected again.

`includeRules` is a content-visibility choice rather than a Letter-only geometry choice. When false, rules and footnotes are omitted from portrait and landscape exports while the source fields remain intact. The default preserves all existing output.

Saved-board normalization and live-draft backfill apply both defaults to older data. Points and maximum points remain separate typed fields. Their combination is display-only and does not change saved data or editing controls.

For Letter's combined scoring column, `pointsColTint` colors the combined column. `maxPointsColTint` remains stored for larger posters but is hidden from the Letter color controls because no separate max-points column exists.

## Layout Architecture

Portrait layout will use one authoritative measured planning path before scene composition. The path produces the header region, optional rules region and rules plan, grid region, solved grid, and fit guidance inputs. Scene composition consumes that plan rather than recomputing geometry.

The existing region partitioning API may accept explicit measured header and rules heights, or a new portrait planner may own those values before calling a lower-level partitioner. In either structure, rules measurement must not import or duplicate grid-fitting rules, and scene composition must not choose different dimensions from the planner.

Large Header retains the current height calculation. Compact Header uses a Letter-specific fixed 0.65-inch band. Other poster sizes retain the existing proportional header behavior.

When printed rules are disabled or no printable rules content exists, rules height is zero. For Letter with printed rules, the planner searches candidate band heights from 0.75 to 2.5 inches in 0.05-inch increments and selects the smallest height whose existing measured rules plan renders at 8 points or larger. These values are named constants and covered by tests. If the content cannot meet the target at 2.5 inches, the build returns a rules-specific error suggesting shorter rules or hiding them. Non-Letter rules sizing keeps the current behavior.

The Letter scoring solver uses a single measured scoring column. Its width is the maximum width of the actual displayed scoring groups, including point ranges, `TBD`, optional maximums at their smaller type ratio, the total-points target, and the synthetic honoree-bonus range. `maxPointsColW` is zero in this mode. Large portrait posters continue using the two existing columns, and the landscape layout remains unchanged.

## Capacity Analysis

A pure Letter-capacity analyzer will call the same measured portrait planner and `solveGrid` path used by the current render. It will not render SVG, PDF, or PNG primitives.

For the selected board, feasibility comes directly from the real build. To estimate the total activity capacity, the analyzer constructs monotonic probe specifications from the current board:

- one synthetic representative combines the selected activity name with the greatest measured 9-point width, the selected points value with the greatest displayed width, and the widest selected maximum-points value;
- every probe contains repeated copies of that representative, so each probe retains the selected board's most demanding task and scoring constraints;
- all actual players, scoring settings, write-ins, bonus-row settings, header choice, rules visibility and content, and Letter geometry remain unchanged; and
- a bounded binary search finds the largest feasible activity count from the schema minimum through the 80-row schema maximum.

Repeating the composite row is conservative relative to the selected activity set without requiring a second layout formula. A future activity with more demanding wording can still change the result. The UI therefore says `about` for future capacity and immediately recalculates after every content change.

Because the representative row combines independent worst cases, it can be stricter than a heterogeneous current board. If the representative probe estimates fewer rows than are currently selected, the analyzer runs the real selected-board grid solve and treats a successful current solve as the lower bound. A board that already renders successfully must never receive removal guidance from the future-capacity estimate.

Probe feasibility must be monotonic for the constructed sequence. Tests will assert this invariant. If the invariant is ever violated, the analyzer falls back to a bounded linear scan rather than returning an incorrect maximum.

Capacity analysis is debounced with the existing board update and memoized by the layout-relevant specification. It must not execute once per visible activity card or perform full scene composition for each probe.

## Error Handling

Build failures will carry structured fit details where available rather than only a prose reason. The UI may format those details differently in Preview and Activities, but both surfaces must use the same result.

The required Letter-specific errors are:

- compact headline cannot fit at the minimum type sizes;
- Compact Header conflicts with corner boxes;
- included rules cannot fit at the Letter rules target within the maximum rules band;
- the selected player and activity configuration cannot fit the remaining grid, accompanied by the estimated supported count when available.

An estimate alone never makes a board infeasible. Only the authoritative rules or grid planner can block export. The UI must never automatically hide rules, switch the header style, remove activities, remove corner boxes, or reduce type below the existing legibility floors.

## Testing and Verification

The implementation will use focused engine, store, and UI tests in addition to the full repository gate.

Engine tests will cover:

- Large Header preserving current Letter geometry;
- Compact Header height, same-line title and secondary headline, legacy honoree handling, headline-fit failure, and no overflow;
- the Compact Header and corner-box conflict;
- rules omitted when `includeRules` is false while source content survives validation;
- short rules receiving a smaller band than long rules at the target type size;
- an actionable failure when included rules exceed the Letter maximum band;
- combined Letter scoring for integers, ranges, `TBD`, capped and uncapped rows, totals, and honoree bonus;
- large portrait posters retaining separate `POSSIBLE POINTS` and `MAX POINTS` headers;
- capacity-probe monotonicity and agreement with actual solver feasibility for the constructed probes;
- ready and overloaded Letter fit details; and
- all existing overflow, page-boundary, exact-PDF, and printer-safe-zone invariants.

Store and UI tests will cover:

- default and older saved drafts backfilling Large Header and included rules;
- Letter controls appearing only in the applicable layout;
- rule content remaining editable and unchanged while excluded;
- Compact Header and corner-box controls disabling one another clearly;
- Letter hiding the separate max-points tint control without deleting its value;
- ready and overloaded fit guidance in Preview;
- Letter fit guidance in Activities after Letter has been selected; and
- exports remaining disabled whenever the authoritative build is infeasible.

The full verification gate is:

```bash
npm test
npx tsc --noEmit
npm run build
```

Manual verification will create a five-player Camp SheiShei-style board, compare all four Large/Compact and Rules On/Off combinations, inspect a capped `3 (6)` row at 100 percent preview zoom, and export a Letter PDF for page-size and visual inspection.

## Scope Boundaries

This work does not reduce printer margins, move poster-size selection earlier in the wizard, automatically change layout settings, estimate capacity for large posters, change activity-library content, alter the historical landscape layout, or merge points and maximum points on large portrait posters.

Deleting saved rules content, changing the schema's 80-activity maximum, cross-device saved-board synchronization, and redesigning corner award boxes are also out of scope.
