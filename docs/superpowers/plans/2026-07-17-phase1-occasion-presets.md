# Phase 1 Plan: Occasion Presets and Jesse 2017

> **TL;DR:** Implement the approved Phase 1 as five testable slices, preserving current defaults and the measured-rendering invariant.

## Implementation sequence

1. Extend `BoardSpec` and `Draft` with range display and totals-target fields. Raise synchronized result and rules caps, and reject unsafe color strings.
2. Update grid measurement and scene composition so compact ranges and the target are measured before rendering.
3. Replace the rules footer's truncating fallback with a measured all-content plan and an honest build refusal.
4. Add the occasion registry, the source-verified Jesse 2017 pack, atomic store replacement, and the Setup picker.
5. Add schema, content, store, UI, invariant, and visual sample coverage. Run the complete verification suite.

## Review gates

After implementation, compare the literal roster and activity mapping with the roadmap appendix and inspect the high-resolution source PDF for the masthead, result labels, agreement preamble, and closing sentence. Confirm that the generated portrait sample is intentionally not a landscape fidelity target.

The phase is complete only when `npm test`, `npm run build`, and `npx tsc --noEmit` succeed and `samples/jesse-2017-portrait.*` regenerate from the test suite.
