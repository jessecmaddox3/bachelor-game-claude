import type { Box } from '../geometry';
import type { FontId } from '../fonts/metrics';

/**
 * A Scene is the fully-solved poster: every primitive has a final position
 * and size in inches. Renderers draw it verbatim and make no layout decisions.
 * TextRun.box is the inner box the glyphs must fit (padding already applied).
 * rotate: -90 = text reads bottom-to-top; measured width must fit box.h.
 */
export interface TextRun {
  kind: 'text';
  box: Box;
  text: string;
  fontId: FontId;
  sizePt: number;
  color: string;
  align: 'left' | 'center' | 'right';
  rotate?: -90;
}

/**
 * Stroke, when present, is drawn centered on the box edge (SVG default),
 * so it extends strokeWidthIn/2 beyond the box on each side. Layout code
 * must leave that clearance from page/region edges; the outOfPage checker
 * intentionally checks the box only, not the stroke overhang.
 */
export interface RectPrim {
  kind: 'rect';
  box: Box;
  fill?: string;
  stroke?: string;
  strokeWidthIn?: number;
}

/**
 * All coordinates in inches from the page origin (top-left).
 * widthIn is the stroke width in inches, drawn centered on the line.
 */
export interface LinePrim {
  kind: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  widthIn: number;
}

export type Primitive = TextRun | RectPrim | LinePrim;

export interface Scene {
  widthIn: number;
  heightIn: number;
  primitives: Primitive[];
}
