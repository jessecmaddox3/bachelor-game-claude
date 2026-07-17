import type { BoardSpec } from '../../models/boardSpec';
import { pointsLabel } from '../../models/boardSpec';
import type { Regions } from '../layout/regions';
import type { GridLayout } from '../layout/gridSolver';
import type { FontMetrics, FontId } from '../fonts/metrics';
import type { Scene, Primitive } from './types';
import type { Box } from '../geometry';
import { fitSizePt, wrapToWidth } from '../layout/wrap';
import {
  CELL_PAD,
  POINTS_HEADER,
  POINTS_SUBHEADER,
  MAX_POINTS_HEADER,
  MAX_POINTS_SUBHEADER,
  TOTALS_LABEL,
} from '../layout/gridSolver';
import { INK, GRID_LINE, PAGE_BG } from './colors';

export function composeScene(spec: BoardSpec, regions: Regions, layout: GridLayout, m: FontMetrics): Scene {
  const prims: Primitive[] = [];
  prims.push({ kind: 'rect', box: { x: 0, y: 0, w: regions.pageW, h: regions.pageH }, fill: PAGE_BG });

  composeHeader(spec, regions, m, prims);
  if (regions.rail) composeRail(regions.rail, m, prims);
  composeGrid(spec, regions.grid, layout, m, prims);
  composeExtras(spec, regions.grid, layout, m, prims);
  if (regions.rules) composeRules(spec, regions.rules, m, prims);

  return { widthIn: regions.pageW, heightIn: regions.pageH, primitives: prims };
}

/**
 * Fitted single-line text inside a box (centered by default). Skips silently
 * only if even 8pt cannot fit. Returns the fitted pt size (null if skipped).
 */
function fittedLine(
  text: string,
  box: Box,
  fontId: FontId,
  m: FontMetrics,
  prims: Primitive[],
  maxPt = 300,
  color = INK,
  align: 'left' | 'center' = 'center',
): number | null {
  const pt = fitSizePt(text, box.w, box.h, fontId, m, maxPt, 8);
  if (pt === null) return null;
  prims.push({ kind: 'text', box, text, fontId, sizePt: pt, color, align });
  return pt;
}

function composeHeader(spec: BoardSpec, regions: Regions, m: FontMetrics, prims: Primitive[]) {
  const h = regions.header;
  // Single truthiness source: an empty-string subtitle behaves exactly like an
  // absent one (2-row header, and the last row — the honoree — is never capped).
  const subtitle = spec.subtitle;
  const hasSubtitle = Boolean(subtitle);
  const rows: Array<[string, number, FontId, string]> = subtitle
    ? [
        [spec.title, 0.5, 'display', spec.theme.titleColor],
        [spec.honoree, 0.32, 'display', spec.theme.titleColor],
        [subtitle, 0.18, 'bodyBold', spec.theme.accentColor],
      ]
    : [
        [spec.title, 0.6, 'display', spec.theme.titleColor],
        [spec.honoree, 0.4, 'display', spec.theme.titleColor],
      ];

  let y = h.y;
  let titlePt: number | null = null;
  rows.forEach(([text, frac, fontId, color], i) => {
    const rowBox: Box = { x: h.x + h.w * 0.05, y, w: h.w * 0.9, h: h.h * frac * 0.9 };
    // Rows are fitted independently, so a width-constrained long title could
    // otherwise land smaller than its caption. Cap the subtitle (last row when
    // present) at 80% of the title's fitted size: the subtitle must never
    // visually outrank the title. Honoree stays uncapped by design.
    const isSubtitle = hasSubtitle && i === rows.length - 1;
    const maxPt = isSubtitle && titlePt !== null ? titlePt * 0.8 : 300;
    const pt = fittedLine(text, rowBox, fontId, m, prims, maxPt, color);
    if (i === 0) titlePt = pt;
    y += h.h * frac;
  });

  if (spec.theme.headerDivider) {
    const dy = h.y + h.h + 0.1;
    prims.push({ kind: 'line', x1: h.x, y1: dy, x2: h.x + h.w, y2: dy, color: spec.theme.accentColor, widthIn: 0.03 });
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
  const pointsX = grid.x + L.taskColW;
  const maxX = pointsX + L.pointsColW;
  const playersX = maxX + L.maxPointsColW;
  const rowY = (r: number) => grid.y + L.headerBandH + r * L.rowH;
  const gridBottom = rowY(rows + 1); // activities + totals row
  const lineH = m.lineHeightIn('body', L.bodyPt);
  const { accentColor, activityColor } = spec.theme;

  // Alternate-row tint (subtle blue per theme), behind everything else in the grid
  for (let r = 0; r < rows; r++) {
    if (r % 2 === 1) {
      prims.push({ kind: 'rect', box: { x: grid.x, y: rowY(r), w: grid.w, h: L.rowH }, fill: spec.theme.rowTint });
    }
  }

  // Scoring-column tints: pushed AFTER the zebra rows so the points/max columns
  // read as solid tinted strips (band through totals), and BEFORE all text and
  // grid lines so everything stays readable on top.
  if (spec.theme.pointsColTint !== '') {
    prims.push({
      kind: 'rect',
      box: { x: pointsX, y: grid.y, w: L.pointsColW, h: gridBottom - grid.y },
      fill: spec.theme.pointsColTint,
    });
  }
  if (spec.theme.maxPointsColTint !== '' && L.maxPointsColW > 0) {
    prims.push({
      kind: 'rect',
      box: { x: maxX, y: grid.y, w: L.maxPointsColW, h: gridBottom - grid.y },
      fill: spec.theme.maxPointsColTint,
    });
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
      color: activityColor,
      align: 'left',
      rotate: -90,
    });
  });

  // Rotated scoring-column headers: the column's inner band splits into two
  // vertical strips — the main header (62%) and a smaller parenthetical
  // subheader (rest) at 60% of the main's fitted size, skipped if it can't fit.
  const rotatedHeader = (x: number, colW: number, main: string, sub: string) => {
    const inner: Box = {
      x: x + CELL_PAD,
      y: grid.y + CELL_PAD,
      w: colW - 2 * CELL_PAD,
      h: L.headerBandH - 2 * CELL_PAD,
    };
    // The solver guarantees the band fits the main header at up to 10pt; the
    // null guard stays as defense-in-depth only.
    const mainBox: Box = { ...inner, w: inner.w * 0.62 };
    const pt = fitSizePt(main, mainBox.h, mainBox.w, 'bodyBold', m, L.bodyPt, 6);
    if (pt === null) return;
    prims.push({ kind: 'text', box: mainBox, text: main, fontId: 'bodyBold', sizePt: pt, color: INK, align: 'left', rotate: -90 });
    const subBox: Box = { ...inner, x: mainBox.x + mainBox.w, w: inner.w - mainBox.w };
    const subPt = fitSizePt(sub, subBox.h, subBox.w, 'bodyBold', m, 0.6 * pt, 5);
    if (subPt !== null) {
      prims.push({ kind: 'text', box: subBox, text: sub, fontId: 'bodyBold', sizePt: subPt, color: INK, align: 'left', rotate: -90 });
    }
  };
  rotatedHeader(pointsX, L.pointsColW, POINTS_HEADER, POINTS_SUBHEADER);
  if (L.maxPointsColW > 0) {
    rotatedHeader(maxX, L.maxPointsColW, MAX_POINTS_HEADER, MAX_POINTS_SUBHEADER);
  }

  // Corner label block in the band above the task column (theme-gated)
  if (spec.theme.cornerLabel !== '') {
    const labelBox: Box = { x: grid.x + CELL_PAD, y: grid.y + CELL_PAD, w: L.taskColW * 0.9, h: L.headerBandH * 0.55 };
    fittedLine(spec.theme.cornerLabel, labelBox, 'bodyBold', m, prims, 300, accentColor, 'left');
    if (spec.theme.cornerSubLabel !== '') {
      const subH = L.headerBandH * 0.18;
      const subBox: Box = { x: grid.x + CELL_PAD, y: grid.y + L.headerBandH - CELL_PAD - subH, w: L.taskColW * 0.9, h: subH };
      const pt = fitSizePt(spec.theme.cornerSubLabel, subBox.w, subBox.h, 'bodyBold', m, L.bodyPt, 6);
      if (pt !== null) {
        prims.push({ kind: 'text', box: subBox, text: spec.theme.cornerSubLabel, fontId: 'bodyBold', sizePt: pt, color: activityColor, align: 'left' });
      }
    }
  }

  // Task labels (one TextRun per wrapped line), points values, max-points values
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
        color: activityColor,
        align: 'left',
      });
      ty += lineH;
    }
    prims.push({
      kind: 'text',
      box: {
        x: pointsX + CELL_PAD,
        y: rowY(r) + (L.rowH - lineH) / 2,
        w: L.pointsColW - 2 * CELL_PAD,
        h: lineH,
      },
      text: pointsLabel(a.points),
      fontId: 'bodyBold',
      sizePt: L.bodyPt,
      color: INK,
      align: 'center',
    });
    if (a.maxPoints !== undefined) {
      prims.push({
        kind: 'text',
        box: {
          x: maxX + CELL_PAD,
          y: rowY(r) + (L.rowH - lineH) / 2,
          w: L.maxPointsColW - 2 * CELL_PAD,
          h: lineH,
        },
        text: String(a.maxPoints),
        fontId: 'bodyBold',
        sizePt: L.bodyPt,
        color: INK,
        align: 'center',
      });
    }
  });

  // Totals row: heavy top border + label
  const totY = rowY(rows);
  prims.push({ kind: 'line', x1: grid.x, y1: totY, x2: grid.x + grid.w, y2: totY, color: INK, widthIn: 0.03 });
  prims.push({
    kind: 'text',
    box: { x: grid.x + CELL_PAD, y: totY + (L.rowH - lineH) / 2, w: L.taskColW - 2 * CELL_PAD, h: lineH },
    text: TOTALS_LABEL,
    fontId: 'bodyBold',
    sizePt: L.bodyPt,
    color: accentColor,
    align: 'left',
  });

  // Grid lines
  const xs = [grid.x, pointsX, maxX];
  if (L.maxPointsColW > 0) xs.push(playersX);
  for (let i = 1; i <= n; i++) xs.push(playersX + i * L.playerColW);
  for (const x of xs) {
    prims.push({ kind: 'line', x1: x, y1: grid.y, x2: x, y2: gridBottom, color: GRID_LINE, widthIn: 0.015 });
  }
  const ys = [grid.y, grid.y + L.headerBandH];
  // Skip rowY(rows): the heavy INK totals border already marks that boundary and must paint last.
  for (let r = 1; r < rows; r++) ys.push(rowY(r));
  ys.push(gridBottom);
  for (const y of ys) {
    prims.push({ kind: 'line', x1: grid.x, y1: y, x2: grid.x + grid.w, y2: y, color: GRID_LINE, widthIn: 0.015 });
  }
}

/** Decorative marks stay clear of the print trim zone (posters get cut). */
const TRIM_SAFE = 0.125;

function composeExtras(spec: BoardSpec, grid: Box, L: GridLayout, m: FontMetrics, prims: Primitive[]) {
  const rowY = (r: number) => grid.y + L.headerBandH + r * L.rowH;
  const highlight = spec.theme.highlightColor;

  // Steven-poster highlight box around the POSSIBLE POINTS column header
  // (frames only the possible-points column, never the max column)
  if (spec.theme.highlightPointsHeader) {
    prims.push({
      kind: 'rect',
      box: { x: grid.x + L.taskColW - 0.05, y: grid.y - 0.05, w: L.pointsColW + 0.1, h: L.headerBandH + 0.1 },
      stroke: highlight,
      strokeWidthIn: 0.05,
    });
  }

  // Bracket beside contiguous runs of bonus rows, with a rotated BONUS label.
  // A left rail occupies the space the label needs, so draw the line only in that case.
  if (spec.theme.bonusBracket) {
    const leftRail = spec.sideRail?.side === 'left';
    let start = -1;
    const flush = (end: number) => {
      if (start < 0) return;
      const y1 = rowY(start) + 0.05;
      const y2 = rowY(end) - 0.05;
      const x = grid.x - 0.15;
      prims.push({ kind: 'line', x1: x, y1, x2: x, y2, color: highlight, widthIn: 0.04 });
      prims.push({ kind: 'line', x1: x, y1, x2: x + 0.1, y2: y1, color: highlight, widthIn: 0.04 });
      prims.push({ kind: 'line', x1: x, y1: y2, x2: x + 0.1, y2, color: highlight, widthIn: 0.04 });
      const labelRight = x - 0.03;
      const labelLeft = Math.max(TRIM_SAFE, x - 0.33);
      if (!leftRail && labelRight - labelLeft >= 0.1) {
        const labelBox: Box = { x: labelLeft, y: y1, w: labelRight - labelLeft, h: y2 - y1 };
        const pt = fitSizePt('BONUS', labelBox.h, labelBox.w, 'bodyBold', m, 14, 6);
        if (pt !== null) {
          prims.push({ kind: 'text', box: labelBox, text: 'BONUS', fontId: 'bodyBold', sizePt: pt, color: highlight, align: 'center', rotate: -90 });
        }
      }
      start = -1;
    };
    spec.activities.forEach((a, r) => {
      if (a.bonus && start < 0) start = r;
      if (!a.bonus) flush(r);
    });
    flush(spec.activities.length);
  }
}

function composeRules(spec: BoardSpec, box: Box, m: FontMetrics, prims: Primitive[]) {
  const text = spec.rules.map((r, i) => `${i + 1}. ${r.text}`).join('    ');
  const render = (lines: string[], pt: number) => {
    const lineH = m.lineHeightIn('body', pt);
    let y = box.y + 0.1;
    for (const line of lines) {
      prims.push({
        kind: 'text',
        box: { x: box.x + 0.2, y, w: box.w - 0.4, h: lineH },
        text: line,
        fontId: 'body',
        sizePt: pt,
        color: INK,
        align: 'left',
      });
      y += lineH;
    }
  };
  for (let pt = 14; pt >= 7; pt -= 0.5) {
    const { lines } = wrapToWidth(text, box.w - 0.4, 'body', pt, m, 99);
    if (lines.length * m.lineHeightIn('body', pt) <= box.h - 0.2) {
      render(lines, pt);
      return;
    }
  }
  // Floor fallback (unreachable within schema caps, kept as latent safety):
  // bound the line count and let wrapToWidth ellipsize the tail, guaranteeing
  // fit on both axes rather than silently dropping the strip.
  const lineH = m.lineHeightIn('body', 7);
  const maxLines = Math.max(1, Math.floor((box.h - 0.2) / lineH));
  const { lines } = wrapToWidth(text, box.w - 0.4, 'body', 7, m, maxLines);
  render(lines, 7);
}
