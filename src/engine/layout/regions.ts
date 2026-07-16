import type { BoardSpec } from '../../models/boardSpec';
import { POSTER_SIZES } from '../../models/boardSpec';
import type { Box } from '../geometry';
import { clamp } from '../geometry';

export interface Regions {
  pageW: number;
  pageH: number;
  header: Box;
  grid: Box;
  rules?: Box;
  rail?: { box: Box; title: string };
}

const REGION_GAP = 0.25;

export function partitionRegions(spec: BoardSpec): Regions {
  const { w: pageW, h: pageH } = POSTER_SIZES[spec.posterSize];
  const margin = clamp(pageH * 0.015, 0.5, 1.0);
  const content: Box = { x: margin, y: margin, w: pageW - 2 * margin, h: pageH - 2 * margin };

  const headerH = clamp(pageH * 0.11, 2.2, 6);
  const rulesH = spec.rules.length > 0 ? clamp(pageH * 0.07, 1.5, 4) : 0;

  const bodyTop = content.y + headerH + REGION_GAP;
  const bodyBottom = content.y + content.h - (rulesH ? rulesH + REGION_GAP : 0);

  let gridX = content.x;
  let gridW = content.w;
  let rail: Regions['rail'];
  if (spec.sideRail) {
    const railW = Math.min(spec.sideRail.widthIn, content.w * 0.3);
    rail = {
      title: spec.sideRail.title,
      box: {
        x: spec.sideRail.side === 'left' ? content.x : content.x + content.w - railW,
        y: bodyTop,
        w: railW,
        h: bodyBottom - bodyTop,
      },
    };
    gridW = content.w - railW - REGION_GAP;
    if (spec.sideRail.side === 'left') gridX = content.x + railW + REGION_GAP;
  }

  return {
    pageW,
    pageH,
    header: { x: content.x, y: content.y, w: content.w, h: headerH },
    grid: { x: gridX, y: bodyTop, w: gridW, h: bodyBottom - bodyTop },
    rules: rulesH ? { x: content.x, y: content.y + content.h - rulesH, w: content.w, h: rulesH } : undefined,
    rail,
  };
}
