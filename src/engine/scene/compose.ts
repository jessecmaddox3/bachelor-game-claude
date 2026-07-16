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

/** Centered fitted single-line text inside a box. Skips silently only if even 8pt cannot fit. */
function fittedLine(text: string, box: Box, fontId: FontId, m: FontMetrics, prims: Primitive[]) {
  const pt = fitSizePt(text, box.w, box.h, fontId, m, 300, 8);
  if (pt === null) return;
  prims.push({ kind: 'text', box, text, fontId, sizePt: pt, color: INK, align: 'center' });
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
  for (const [text, frac, fontId] of rows) {
    const rowBox: Box = { x: h.x + h.w * 0.05, y, w: h.w * 0.9, h: h.h * frac * 0.9 };
    fittedLine(text, rowBox, fontId, m, prims);
    y += h.h * frac;
  }

  if (spec.theme.headerDivider) {
    const dy = h.y + h.h + 0.1;
    prims.push({ kind: 'line', x1: h.x, y1: dy, x2: h.x + h.w, y2: dy, color: INK, widthIn: 0.03 });
  }
}

function composeRail(rail: NonNullable<Regions['rail']>, m: FontMetrics, prims: Primitive[]) {
  prims.push({ kind: 'rect', box: rail.box, stroke: INK, strokeWidthIn: 0.03 });
  const titleBox: Box = { x: rail.box.x + 0.15, y: rail.box.y + 0.15, w: rail.box.w - 0.3, h: 0.6 };
  fittedLine(rail.title, titleBox, 'bodyBold', m, prims);
}
