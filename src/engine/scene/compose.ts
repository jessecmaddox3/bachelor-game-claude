import type { BoardSpec } from '../../models/boardSpec';
import { pointsLabel } from '../../models/boardSpec';
import type { Regions } from '../layout/regions';
import type { GridLayout } from '../layout/gridSolver';
import type { FontMetrics, FontId } from '../fonts/metrics';
import type { Scene, Primitive } from './types';
import type { Box } from '../geometry';
import { fitSizePt, wrapToWidth, hardEllipsize } from '../layout/wrap';
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
  if (spec.cornerBoxes.length > 0) composeCornerBoxes(spec, regions, m, prims);
  if (regions.rail) composeRail(regions.rail, m, prims);
  composeGrid(spec, regions.grid, layout, m, prims);
  composeExtras(spec, regions.grid, layout, m, prims);
  if (regions.rules) composeRules(spec, regions.rules, m, prims);

  return { widthIn: regions.pageW, heightIn: regions.pageH, primitives: prims };
}

// Corner champion boxes: write-in score boxes stacked at the header's right
// edge, each with a right-aligned label beneath it.
const CORNER_BOX_W = 2.3;
const CORNER_BOX_H = 0.45;
const CORNER_LABEL_H = 0.2;
const CORNER_GAP = 0.15;

function composeCornerBoxes(spec: BoardSpec, regions: Regions, m: FontMetrics, prims: Primitive[]) {
  const h = regions.header;
  const n = spec.cornerBoxes.length;
  // Proportional scale-down when the stack would exceed the header band
  // (e.g. 3 boxes need 2.4" against a 2.2" floor-height header).
  const scale = Math.min(1, h.h / (n * (CORNER_BOX_H + CORNER_LABEL_H + CORNER_GAP)));
  const boxH = CORNER_BOX_H * scale;
  const labelH = CORNER_LABEL_H * scale;
  const gap = CORNER_GAP * scale;
  const x = h.x + h.w - CORNER_BOX_W;
  spec.cornerBoxes.forEach((label, i) => {
    const y = h.y + i * (boxH + labelH + gap);
    prims.push({
      kind: 'rect',
      box: { x, y, w: CORNER_BOX_W, h: boxH },
      stroke: spec.theme.accentColor,
      strokeWidthIn: 0.02,
    });
    const labelBox: Box = { x, y: y + boxH + 0.02, w: CORNER_BOX_W, h: labelH - 0.04 };
    const pt = fitSizePt(label, labelBox.w, labelBox.h, 'bodyBold', m, 14, 6);
    if (pt !== null) {
      prims.push({
        kind: 'text',
        box: labelBox,
        text: label,
        fontId: 'bodyBold',
        sizePt: pt,
        color: spec.theme.accentColor,
        align: 'right',
      });
    }
  });
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

  // Corner boxes occupy the header's right edge; keep the title rows clear
  // of them (they re-fit smaller automatically via fittedLine).
  const rowW = spec.cornerBoxes.length > 0 ? h.w * 0.9 - CORNER_BOX_W : h.w * 0.9;

  let y = h.y;
  let titlePt: number | null = null;
  rows.forEach(([text, frac, fontId, color], i) => {
    const rowBox: Box = { x: h.x + h.w * 0.05, y, w: rowW, h: h.h * frac * 0.9 };
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
  const gridBottom = rowY(L.displayRows + 1); // activities + write-ins + bonus + totals row
  const lineH = m.lineHeightIn('body', L.bodyPt);
  const { accentColor, activityColor } = spec.theme;

  // Alternate-row tint (subtle blue per theme), behind everything else in the grid
  for (let r = 0; r < L.displayRows; r++) {
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
    const labelBox: Box = { x: grid.x + CELL_PAD, y: grid.y + CELL_PAD, w: L.taskColW - 2 * CELL_PAD, h: L.headerBandH * 0.55 };
    fittedLine(spec.theme.cornerLabel, labelBox, 'bodyBold', m, prims, 300, accentColor, 'left');
    if (spec.theme.cornerSubLabel !== '') {
      const subH = L.headerBandH * 0.18;
      const subBox: Box = { x: grid.x + CELL_PAD, y: grid.y + L.headerBandH - CELL_PAD - subH, w: L.taskColW - 2 * CELL_PAD, h: subH };
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

  // Write-in rows: blank scoring rows headed only by a small rotated 'TBD'
  // marker at the left edge of the task cell. Skipped (marker only, the row
  // itself still exists) when the row is too short for even a 5pt marker.
  for (let w = 0; w < spec.writeInRows; w++) {
    const box: Box = {
      x: grid.x + CELL_PAD / 2,
      y: rowY(rows + w) + CELL_PAD,
      w: 0.14,
      h: L.rowH - 2 * CELL_PAD,
    };
    const pt = fitSizePt('TBD', box.h, box.w, 'body', m, 8, 5);
    if (pt !== null) {
      prims.push({ kind: 'text', box, text: 'TBD', fontId: 'body', sizePt: pt, color: GRID_LINE, align: 'center', rotate: -90 });
    }
  }

  // Honoree bonus row: single-line bold label (the solver guarantees it fits
  // the task column at bodyPt) with a fixed -5 to 5 range in the points cell.
  if (spec.honoreeBonusRow) {
    const r = rows + spec.writeInRows;
    prims.push({
      kind: 'text',
      box: { x: grid.x + CELL_PAD, y: rowY(r) + (L.rowH - lineH) / 2, w: L.taskColW - 2 * CELL_PAD, h: lineH },
      text: `**BONUS POINTS GRANTED BY ${spec.honoree.toUpperCase()}**`,
      fontId: 'bodyBold',
      sizePt: L.bodyPt,
      color: activityColor,
      align: 'left',
    });
    prims.push({
      kind: 'text',
      box: { x: pointsX + CELL_PAD, y: rowY(r) + (L.rowH - lineH) / 2, w: L.pointsColW - 2 * CELL_PAD, h: lineH },
      text: '-5 to 5',
      fontId: 'bodyBold',
      sizePt: L.bodyPt,
      color: INK,
      align: 'center',
    });
  }

  // Totals row: heavy top border + label
  const totY = rowY(L.displayRows);
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
  // Skip rowY(L.displayRows): the heavy INK totals border already marks that boundary and must paint last.
  for (let r = 1; r < L.displayRows; r++) ys.push(rowY(r));
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
  if (spec.rules.length === 0 && !spec.footnote) return;
  const accent = spec.theme.accentColor;
  const PAD = 0.2;
  const titleH = 0.28;
  // Footnote strip height derived from its actual metrics: 2 wrapped lines at
  // 7pt (wrapToWidth's maxLines cap) plus a small pad, so a 2-line footnote
  // can never overshoot the strip bottom.
  const fLineH = m.lineHeightIn('body', 7);
  const footH = spec.footnote ? fLineH * 2 + 0.06 : 0;
  const bodyTop = box.y + PAD / 2 + titleH;
  const bodyH = box.h - PAD - titleH - footH;
  const cols = spec.rules.length > 6 ? 3 : spec.rules.length > 2 ? 2 : 1;
  const colGap = 0.3;
  const colW = (box.w - 2 * PAD - (cols - 1) * colGap) / cols;

  // "GAME RULES:" strip title — only when there are rules to head (a
  // footnote-only strip must not render an orphaned heading).
  if (spec.rules.length > 0) {
    prims.push({
      kind: 'text',
      box: { x: box.x + PAD, y: box.y + PAD / 2, w: box.w - 2 * PAD, h: titleH },
      text: 'GAME RULES:',
      fontId: 'bodyBold',
      sizePt: fitSizePt('GAME RULES:', box.w - 2 * PAD, titleH, 'bodyBold', m, 14, 7) ?? 7,
      color: accent,
      align: 'left',
    });
  }

  // Fit pass: find the largest pt (9 -> 5) where every rule block fits its column.
  for (let pt = 9; pt >= 5; pt -= 0.5) {
    const lineH = m.lineHeightIn('body', pt);
    const headH = m.lineHeightIn('bodyBold', pt);
    // Wrap every block at this size; distribute round-robin into columns by cumulative height.
    const blocks = spec.rules.map((r) => {
      const heading = r.heading ? hardEllipsize(`${r.heading}:`, colW, 'bodyBold', pt, m).text : null;
      const lines = wrapToWidth(r.text, colW, 'body', pt, m, 6).lines;
      return { heading, lines, h: (heading ? headH : 0) + lines.length * lineH + 0.08 };
    });
    const colHeights = Array.from({ length: cols }, () => 0);
    const placed: Array<{ col: number; y: number; block: (typeof blocks)[number] }> = [];
    let ok = true;
    for (const block of blocks) {
      // Greedy: shortest column first keeps columns balanced.
      const col = colHeights.indexOf(Math.min(...colHeights));
      if (colHeights[col]! + block.h > bodyH) { ok = false; break; }
      placed.push({ col, y: colHeights[col]!, block });
      colHeights[col]! += block.h;
    }
    if (!ok && pt > 5) continue;
    // Render (at 5pt render whatever fits; blocks that would exceed the column are dropped
    // — unreachable within schema caps, mirrors the pre-existing floor-fallback philosophy).
    for (const { col, y, block } of placed) {
      const x = box.x + PAD + col * (colW + colGap);
      let cy = bodyTop + y;
      if (block.heading) {
        prims.push({ kind: 'text', box: { x, y: cy, w: colW, h: headH }, text: block.heading, fontId: 'bodyBold', sizePt: pt, color: accent, align: 'left' });
        cy += headH;
      }
      for (const line of block.lines) {
        prims.push({ kind: 'text', box: { x, y: cy, w: colW, h: lineH }, text: line, fontId: 'body', sizePt: pt, color: INK, align: 'left' });
        cy += lineH;
      }
    }
    break;
  }

  if (spec.footnote) {
    const fLines = wrapToWidth(spec.footnote, box.w - 2 * PAD, 'body', 7, m, 2);
    let fy = box.y + box.h - footH;
    for (const line of fLines.lines) {
      prims.push({ kind: 'text', box: { x: box.x + PAD, y: fy, w: box.w - 2 * PAD, h: fLineH }, text: line, fontId: 'body', sizePt: 7, color: accent, align: 'left' });
      fy += fLineH;
    }
  }
}
