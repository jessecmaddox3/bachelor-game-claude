import type { BoardSpec } from '../../models/boardSpec';
import { pointsLabel } from '../../models/boardSpec';
import type { Regions } from '../layout/regions';
import type { GridLayout } from '../layout/gridSolver';
import type { FontMetrics, FontId } from '../fonts/metrics';
import type { Scene, Primitive } from './types';
import type { Box } from '../geometry';
import { fitSizePt, fitWrappedText, wrapToWidth } from '../layout/wrap';
import {
  CELL_PAD,
  POINTS_HEADER,
  POINTS_SUBHEADER,
  MAX_POINTS_HEADER,
  MAX_POINTS_SUBHEADER,
  TOTALS_LABEL,
} from '../layout/gridSolver';
import { INK, GRID_LINE, PAGE_BG } from './colors';
import { bodyLines, effectiveRules } from '../../content/rules';
import { wrapStyledRuleLine, type StyledRulesLine } from '../rules/richText';

export function composeScene(
  spec: BoardSpec,
  regions: Regions,
  layout: GridLayout,
  m: FontMetrics,
  rulesPlan?: RulesPlan,
): Scene {
  const prims: Primitive[] = [];
  prims.push({ kind: 'rect', box: { x: 0, y: 0, w: regions.pageW, h: regions.pageH }, fill: PAGE_BG });

  composeHeader(spec, regions, m, prims);
  if (spec.cornerBoxes.length > 0) composeCornerBoxes(spec, regions, m, prims);
  if (regions.rail) composeRail(regions.rail, m, prims);
  composeGrid(spec, regions.grid, layout, m, prims);
  composeExtras(spec, regions.grid, layout, m, prims);
  if (regions.rules) composeRules(spec, regions.rules, m, prims, rulesPlan);

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
  const subtitle = spec.subtitle;
  const hasSubtitle = Boolean(subtitle);
  const hasHonoree = Boolean(spec.honoree);
  const rows: Array<[string, number, FontId, string]> = hasHonoree
    ? (subtitle
        ? [
            [spec.title, 0.5, 'display', spec.theme.titleColor],
            [spec.honoree, 0.32, 'display', spec.theme.titleColor],
            [subtitle, 0.18, 'bodyBold', spec.theme.accentColor],
          ]
        : [
            [spec.title, 0.6, 'display', spec.theme.titleColor],
            [spec.honoree, 0.4, 'display', spec.theme.titleColor],
          ])
    : (subtitle
        ? [
            [spec.title, 0.66, 'display', spec.theme.titleColor],
            [subtitle, 0.34, 'bodyBold', spec.theme.accentColor],
          ]
        : [[spec.title, 1, 'display', spec.theme.titleColor]]);

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
    const box: Box = {
      x: playersX + i * L.playerColW + CELL_PAD,
      y: grid.y + CELL_PAD,
      w: L.playerColW - 2 * CELL_PAD,
      h: L.headerBandH - 2 * CELL_PAD,
    };
    const playerFloor = Math.min(L.bodyPt, 18);
    const sizePt = fitSizePt(name, box.h, box.w, 'bodyBold', m, 18, playerFloor) ?? playerFloor;
    prims.push({
      kind: 'text',
      box,
      text: name,
      fontId: 'bodyBold',
      sizePt,
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
    const taskBox: Box = {
      x: grid.x + CELL_PAD,
      y: rowY(r) + CELL_PAD,
      w: L.taskColW - 2 * CELL_PAD,
      h: L.rowH - 2 * CELL_PAD,
    };
    const fittedTask = fitWrappedText(a.name, taskBox.w, taskBox.h, 'body', m, {
      minPt: L.bodyPt,
      maxPt: 20,
      maxLines: 8,
    });
    const lines = fittedTask?.lines ?? (L.taskLines[r] ?? []);
    const taskPt = fittedTask?.pt ?? L.bodyPt;
    const taskLineH = m.lineHeightIn('body', taskPt);
    let ty = rowY(r) + (L.rowH - lines.length * taskLineH) / 2;
    for (const line of lines) {
      prims.push({
        kind: 'text',
        box: { x: taskBox.x, y: ty, w: taskBox.w, h: taskLineH },
        text: line,
        fontId: 'body',
        sizePt: taskPt,
        color: activityColor,
        align: 'left',
      });
      ty += taskLineH;
    }
    const pointsText = pointsLabel(a.points, spec.pointsRangeFormat);
    const pointsBox: Box = {
      x: pointsX + CELL_PAD,
      y: rowY(r) + CELL_PAD,
      w: L.pointsColW - 2 * CELL_PAD,
      h: L.rowH - 2 * CELL_PAD,
    };
    const pointsPt = fitSizePt(pointsText, pointsBox.w, pointsBox.h, 'bodyBold', m, 20, L.bodyPt) ?? L.bodyPt;
    const pointsLineH = m.lineHeightIn('bodyBold', pointsPt);
    prims.push({
      kind: 'text',
      box: {
        x: pointsBox.x,
        y: rowY(r) + (L.rowH - pointsLineH) / 2,
        w: pointsBox.w,
        h: pointsLineH,
      },
      text: pointsText,
      fontId: 'bodyBold',
      sizePt: pointsPt,
      color: INK,
      align: 'center',
    });
    if (a.maxPoints !== undefined) {
      const maxText = String(a.maxPoints);
      const maxBox: Box = {
        x: maxX + CELL_PAD,
        y: rowY(r) + CELL_PAD,
        w: L.maxPointsColW - 2 * CELL_PAD,
        h: L.rowH - 2 * CELL_PAD,
      };
      const maxPt = fitSizePt(maxText, maxBox.w, maxBox.h, 'bodyBold', m, 20, L.bodyPt) ?? L.bodyPt;
      const maxLineH = m.lineHeightIn('bodyBold', maxPt);
      prims.push({
        kind: 'text',
        box: {
          x: maxBox.x,
          y: rowY(r) + (L.rowH - maxLineH) / 2,
          w: maxBox.w,
          h: maxLineH,
        },
        text: maxText,
        fontId: 'bodyBold',
        sizePt: maxPt,
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
      text: pointsLabel({ min: -5, max: 5 }, spec.pointsRangeFormat),
      fontId: 'bodyBold',
      sizePt: L.bodyPt,
      color: INK,
      align: 'center',
    });
  }

  // Totals row: heavy top border + label
  const totY = rowY(L.displayRows);
  prims.push({ kind: 'line', x1: grid.x, y1: totY, x2: grid.x + grid.w, y2: totY, color: INK, widthIn: 0.03 });
  const totalsBox: Box = { x: grid.x + CELL_PAD, y: totY + CELL_PAD, w: L.taskColW - 2 * CELL_PAD, h: L.rowH - 2 * CELL_PAD };
  const totalsPt = fitSizePt(TOTALS_LABEL, totalsBox.w, totalsBox.h, 'bodyBold', m, 20, L.bodyPt) ?? L.bodyPt;
  const totalsLineH = m.lineHeightIn('bodyBold', totalsPt);
  prims.push({
    kind: 'text',
    box: { x: totalsBox.x, y: totY + (L.rowH - totalsLineH) / 2, w: totalsBox.w, h: totalsLineH },
    text: TOTALS_LABEL,
    fontId: 'bodyBold',
    sizePt: totalsPt,
    color: accentColor,
    align: 'left',
  });
  if (spec.totalsTarget !== undefined) {
    const targetText = String(spec.totalsTarget);
    const targetBox: Box = { x: pointsX + CELL_PAD, y: totY + CELL_PAD, w: L.pointsColW - 2 * CELL_PAD, h: L.rowH - 2 * CELL_PAD };
    const targetPt = fitSizePt(targetText, targetBox.w, targetBox.h, 'bodyBold', m, 20, L.bodyPt) ?? L.bodyPt;
    const targetLineH = m.lineHeightIn('bodyBold', targetPt);
    prims.push({
      kind: 'text',
      box: { x: targetBox.x, y: totY + (L.rowH - targetLineH) / 2, w: targetBox.w, h: targetLineH },
      text: targetText,
      fontId: 'bodyBold',
      sizePt: targetPt,
      color: accentColor,
      align: 'center',
    });
  }

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

type RuleBlock = { headingLines: string[]; body: StyledRulesLine[]; h: number; ellipsized: boolean };
export type RulesPlan = {
  pt: number;
  lineH: number;
  headH: number;
  colW: number;
  bodyTop: number;
  placed: Array<{ col: number; y: number; block: RuleBlock }>;
  footLines: string[];
  footH: number;
  fLineH: number;
};

/**
 * Measure every rules word before composition. Returning null makes the build
 * honestly infeasible instead of silently truncating or dropping later rules.
 */
export function planRules(spec: BoardSpec, box: Box, m: FontMetrics): RulesPlan | null {
  const PAD = 0.2;
  const titleH = spec.rulesTitle ? 0.28 : 0;
  const fLineH = m.lineHeightIn('body', 7);
  const footResult = spec.footnote
    ? wrapToWidth(spec.footnote, box.w - 2 * PAD, 'body', 7, m, 10_000)
    : { lines: [], ellipsized: false };
  if (footResult.ellipsized) return null;
  const footLines = footResult.lines;
  const footH = footLines.length > 0 ? fLineH * footLines.length + 0.06 : 0;
  const bodyTop = box.y + PAD / 2 + titleH;
  const bodyH = box.h - PAD - titleH - footH;
  const rules = effectiveRules(spec);
  const cols = rules.length > 6 ? 3 : rules.length > 2 ? 2 : 1;
  const colGap = 0.3;
  const colW = (box.w - 2 * PAD - (cols - 1) * colGap) / cols;

  if (bodyH <= 0) return null;

  for (let pt = 9; pt >= 5; pt -= 0.5) {
    const lineH = m.lineHeightIn('body', pt);
    const headH = m.lineHeightIn('bodyBold', pt);
    const blocks: RuleBlock[] = rules.map((r) => {
      const headingText = r.heading
        ? `${r.heading}${spec.rulesHeadingSuffix === 'colon' ? ':' : ''}`
        : '';
      const heading = headingText
        ? wrapToWidth(headingText, colW, 'bodyBold', pt, m, 10_000)
        : { lines: [], ellipsized: false };
      const body: StyledRulesLine[] = [];
      let bodyEllipsized = false;
      for (const sourceLine of bodyLines(r)) {
        const wrapped = wrapStyledRuleLine(sourceLine, colW, 'body', 'bodyBold', pt, m);
        if (!wrapped) {
          bodyEllipsized = true;
          continue;
        }
        body.push(...wrapped);
      }
      return {
        headingLines: heading.lines,
        body,
        h: heading.lines.length * headH + body.length * lineH + 0.08,
        ellipsized: heading.ellipsized || bodyEllipsized,
      };
    });
    if (blocks.some((block) => block.ellipsized)) continue;
    const colHeights = Array.from({ length: cols }, () => 0);
    const placed: RulesPlan['placed'] = [];
    let ok = true;
    for (const block of blocks) {
      const col = colHeights.indexOf(Math.min(...colHeights));
      if (colHeights[col]! + block.h > bodyH) {
        ok = false;
        break;
      }
      placed.push({ col, y: colHeights[col]!, block });
      colHeights[col]! += block.h;
    }
    if (ok) return { pt, lineH, headH, colW, bodyTop, placed, footLines, footH, fLineH };
  }
  return null;
}

function composeRules(
  spec: BoardSpec,
  box: Box,
  m: FontMetrics,
  prims: Primitive[],
  precomputed?: RulesPlan,
) {
  const rules = effectiveRules(spec);
  if (rules.length === 0 && !spec.footnote) return;
  const accent = spec.theme.accentColor;
  const PAD = 0.2;
  const titleH = spec.rulesTitle ? 0.28 : 0;
  const plan = precomputed ?? planRules(spec, box, m);
  // buildBoard preflights this exact plan and returns an infeasible result.
  // A direct internal caller must never get a silently incomplete Scene.
  if (!plan) throw new Error('composeScene called with rules that do not fit');

  // "GAME RULES:" strip title — only when there are rules to head (a
  // footnote-only strip must not render an orphaned heading).
  if (rules.length > 0 && spec.rulesTitle) {
    prims.push({
      kind: 'text',
      box: { x: box.x + PAD, y: box.y + PAD / 2, w: box.w - 2 * PAD, h: titleH },
      text: spec.rulesTitle,
      fontId: 'bodyBold',
      sizePt: fitSizePt(spec.rulesTitle, box.w - 2 * PAD, titleH, 'bodyBold', m, 14, 7) ?? 7,
      color: accent,
      align: 'left',
    });
  }

  const colGap = 0.3;
  for (const { col, y, block } of plan.placed) {
      const x = box.x + PAD + col * (plan.colW + colGap);
      let cy = plan.bodyTop + y;
      for (const headingLine of block.headingLines) {
        prims.push({ kind: 'text', box: { x, y: cy, w: plan.colW, h: plan.headH }, text: headingLine, fontId: 'bodyBold', sizePt: plan.pt, color: accent, align: 'left' });
        cy += plan.headH;
      }
      for (const line of block.body) {
        if (line.bullet) {
          prims.push({ kind: 'text', box: { x, y: cy, w: line.indentIn, h: plan.lineH }, text: '•', fontId: 'body', sizePt: plan.pt, color: INK, align: 'left' });
        }
        for (const segment of line.segments) {
          prims.push({
            kind: 'text',
            box: { x: x + segment.x, y: cy, w: segment.w + 0.001, h: plan.lineH },
            text: segment.text,
            fontId: segment.bold ? 'bodyBold' : 'body',
            sizePt: plan.pt,
            color: INK,
            align: 'left',
          });
        }
        cy += plan.lineH;
      }
  }

  if (plan.footLines.length > 0) {
    let fy = box.y + box.h - plan.footH;
    for (const line of plan.footLines) {
      prims.push({ kind: 'text', box: { x: box.x + PAD, y: fy, w: box.w - 2 * PAD, h: plan.fLineH }, text: line, fontId: 'body', sizePt: 7, color: accent, align: 'left' });
      fy += plan.fLineH;
    }
  }
}
