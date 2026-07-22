import type { BoardSpec } from '../../models/boardSpec';
import { bodyLines, effectiveRules } from '../../content/rules';
import { pointsLabel } from '../../models/boardSpec';
import type { FontMetrics, FontId } from '../fonts/metrics';
import { fitSizePt, fitWrappedText, wrapToWidth } from '../layout/wrap';
import type { Box } from '../geometry';
import type { Primitive, Scene } from './types';
import { GRID_LINE, INK, PAGE_BG } from './colors';
import { wrapStyledRuleLine, type StyledRulesLine } from '../rules/richText';

const text = (
  prims: Primitive[], box: Box, value: string, fontId: FontId, sizePt: number,
  color: string, align: 'left' | 'center' | 'right' = 'left', rotate?: -45 | -90,
) => prims.push({ kind: 'text', box, text: value, fontId, sizePt, color, align, ...(rotate ? { rotate } : {}) });

const line = (prims: Primitive[], x1: number, y1: number, x2: number, y2: number, color = INK, widthIn = 0.018) =>
  prims.push({ kind: 'line', x1, y1, x2, y2, color, widthIn });

function fitRotated45Pt(value: string, box: Box, fontId: FontId, m: FontMetrics, maxPt: number, minPt: number): number | null {
  for (let pt = maxPt; pt >= minPt; pt -= 0.25) {
    const extent = Math.SQRT1_2 * (m.widthIn(value, fontId, pt) + m.lineHeightIn(fontId, pt));
    if (extent <= box.w && extent <= box.h) return pt;
  }
  return null;
}

function fittedText(
  prims: Primitive[], m: FontMetrics, box: Box, value: string, fontId: FontId,
  maxPt: number, color: string, align: 'left' | 'center' | 'right' = 'left', minPt = 5,
): boolean {
  const fit = fitWrappedText(value, box.w, box.h, fontId, m, { minPt, maxPt, maxLines: 8 });
  if (!fit) return false;
  const lineH = m.lineHeightIn(fontId, fit.pt);
  let y = box.y + (box.h - fit.lines.length * lineH) / 2;
  for (const lineValue of fit.lines) {
    text(prims, { x: box.x, y, w: box.w, h: lineH }, lineValue, fontId, fit.pt, color, align);
    y += lineH;
  }
  return true;
}

function inlinePoints(a: BoardSpec['activities'][number], format: BoardSpec['pointsRangeFormat']) {
  const base = pointsLabel(a.points, format);
  return a.maxPoints === undefined ? base : `${base} (${a.maxPoints})`;
}

function composeBracket(
  prims: Primitive[], box: Box,
  bracket: BoardSpec['brackets'][number], accent: string,
) {
  line(prims, box.x, box.y, box.x + box.w, box.y, specColor(accent), 0.09);
  const suffix = bracket.teamSize === 2 ? ' (TEAMS OF 2)' : ' (INDIVIDUAL)';
  text(prims, { x: box.x, y: box.y + 0.15, w: box.w, h: 0.35 }, bracket.title + suffix, 'landscapeBold', 8, accent);

  const top = box.y + 0.9;
  const bottom = box.y + box.h - 1.05;
  const halfSlots = bracket.slots / 2;
  const centerX = box.x + box.w / 2;
  const sideW = box.w / 2 - 1.0;
  const seedW = bracket.slots === 8 ? 2.9 : 2.0;

  const side = (left: boolean) => {
    let ys = Array.from({ length: halfSlots }, (_, i) => top + (i * (bottom - top)) / (halfSlots - 1));
    let innerX = left ? box.x + seedW : box.x + box.w - seedW;
    for (const y of ys) {
      line(prims, left ? box.x : innerX, y, left ? innerX : box.x + box.w, y, INK, 0.03);
      if (bracket.teamSize === 2) {
        line(prims, left ? box.x : innerX, y + 0.22, left ? innerX : box.x + box.w, y + 0.22, INK, 0.03);
      }
    }
    const rounds = Math.log2(halfSlots);
    const step = (sideW - seedW) / Math.max(1, rounds);
    for (let round = 0; round < rounds; round++) {
      const nextX = left ? innerX + step : innerX - step;
      const nextYs: number[] = [];
      for (let i = 0; i < ys.length; i += 2) {
        const y1 = ys[i]!;
        const y2 = ys[i + 1]!;
        const mid = (y1 + y2) / 2;
        line(prims, innerX, y1, nextX, y1, INK, 0.03);
        line(prims, innerX, y2, nextX, y2, INK, 0.03);
        line(prims, nextX, y1, nextX, y2, INK, 0.03);
        if (round < rounds - 1) line(prims, nextX, mid, left ? nextX + step : nextX - step, mid, INK, 0.03);
        nextYs.push(mid);
      }
      ys = nextYs;
      innerX = nextX;
    }
    const finalistY = ys[0] ?? (top + bottom) / 2;
    const finalistW = 1.8;
    const fx = left ? centerX - 2.1 : centerX + 0.3;
    prims.push({ kind: 'rect', box: { x: fx, y: finalistY - 0.3, w: finalistW, h: 0.6 }, stroke: INK, strokeWidthIn: 0.025 });
  };
  side(true);
  side(false);
  const winner: Box = { x: centerX - 1.15, y: box.y + box.h - 0.75, w: 2.3, h: 0.48 };
  prims.push({ kind: 'rect', box: winner, stroke: INK, strokeWidthIn: 0.025 });
  text(prims, { x: winner.x, y: winner.y + 0.52, w: winner.w, h: 0.25 }, 'WINNER', 'landscapeBold', 7, INK, 'center');
}

const specColor = (color: string) => color;

/** Renders the rail rules and returns the point size actually used (null if they cannot fit). */
function composeRailRules(prims: Primitive[], m: FontMetrics, spec: BoardSpec, box: Box): number | null {
  let pt = 4.5;
  let planned: Array<{ kind: 'heading'; value: string } | { kind: 'line'; line: StyledRulesLine }> = [];
  let fits = false;
  for (; pt >= 3.5; pt -= 0.25) {
    planned = [];
    let failed = false;
    for (const rule of effectiveRules(spec)) {
      if (rule.heading) {
        const heading = wrapToWidth(rule.heading, box.w, 'landscapeBold', pt, m, 10_000);
        if (heading.ellipsized) {
          failed = true;
          break;
        }
        planned.push(...heading.lines.map((value) => ({ kind: 'heading' as const, value })));
      }
      for (const sourceLine of bodyLines(rule)) {
        const wrapped = wrapStyledRuleLine(sourceLine, box.w, 'landscape', 'landscapeBold', pt, m);
        if (!wrapped) {
          failed = true;
          break;
        }
        planned.push(...wrapped.map((line) => ({ kind: 'line' as const, line })));
      }
      if (failed) break;
    }
    if (failed) continue;
    const h = planned.reduce((sum, item) => sum + m.lineHeightIn(item.kind === 'heading' ? 'landscapeBold' : 'landscape', pt), 0);
    if (h <= box.h) { fits = true; break; }
  }
  if (!fits) return null;
  let y = box.y;
  for (const item of planned) {
    const h = m.lineHeightIn(item.kind === 'heading' ? 'landscapeBold' : 'landscape', pt);
    if (item.kind === 'heading') {
      text(prims, { x: box.x, y, w: box.w, h }, item.value, 'landscapeBold', pt, spec.theme.accentColor);
    } else {
      if (item.line.bullet) {
        text(prims, { x: box.x, y, w: item.line.indentIn, h }, '•', 'landscape', pt, INK);
      }
      for (const segment of item.line.segments) {
        text(
          prims,
          { x: box.x + segment.x, y, w: segment.w + 0.001, h },
          segment.text,
          segment.bold ? 'landscapeBold' : 'landscape',
          pt,
          INK,
        );
      }
    }
    y += h;
  }
  return pt;
}

export function composeLandscapeBrackets(
  spec: BoardSpec,
  m: FontMetrics,
): { scene: Scene; rulesPt: number } | null {
  const prims: Primitive[] = [{ kind: 'rect', box: { x: 0, y: 0, w: 60, h: 48 }, fill: PAGE_BG }];
  const teal = spec.theme.titleColor;
  const blue = spec.theme.accentColor;

  const titleValue = [spec.title, spec.honoree].filter(Boolean).join(' ');
  const titleBox: Box = { x: 4, y: 1.0, w: 52, h: 2.25 };
  const titlePt = fitSizePt(titleValue, titleBox.w, titleBox.h, 'landscapeBold', m, 76, 18);
  if (titlePt === null) return null;
  text(prims, titleBox, titleValue, 'landscapeBold', titlePt, teal, 'center');
  if (spec.subtitle) {
    const subtitleBox: Box = { x: 15, y: 3.15, w: 30, h: 0.7 };
    const subtitlePt = fitSizePt(spec.subtitle, subtitleBox.w, subtitleBox.h, 'landscapeBold', m, 22, 8);
    if (subtitlePt === null) return null;
    text(prims, subtitleBox, spec.subtitle, 'landscapeBold', subtitlePt, blue, 'center');
  }

  const left: Box = { x: 1.3, y: 6.1, w: 15.0, h: 40.0 };
  const grid: Box = { x: 18.1, y: 6.1, w: 34.2, h: 40.0 };
  const right: Box = { x: 53.2, y: 9.8, w: 5.55, h: 36.3 };
  line(prims, 17.25, 6.1, 17.25, 46.1, teal, 0.09);
  spec.brackets.forEach((bracket, i) => composeBracket(prims, { x: left.x, y: left.y + i * 10, w: left.w, h: 9.45 }, bracket, blue));

  const labels = spec.landscapeLabels;
  line(prims, grid.x, grid.y, grid.x + grid.w, grid.y, teal, 0.09);
  labels.gameHeading.split(/\s+/).filter(Boolean).forEach((word, i) => {
    text(prims, { x: grid.x, y: 6.45 + i * 0.8, w: 5.5, h: 0.75 }, word, 'landscapeBold', 34, blue);
  });
  text(prims, { x: grid.x, y: 8.9, w: 3.0, h: 0.45 }, labels.activitiesLabel, 'landscapeBold', 10, INK);
  text(prims, { x: grid.x + 2.9, y: 8.95, w: 3.9, h: 0.35 }, labels.deadlineNote, 'landscapeBold', 4.5, teal);
  text(prims, { x: grid.x + 7.85, y: grid.y + 0.35, w: 0.55, h: 3.35 }, labels.pointsHeading, 'landscapeBold', 8, INK, 'center', -90);
  text(prims, { x: grid.x + 8.7, y: 6.8, w: 2.0, h: 2.0 }, labels.victimsHeading, 'landscapeBold', 16, teal, 'center', -45);

  const taskW = 7.3;
  const pointsW = 1.65;
  const playersX = grid.x + taskW + pointsW;
  const playerW = (grid.w - taskW - pointsW) / spec.players.length;
  const headerH = 4.15;
  const rows = spec.activities.length + 1;
  const rowH = (grid.h - headerH) / rows;
  const bodyTop = grid.y + headerH;
  for (const [i, name] of spec.players.entries()) {
    const value = name.toUpperCase();
    const box: Box = { x: playersX + i * playerW, y: grid.y + 0.35, w: playerW, h: headerH - 0.45 };
    const pt = fitRotated45Pt(value, box, 'landscapeBold', m, 18, 4);
    if (pt === null) return null;
    text(prims, box, value, 'landscapeBold', pt, blue, 'left', -45);
  }
  for (const [i, activity] of spec.activities.entries()) {
    const y = bodyTop + i * rowH;
    if (!fittedText(prims, m, { x: grid.x + 0.08, y: y + 0.08, w: taskW - 0.2, h: rowH - 0.16 }, activity.name.toUpperCase(), 'landscapeBold', 20, blue)) return null;
    if (!fittedText(prims, m, { x: grid.x + taskW + 0.08, y: y + 0.08, w: pointsW - 0.16, h: rowH - 0.16 }, inlinePoints(activity, spec.pointsRangeFormat), 'landscapeBold', 20, GRID_LINE, 'center')) return null;
  }
  const totalY = bodyTop + spec.activities.length * rowH;
  if (!fittedText(prims, m, { x: grid.x + 0.08, y: totalY + 0.08, w: taskW - 0.2, h: rowH - 0.16 }, 'TOTAL POINTS', 'landscapeBold', 20, teal)) return null;
  if (spec.totalsTarget !== undefined && !fittedText(prims, m, { x: grid.x + taskW + 0.08, y: totalY + 0.08, w: pointsW - 0.16, h: rowH - 0.16 }, String(spec.totalsTarget), 'landscapeBold', 20, GRID_LINE, 'center')) return null;

  const xs = [grid.x, grid.x + taskW, playersX, ...Array.from({ length: spec.players.length + 1 }, (_, i) => playersX + i * playerW)];
  for (const x of new Set(xs)) line(prims, x, bodyTop, x, grid.y + grid.h, GRID_LINE, 0.018);
  for (let i = 0; i <= rows; i++) line(prims, grid.x, bodyTop + i * rowH, grid.x + grid.w, bodyTop + i * rowH, GRID_LINE, i === rows - 1 ? 0.035 : 0.018);

  line(prims, right.x, right.y, right.x + right.w, right.y, teal, 0.09);
  text(prims, { x: right.x + 0.45, y: right.y + 0.5, w: right.w - 0.7, h: 0.5 }, labels.resultsHeading, 'landscapeBold', 12, blue);
  spec.cornerBoxes.forEach((label, i) => {
    const y = right.y + 1.5 + i * 2.8;
    const match = label.match(/^([^()]+?)(?:\s*\((.+)\))?$/);
    const main = match?.[1]?.trim() ?? label;
    const sub = match?.[2]?.trim();
    const compact = i === 3;
    const boxW = compact ? 2.1 : right.w - 0.8;
    const boxH = compact ? 0.7 : 1.35;
    const boxX = right.x + (right.w - boxW) / 2;
    prims.push({ kind: 'rect', box: { x: boxX, y, w: boxW, h: boxH }, stroke: INK, strokeWidthIn: 0.035 });
    text(prims, { x: right.x + 0.25, y: y + boxH + 0.15, w: right.w - 0.5, h: 0.35 }, main, 'landscapeBold', 8, teal, 'center');
    if (sub) text(prims, { x: right.x + 0.25, y: y + boxH + 0.5, w: right.w - 0.5, h: 0.3 }, `(${sub})`, 'landscapeBold', 7, teal, 'center');
  });
  line(prims, right.x, 22.8, right.x + right.w, 22.8, teal, 0.09);
  const rulesPt = composeRailRules(prims, m, spec, { x: right.x, y: 23.3, w: right.w, h: 22.5 });
  if (rulesPt === null) return null;

  return { scene: { widthIn: 60, heightIn: 48, primitives: prims }, rulesPt };
}
