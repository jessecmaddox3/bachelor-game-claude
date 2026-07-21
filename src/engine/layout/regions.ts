import type { BoardSpec } from '../../models/boardSpec';
import { POSTER_SIZES } from '../../models/boardSpec';
import type { Box } from '../geometry';
import { clamp } from '../geometry';

/**
 * Pass 1 output: the poster page carved into non-overlapping regions.
 *
 * Coordinate system: every Box is in inches, measured from the page's
 * top-left origin (Box semantics per geometry.ts). All regions sit inside
 * the page margins by construction.
 *
 * This interface is FROZEN: the grid solver, quality grade, and scene
 * composition passes all consume it.
 */
export interface Regions {
  /** Page width in inches (from POSTER_SIZES). */
  pageW: number;
  /** Page height in inches (from POSTER_SIZES). */
  pageH: number;
  /** Title block. Spans the full content width at the top of the page. */
  header: Box;
  /**
   * The rectangle the grid solver (Pass 2) fills with the task/points/player
   * columns. Sits REGION_GAP below the header and, when rules are present,
   * ends REGION_GAP above the rules region.
   */
  grid: Box;
  /**
   * Rules strip pinned to the content bottom at full content width.
   * `undefined` when the spec has neither rules nor a footnote (never a
   * zero-sized box).
   */
  rules?: Box;
  /**
   * Optional side rail. `undefined` when no rail is requested (never a
   * zero-sized box). The rail spans exactly the grid's vertical band and has
   * already stolen its width (plus REGION_GAP) from the grid, never from
   * header/rules. `title` is a passthrough of `spec.sideRail.title`. The
   * requested rail width is silently capped at 30% of the content width.
   */
  rail?: { box: Box; title: string };
}

const REGION_GAP = 0.25;

export function partitionRegions(spec: BoardSpec): Regions {
  const { w: pageW, h: pageH } = POSTER_SIZES[spec.posterSize];
  const margin = clamp(pageH * 0.015, 0.5, 1.0);
  const content: Box = { x: margin, y: margin, w: pageW - 2 * margin, h: pageH - 2 * margin };

  const headerH = clamp(pageH * 0.11, 2.2, 6);
  const rulesH = spec.rulesContent.trim() || spec.rules.length > 0 || Boolean(spec.footnote) ? clamp(pageH * 0.07, 1.5, 4) : 0;

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
