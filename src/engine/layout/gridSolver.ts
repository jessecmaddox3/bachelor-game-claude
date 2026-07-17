import type { BoardSpec } from '../../models/boardSpec';
import { pointsLabel } from '../../models/boardSpec';
import type { Box } from '../geometry';
import type { FontMetrics } from '../fonts/metrics';
import { wrapToWidth, hardEllipsize } from './wrap';

// Print-informed floors (from the spec)
export const FLOOR_PT = 9;
export const MIN_COL_W = 0.55;
export const MIN_ROW_H = 0.28;
export const CELL_PAD = 0.08;

/** Rotated header text for the points column (single source of truth). */
export const POINTS_HEADER = 'POSSIBLE POINTS';

/** Rotated header text for the max-points column (single source of truth). */
export const MAX_POINTS_HEADER = 'MAX POINTS';

/** Rotated subheader under the points header. */
export const POINTS_SUBHEADER = '(PER ACCOMPLISHMENT)';

/** Rotated subheader under the max-points header. */
export const MAX_POINTS_SUBHEADER = '(IF BLANK, CAN ONLY BE DONE ONCE)';

/** Totals-row label in the task column (single source of truth). */
export const TOTALS_LABEL = 'TOTAL';

export interface GridLayout {
  feasible: true;
  bodyPt: number;
  headerBandH: number;
  rowH: number;
  taskColW: number;
  pointsColW: number;
  /** Width of the MAX POINTS column; 0 when no activity carries maxPoints (column absent). */
  maxPointsColW: number;
  playerColW: number;
  /** Total scored rows drawn: activities + writeInRows + honoree bonus row (if any). */
  displayRows: number;
  /** wrapped (and possibly ellipsized) label lines, per activity */
  taskLines: string[][];
  /** player names, possibly ellipsized to fit the header band */
  playerNames: string[];
  degradations: { wrappedTasks: number; ellipsized: number };
}

export interface Infeasible {
  feasible: false;
  reason: string;
}

export type SolveResult = GridLayout | Infeasible;

/**
 * Walk a font-size ladder from a poster-scaled starting size down to the
 * floor; the first size whose fully-measured layout fits wins. Degradations
 * (wrapping, ellipsizing) happen inside each attempt and are reported, never
 * silent.
 *
 * The ladder is aligned to the 0.5pt grid (the start is floored to a 0.5
 * multiple, and 0.5 is binary-exact), so FLOOR_PT is always the final rung
 * tried and every solved bodyPt is a clean 0.5 multiple.
 */
export function solveGrid(grid: Box, spec: BoardSpec, m: FontMetrics): SolveResult {
  const startPt = Math.min(20, Math.max(FLOOR_PT, Math.floor(grid.h * 0.7 * 2) / 2));
  for (let pt = startPt; pt >= FLOOR_PT; pt -= 0.5) {
    const layout = tryFit(grid, spec, m, pt);
    if (layout) return layout;
  }
  return {
    feasible: false,
    reason:
      `${spec.players.length} players and ${spec.activities.length} activities cannot fit legibly ` +
      `on a ${spec.posterSize} poster. Choose a larger size or remove players/activities.`,
  };
}

function tryFit(grid: Box, spec: BoardSpec, m: FontMetrics, pt: number): GridLayout | null {
  const lineH = m.lineHeightIn('body', pt);
  let ellipsized = 0;

  // Header band: rotated player names need vertical room equal to their measured width.
  const bandCap = grid.h * 0.22;
  const longestName = Math.max(...spec.players.map((p) => m.widthIn(p, 'bodyBold', pt)));
  // Band minimum: always tall enough for the rotated points header at up to 10pt,
  // so uniformly short player names can never squeeze it out of the header band.
  // When the max-points column is present, its rotated header needs the same guarantee.
  const hasMax = spec.activities.some((a) => a.maxPoints !== undefined);
  const ppNeed = Math.max(
    m.widthIn(POINTS_HEADER, 'bodyBold', Math.min(pt, 10)),
    hasMax ? m.widthIn(MAX_POINTS_HEADER, 'bodyBold', Math.min(pt, 10)) : 0,
  );
  let headerBandH = Math.max(longestName, ppNeed) + 2 * CELL_PAD;
  let playerNames = [...spec.players];
  if (headerBandH > bandCap) {
    headerBandH = bandCap;
    playerNames = spec.players.map((p) => {
      const r = hardEllipsize(p, bandCap - 2 * CELL_PAD, 'bodyBold', pt, m);
      if (r.ellipsized) ellipsized++;
      return r.text;
    });
  }

  // Points column sized to its widest display label ("999", "TBD", or "1 to 6");
  // the honoree bonus row contributes its synthetic "-5 to 5" label.
  const pointsColW = Math.max(
    MIN_COL_W,
    Math.max(
      spec.honoreeBonusRow ? m.widthIn('-5 to 5', 'bodyBold', pt) : 0,
      ...spec.activities.map((a) => m.widthIn(pointsLabel(a.points), 'bodyBold', pt)),
    ) + 2 * CELL_PAD,
  );

  // Max-points column only exists when some activity carries a maxPoints cap.
  const maxPointsColW = hasMax
    ? Math.max(
        MIN_COL_W,
        Math.max(
          ...spec.activities
            .filter((a) => a.maxPoints !== undefined)
            .map((a) => m.widthIn(String(a.maxPoints), 'bodyBold', pt)),
        ) + 2 * CELL_PAD,
      )
    : 0;

  // Task column: natural measured width, capped at 34% of the grid; wrap to 2 lines past the cap.
  // The column must also host the bold TOTALS_LABEL. The inner text budget is computed
  // ONCE and the column width derived from it — never the reverse — so the widest name
  // fits its wrap budget by exact float equality (no +pad/-pad round trip).
  const capInner = grid.w * 0.34 - 2 * CELL_PAD;
  const totalNeed = m.widthIn(TOTALS_LABEL, 'bodyBold', pt);
  // The honoree bonus row's bold label widens the column while the cap is slack;
  // when the cap binds, the explicit rejection below guarantees the fit instead.
  const bonusNeed = spec.honoreeBonusRow
    ? m.widthIn(`**BONUS POINTS GRANTED BY ${spec.honoree.toUpperCase()}**`, 'bodyBold', pt)
    : 0;
  const naturalInner = Math.max(totalNeed, bonusNeed, ...spec.activities.map((a) => m.widthIn(a.name, 'body', pt)));
  const taskInner = Math.min(naturalInner, capInner);
  const taskColW = taskInner + 2 * CELL_PAD;
  // The bonus label renders as a single line; reject rungs where the cap-bound
  // column can't hold it — the ladder shrinks bonusNeed until it fits.
  if (spec.honoreeBonusRow && bonusNeed > taskInner) return null;
  let wrappedTasks = 0;
  const taskLines = spec.activities.map((a) => {
    const r = wrapToWidth(a.name, taskInner, 'body', pt, m, 2);
    if (r.lines.length > 1) wrappedTasks++;
    if (r.ellipsized) ellipsized++;
    return r.lines;
  });

  // Player columns split the remainder; rotated names also need horizontal room for one line height.
  const playerColW = (grid.w - taskColW - pointsColW - maxPointsColW) / spec.players.length;
  if (playerColW < Math.max(MIN_COL_W, m.lineHeightIn('bodyBold', pt) + 2 * CELL_PAD)) return null;

  // Rows: activities + write-ins + honoree bonus + one totals row share what the
  // header band leaves. The floor check considers only activity task lines
  // (write-in/bonus rows are single-line by construction).
  const displayRows = spec.activities.length + spec.writeInRows + (spec.honoreeBonusRow ? 1 : 0);
  const maxLines = Math.max(...taskLines.map((l) => l.length));
  const rowH = (grid.h - headerBandH) / (displayRows + 1);
  if (rowH < Math.max(MIN_ROW_H, maxLines * lineH + 2 * CELL_PAD)) return null;

  return {
    feasible: true,
    bodyPt: pt,
    headerBandH,
    rowH,
    taskColW,
    pointsColW,
    maxPointsColW,
    playerColW,
    displayRows,
    taskLines,
    playerNames,
    degradations: { wrappedTasks, ellipsized },
  };
}
