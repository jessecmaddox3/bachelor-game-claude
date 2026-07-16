import type { BoardSpec } from '../../models/boardSpec';
import type { Regions } from '../layout/regions';
import type { GridLayout } from '../layout/gridSolver';
import type { FontMetrics, FontId } from '../fonts/metrics';
import type { Scene, Primitive } from './types';
import type { Box } from '../geometry';
import { fitSizePt } from '../layout/wrap';
import { CELL_PAD } from '../layout/gridSolver';
import { INK, GRID_LINE, PAGE_BG } from './colors';

export function composeScene(spec: BoardSpec, regions: Regions, layout: GridLayout, m: FontMetrics): Scene {
  const prims: Primitive[] = [];
  prims.push({ kind: 'rect', box: { x: 0, y: 0, w: regions.pageW, h: regions.pageH }, fill: PAGE_BG });

  composeHeader(spec, regions, m, prims);
  if (regions.rail) composeRail(regions.rail, m, prims);
  composeGrid(spec, regions.grid, layout, m, prims);

  return { widthIn: regions.pageW, heightIn: regions.pageH, primitives: prims };
}

/**
 * Centered fitted single-line text inside a box. Skips silently only if even
 * 8pt cannot fit. Returns the fitted pt size (null if skipped).
 */
function fittedLine(
  text: string,
  box: Box,
  fontId: FontId,
  m: FontMetrics,
  prims: Primitive[],
  maxPt = 300,
): number | null {
  const pt = fitSizePt(text, box.w, box.h, fontId, m, maxPt, 8);
  if (pt === null) return null;
  prims.push({ kind: 'text', box, text, fontId, sizePt: pt, color: INK, align: 'center' });
  return pt;
}

function composeHeader(spec: BoardSpec, regions: Regions, m: FontMetrics, prims: Primitive[]) {
  const h = regions.header;
  // Single truthiness source: an empty-string subtitle behaves exactly like an
  // absent one (2-row header, and the last row — the honoree — is never capped).
  const subtitle = spec.subtitle;
  const hasSubtitle = Boolean(subtitle);
  const rows: Array<[string, number, FontId]> = subtitle
    ? [
        [spec.title, 0.5, 'display'],
        [spec.honoree, 0.32, 'display'],
        [subtitle, 0.18, 'bodyBold'],
      ]
    : [
        [spec.title, 0.6, 'display'],
        [spec.honoree, 0.4, 'display'],
      ];

  let y = h.y;
  let titlePt: number | null = null;
  rows.forEach(([text, frac, fontId], i) => {
    const rowBox: Box = { x: h.x + h.w * 0.05, y, w: h.w * 0.9, h: h.h * frac * 0.9 };
    // Rows are fitted independently, so a width-constrained long title could
    // otherwise land smaller than its caption. Cap the subtitle (last row when
    // present) at 80% of the title's fitted size: the subtitle must never
    // visually outrank the title. Honoree stays uncapped by design.
    const isSubtitle = hasSubtitle && i === rows.length - 1;
    const maxPt = isSubtitle && titlePt !== null ? titlePt * 0.8 : 300;
    const pt = fittedLine(text, rowBox, fontId, m, prims, maxPt);
    if (i === 0) titlePt = pt;
    y += h.h * frac;
  });

  if (spec.theme.headerDivider) {
    const dy = h.y + h.h + 0.1;
    prims.push({ kind: 'line', x1: h.x, y1: dy, x2: h.x + h.w, y2: dy, color: INK, widthIn: 0.03 });
  }
}

function composeRail(rail: NonNullable<Regions['rail']>, m: FontMetrics, prims: Primitive[]) {
  prims.push({ kind: 'rect', box: rail.box, stroke: INK, strokeWidthIn: 0.03 });
  const titleBox: Box = { x: rail.box.x + 0.15, y: rail.box.y + 0.15, w: rail.box.w - 0.3, h: 0.6 };
  // The 8pt floor is a deliberate render-tiny-rather-than-drop tradeoff: a 40-char title on a 3" rail lands at exactly 8pt.
  fittedLine(rail.title, titleBox, 'bodyBold', m, prims);
}

function composeGrid(spec: BoardSpec, grid: Box, L: GridLayout, m: FontMetrics, prims: Primitive[]) {
  const n = spec.players.length;
  const rows = spec.activities.length;
  const playersX = grid.x + L.taskColW + L.pointsColW;
  const rowY = (r: number) => grid.y + L.headerBandH + r * L.rowH;
  const gridBottom = rowY(rows + 1); // activities + totals row
  const lineH = m.lineHeightIn('body', L.bodyPt);

  // Alternate-row tint (subtle blue per theme), behind everything else in the grid
  for (let r = 0; r < rows; r++) {
    if (r % 2 === 1) {
      prims.push({ kind: 'rect', box: { x: grid.x, y: rowY(r), w: grid.w, h: L.rowH }, fill: spec.theme.rowTint });
    }
  }

  // Rotated player names in the header band (L.playerNames: possibly-ellipsized,
  // same length as spec.players per the GridLayout contract)
  L.playerNames.forEach((name, i) => {
    prims.push({
      kind: 'text',
      box: {
        x: playersX + i * L.playerColW + CELL_PAD,
        y: grid.y + CELL_PAD,
        w: L.playerColW - 2 * CELL_PAD,
        h: L.headerBandH - 2 * CELL_PAD,
      },
      text: name,
      fontId: 'bodyBold',
      sizePt: L.bodyPt,
      color: INK,
      align: 'left',
      rotate: -90,
    });
  });

  // Rotated POSSIBLE POINTS header in the points column
  const ppBox: Box = {
    x: grid.x + L.taskColW + CELL_PAD,
    y: grid.y + CELL_PAD,
    w: L.pointsColW - 2 * CELL_PAD,
    h: L.headerBandH - 2 * CELL_PAD,
  };
  const ppPt = fitSizePt('POSSIBLE POINTS', ppBox.h, ppBox.w, 'bodyBold', m, L.bodyPt, 6);
  if (ppPt !== null) {
    prims.push({ kind: 'text', box: ppBox, text: 'POSSIBLE POINTS', fontId: 'bodyBold', sizePt: ppPt, color: INK, align: 'left', rotate: -90 });
  }

  // Task labels (one TextRun per wrapped line) and points values
  spec.activities.forEach((a, r) => {
    const lines = L.taskLines[r] ?? []; // per-activity by contract; ?? satisfies noUncheckedIndexedAccess
    let ty = rowY(r) + (L.rowH - lines.length * lineH) / 2;
    for (const line of lines) {
      prims.push({
        kind: 'text',
        box: { x: grid.x + CELL_PAD, y: ty, w: L.taskColW - 2 * CELL_PAD, h: lineH },
        text: line,
        fontId: 'body',
        sizePt: L.bodyPt,
        color: INK,
        align: 'left',
      });
      ty += lineH;
    }
    prims.push({
      kind: 'text',
      box: {
        x: grid.x + L.taskColW + CELL_PAD,
        y: rowY(r) + (L.rowH - lineH) / 2,
        w: L.pointsColW - 2 * CELL_PAD,
        h: lineH,
      },
      text: String(a.points),
      fontId: 'bodyBold',
      sizePt: L.bodyPt,
      color: INK,
      align: 'center',
    });
  });

  // Totals row: heavy top border + label
  const totY = rowY(rows);
  prims.push({ kind: 'line', x1: grid.x, y1: totY, x2: grid.x + grid.w, y2: totY, color: INK, widthIn: 0.03 });
  prims.push({
    kind: 'text',
    box: { x: grid.x + CELL_PAD, y: totY + (L.rowH - lineH) / 2, w: L.taskColW - 2 * CELL_PAD, h: lineH },
    text: 'TOTAL',
    fontId: 'bodyBold',
    sizePt: L.bodyPt,
    color: INK,
    align: 'left',
  });

  // Grid lines
  const xs = [grid.x, grid.x + L.taskColW, grid.x + L.taskColW + L.pointsColW];
  for (let i = 1; i <= n; i++) xs.push(playersX + i * L.playerColW);
  for (const x of xs) {
    prims.push({ kind: 'line', x1: x, y1: grid.y, x2: x, y2: gridBottom, color: GRID_LINE, widthIn: 0.015 });
  }
  const ys = [grid.y, grid.y + L.headerBandH];
  for (let r = 1; r <= rows; r++) ys.push(rowY(r));
  ys.push(gridBottom);
  for (const y of ys) {
    prims.push({ kind: 'line', x1: grid.x, y1: y, x2: grid.x + grid.w, y2: y, color: GRID_LINE, widthIn: 0.015 });
  }
}
