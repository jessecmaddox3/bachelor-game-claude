import { describe, it, expect } from 'vitest';
import { planPngScale, MAX_DIM_PX, MAX_AREA_PX } from '../../src/engine/render/png';

describe('planPngScale', () => {
  it('keeps 300 DPI for sizes that fit browser limits', () => {
    for (const [w, h] of [[18, 24], [24, 36], [36, 48]] as const) {
      const p = planPngScale(w, h, 300);
      expect(p.dpi).toBe(300);
      expect(p.reduced).toBe(false);
      expect(p.widthPx).toBe(w * 300);
      expect(p.heightPx).toBe(h * 300);
    }
  });

  it('auto-reduces 48x72 to the highest DPI that fits', () => {
    const p = planPngScale(48, 72, 300);
    expect(p.reduced).toBe(true);
    expect(p.dpi).toBeLessThan(300);
    expect(p.widthPx).toBeLessThanOrEqual(MAX_DIM_PX);
    expect(p.heightPx).toBeLessThanOrEqual(MAX_DIM_PX);
    expect(p.widthPx * p.heightPx).toBeLessThanOrEqual(MAX_AREA_PX);
    // maximality: one more DPI would break a limit
    const bigger = p.dpi + 1;
    const bw = Math.round(48 * bigger);
    const bh = Math.round(72 * bigger);
    expect(bw > MAX_DIM_PX || bh > MAX_DIM_PX || bw * bh > MAX_AREA_PX).toBe(true);
  });

  it('still produces a print-worthy DPI for the giant size', () => {
    expect(planPngScale(48, 72, 300).dpi).toBeGreaterThanOrEqual(150);
  });
});
