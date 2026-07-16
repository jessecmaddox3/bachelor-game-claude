import { describe, it, expect } from 'vitest';
import { testMetrics } from '../helpers/loadFonts';

const m = testMetrics();

describe('FontMetrics', () => {
  it('measures wider strings as wider', () => {
    expect(m.widthIn('HHHH', 'body', 12)).toBeGreaterThan(m.widthIn('H', 'body', 12));
  });

  it('scales width linearly with point size', () => {
    const w12 = m.widthIn('Bachelor Party', 'body', 12);
    const w24 = m.widthIn('Bachelor Party', 'body', 24);
    expect(w24).toBeCloseTo(w12 * 2, 5);
  });

  it('returns plausible physical sizes', () => {
    // a 72pt capital M in a heavy display sans is roughly 0.4"-1.4" wide
    const w = m.widthIn('M', 'display', 72);
    expect(w).toBeGreaterThan(0.4);
    expect(w).toBeLessThan(1.4);
  });

  it('line height is positive and scales linearly', () => {
    expect(m.lineHeightIn('body', 12)).toBeGreaterThan(0.1);
    expect(m.lineHeightIn('body', 24)).toBeCloseTo(m.lineHeightIn('body', 12) * 2, 5);
  });
});
