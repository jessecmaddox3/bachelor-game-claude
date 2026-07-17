# Manual QA checklist: wizard UI

A hands-on walkthrough of the poster wizard before merge. Everything here runs against the dev server:

```bash
npm run dev
```

Open the printed URL (usually `http://localhost:5173`) in Chrome first; repeat the export section in Safari and Firefox if you have them handy. Keep the browser console open (DevTools, Console tab) for the whole pass.

Tip for a clean start: the wizard saves your draft under the localStorage key `bachelor-board-v2`. To begin from factory defaults, run `localStorage.removeItem('bachelor-board-v2')` in the console and reload.

## 1. First load and fonts

- [ ] The app loads with a three-tab header (1. Setup, 2. Activities, 3. Design), a form panel on the left, and a poster preview on the right.
- [ ] Within a second or two the preview renders the full poster: teal "THE BACHELOR WEEKEND OF / YOUR GUY HERE" masthead, player-column grid, activities list, corner boxes.
- [ ] The masthead uses the heavy display font (Archivo Black) and the grid uses Lato. If text looks like Times/Helvetica fallback, the fonts did not load.
- [ ] No red errors in the console.

## 2. Live preview responsiveness

- [ ] On the Setup tab, type into Honoree. The preview masthead updates within about a second of you pausing (300ms debounce plus render).
- [ ] Typing stays smooth; keystrokes are not dropped while the preview re-renders.
- [ ] The quality badge above the preview shows a grade (GOOD / TIGHT / POOR), the body point size, and one line of advice.

## 3. Setup controls round-trip into the preview

- [ ] Title line: edit it; masthead top line changes.
- [ ] Honoree: edit it; masthead name changes (and the bonus footnote line that references the honoree).
- [ ] Subtitle: add one; it appears under the masthead. Clear it; it disappears.
- [ ] Poster size: switch between 18x24, 24x36, 36x48, 48x72; the preview aspect ratio and the quality badge's point size change.
- [ ] Players: rename a player (column header updates), remove one with the x button, add one with the "Add player…" field (Enter or the Add button). The grid gains/loses columns.
- [ ] Clearing a required field (for example Honoree) shows a clear validation message in the preview panel instead of a stale poster, and fixing it brings the poster back.

## 4. Activities controls round-trip

- [ ] "On the board" table: edit an activity name; the row in the preview updates (all-caps if the theme says so).
- [ ] Change a points value; the points column updates.
- [ ] Change/clear a Max value; the max-points column updates.
- [ ] Remove an activity with the x button; the row disappears from the poster.
- [ ] Library: category chips (all, drinking, physical, service, challenge, game, social, wildcard) filter the list; adding a library item appends it to the board and the preview.
- [ ] "+ Custom activity" appends an editable "New activity" row to the board and the preview.
- [ ] Options: "Blank write-in rows" (0-5) adds empty ruled rows to the poster; the "Honoree bonus row" checkbox adds/removes the bonus row and its footnote.

## 5. Design controls round-trip

- [ ] Theme preset chips (Classic Teal, Ink, Casino, Outdoors) restyle the whole poster within a second. Casino goes gold/green with cream tints; Outdoors goes forest green; Ink is the clean engine-default look (black on white, red highlights).
- [ ] Note: clicking a preset REPLACES any color customizations you have made, by design. Verify: change Title color, then click a preset, and confirm your custom color is gone.
- [ ] Individual color pickers (Title, Accents, Activities, Highlights, Row tint, Points column tint, Max points column tint) each update the corresponding element in the preview.
- [ ] "clear" next to the two column tints removes that tint from the preview.
- [ ] ALL-CAPS toggle changes activity-name casing in the preview.
- [ ] Corner label / corner boxes: edit, add (up to 3), and remove; the corner boxes on the poster follow.
- [ ] Rules: edit text and optional heading, add and remove rules; the rules block on the poster follows. Footnote round-trips too.

## 6. Quality badge degradation

- [ ] Start from a GOOD badge on 24x36. Switch to 18x24 and add players and activities: the badge should walk down GOOD -> TIGHT -> POOR (green -> orange -> red) as the layout compresses, with advice text explaining what to shrink.

## 7. Infeasible layout message

- [ ] Set poster size 18x24 and add players until you hit 35. The preview is replaced by a plain-language message: "35 players and 20 activities cannot fit legibly on a 18x24 poster. Choose a larger size or remove players/activities."
- [ ] Recover by choosing a larger size or removing players; the poster comes back.

## 8. PDF export

- [ ] On the Design tab, click "Download PDF (print quality)". First click fetches an extra ~1.1MB code chunk, so expect a short delay; the button shows "Rendering…".
- [ ] A file like `YOUR-GUY-HERE-24x36-print.pdf` downloads, opens in a PDF viewer, matches the preview, and is the correct page size.
- [ ] Text in the PDF is selectable (embedded fonts, not a screenshot).

## 9. PNG export

- [ ] The PNG button label shows the actual achievable DPI for the current size: "Download PNG (300 DPI)" on 24x36.
- [ ] Switch to 48x72: the label drops to 227 DPI (browser canvas size limit; this is honest, not a bug), and a note explains the PDF is full quality at any size.
- [ ] Click it; a file like `YOUR-GUY-HERE-24x36-300dpi.png` downloads and its pixel dimensions match size x DPI (for 24x36 at 300 DPI: 7200 x 10800).

## 10. Persistence and reset

- [ ] Make a few distinctive edits (honoree, a renamed activity, a theme), reload the page: everything is restored, including the tab you were on.
- [ ] Reset to factory defaults: click "Start over" in the header and confirm the dialog; the app returns to the starter draft on the Setup tab. Cancel the dialog once first and confirm nothing is lost. (Fallback: run `localStorage.removeItem('bachelor-board-v2')` in the DevTools console and reload.)

## Known limitations

- **Safari PNG export may fail.** Safari's canvas limits are lower and less detectable; the app probes first and shows a clear error telling you to use the PDF export instead. That error is the expected behavior, not a bug.
- **First load fetches ~1.4MB of fonts** (Archivo Black plus two Lato weights). On a slow connection the preview text can render in a fallback font for a moment; it settles once the fonts finish loading.
- **The PDF button lazy-loads a ~1.1MB chunk on first click** (pdf-lib and friends). The first PDF export per session is slower than the rest; later clicks are instant.

## Accessibility polish backlog

Deferred review items, not blockers for this merge:

- Step tabs need `aria-label` on the nav and `aria-current="step"` (or `aria-selected`) on the active tab so screen readers announce position in the wizard.
- The preview pane should be a labeled region (`role="region"` with an `aria-label` like "Poster preview") so it is discoverable and its quality/error announcements have context.
