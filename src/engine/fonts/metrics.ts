// NOTE: opentype.js v2 exports `parse` and `Font` as named exports (no default
// `opentype` namespace object with a `.parse` method, as older v1/v0 examples
// show). We import them directly. @types/opentype.js is only published up to
// v1.3.10, but its declarations for `parse`/`Font`/`getAdvanceWidth`/
// `ascender`/`descender`/`unitsPerEm` match the v2 runtime API we use here.
import { parse, type Font } from 'opentype.js';
import { PT_PER_IN } from '../geometry';

export type FontId = 'display' | 'body' | 'bodyBold';
export type FontBuffers = Record<FontId, ArrayBuffer>;

/**
 * Exact text measurement against the bundled font files.
 * The PDF and PNG exports embed these same files, so a measurement here
 * is identical everywhere. All return values are in inches.
 *
 * Kerning: `getAdvanceWidth` applies kerning by default, so widths are NOT
 * strictly additive — `widthIn("AB") ≠ widthIn("A") + widthIn("B")`. Callers
 * must measure whole strings, never sum substring widths.
 *
 * Cost: construction parses the TTF binaries (~15ms for the three fonts).
 * Construct once and reuse the instance — never per-measurement or
 * per-loop-iteration.
 */
export class FontMetrics {
  private fonts: Record<FontId, Font>;

  constructor(buffers: FontBuffers) {
    this.fonts = {
      display: parse(buffers.display),
      body: parse(buffers.body),
      bodyBold: parse(buffers.bodyBold),
    };
  }

  widthIn(text: string, fontId: FontId, sizePt: number): number {
    return this.fonts[fontId].getAdvanceWidth(text, sizePt) / PT_PER_IN;
  }

  // Intentionally omits hhea.lineGap (all three bundled fonts have lineGap 0;
  // revisit if fonts are ever swapped).
  lineHeightIn(fontId: FontId, sizePt: number): number {
    const f = this.fonts[fontId];
    return (((f.ascender - f.descender) / f.unitsPerEm) * sizePt) / PT_PER_IN;
  }

  ascentIn(fontId: FontId, sizePt: number): number {
    const f = this.fonts[fontId];
    return ((f.ascender / f.unitsPerEm) * sizePt) / PT_PER_IN;
  }
}
