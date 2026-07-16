import type { BoardSpec } from '../../models/boardSpec';
import type { Regions } from '../layout/regions';
import type { GridLayout } from '../layout/gridSolver';
import type { FontMetrics, FontId } from '../fonts/metrics';
import type { Scene, Primitive } from './types';
import type { Box } from '../geometry';
import { fitSizePt } from '../layout/wrap';
import { INK, PAGE_BG } from './colors';

export function composeScene(spec: BoardSpec, regions: Regions, layout: GridLayout, m: FontMetrics): Scene {
  void layout; // consumed in Task 10 (composeGrid); parameter kept per frozen signature
  const prims: Primitive[] = [];
  prims.push({ kind: 'rect', box: { x: 0, y: 0, w: regions.pageW, h: regions.pageH }, fill: PAGE_BG });

  composeHeader(spec, regions, m, prims);
  if (regions.rail) composeRail(regions.rail, m, prims);
  // grid, bespoke extras, and rules are added in Tasks 10-11

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
  const rows: Array<[string, number, FontId]> = spec.subtitle
    ? [
        [spec.title, 0.5, 'display'],
        [spec.honoree, 0.32, 'display'],
        [spec.subtitle, 0.18, 'bodyBold'],
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
    const isSubtitle = spec.subtitle !== undefined && i === rows.length - 1;
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
