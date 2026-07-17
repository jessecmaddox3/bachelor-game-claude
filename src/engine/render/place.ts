import type { TextRun } from '../scene/types';
import type { FontMetrics } from '../fonts/metrics';

export interface Placement {
  /** Baseline start point, page inches (top-left origin). */
  x: number;
  y: number;
  /** Rotation about (x, y): 0, or -90 = reads bottom-to-top. */
  rotate: 0 | -90;
  /** Measured advance width in inches (drives SVG textLength). */
  widthIn: number;
}

/**
 * The single source of truth for where a TextRun's baseline starts. Every
 * renderer draws from this, so preview and print agree by construction.
 * Horizontal: the line is vertically centered in box.h; align picks x.
 * Rotated -90: the line is horizontally centered in box.w; align 'left'
 * starts at the box bottom (text reads upward), 'right' ends at the top.
 */
export function placeText(t: TextRun, m: FontMetrics): Placement {
  const w = m.widthIn(t.text, t.fontId, t.sizePt);
  const lineH = m.lineHeightIn(t.fontId, t.sizePt);
  const ascent = m.ascentIn(t.fontId, t.sizePt);

  if (t.rotate === -90) {
    // Rotating -90 about the baseline point maps ascent to page-left, so the
    // glyph column spans [x - ascent, x + (lineH - ascent)]; center it in box.w.
    const x = t.box.x + (t.box.w - lineH) / 2 + ascent;
    const free = t.box.h - w;
    const y =
      t.align === 'center' ? t.box.y + t.box.h - free / 2
      : t.align === 'right' ? t.box.y + w
      : t.box.y + t.box.h;
    return { x, y, rotate: -90, widthIn: w };
  }

  const y = t.box.y + (t.box.h - lineH) / 2 + ascent;
  const x =
    t.align === 'center' ? t.box.x + (t.box.w - w) / 2
    : t.align === 'right' ? t.box.x + t.box.w - w
    : t.box.x;
  return { x, y, rotate: 0, widthIn: w };
}
