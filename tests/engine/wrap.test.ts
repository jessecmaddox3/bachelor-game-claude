import { describe, it, expect } from 'vitest';
import { wrapToWidth, hardEllipsize, fitSizePt, fitWrappedText } from '../../src/engine/layout/wrap';
import { testMetrics } from '../helpers/loadFonts';

const m = testMetrics();

describe('hardEllipsize', () => {
  it('leaves fitting text alone', () => {
    const r = hardEllipsize('Kyle', 3, 'body', 12, m);
    expect(r).toEqual({ text: 'Kyle', ellipsized: false });
  });

  it('shortens overflowing text with an ellipsis that fits', () => {
    const r = hardEllipsize('Bartholomew Wellington the Third', 1.0, 'body', 12, m);
    expect(r.ellipsized).toBe(true);
    expect(r.text.endsWith('…')).toBe(true);
    expect(m.widthIn(r.text, 'body', 12)).toBeLessThanOrEqual(1.0 + 0.01);
  });

  it('returns an empty fitting marker when even an ellipsis is too wide', () => {
    const r = hardEllipsize('W', 0.001, 'body', 12, m);
    expect(r).toEqual({ text: '', ellipsized: true });
    expect(m.widthIn(r.text, 'body', 12)).toBeLessThanOrEqual(0.001);
  });
});

describe('wrapToWidth', () => {
  it('returns one line when it fits', () => {
    const r = wrapToWidth('Shotgun a beer', 5, 'body', 12, m, 2);
    expect(r.lines).toEqual(['Shotgun a beer']);
    expect(r.ellipsized).toBe(false);
  });

  it('wraps on word boundaries and every line fits', () => {
    const r = wrapToWidth('Convince a stranger to do a toast for the groom', 1.6, 'body', 12, m, 4);
    expect(r.lines.length).toBeGreaterThan(1);
    for (const line of r.lines) {
      expect(m.widthIn(line, 'body', 12)).toBeLessThanOrEqual(1.6 + 0.01);
    }
  });

  it('ellipsizes when exceeding maxLines, still fitting the width', () => {
    const r = wrapToWidth('Convince a stranger to do a toast for the groom at dinner', 1.2, 'body', 12, m, 2);
    expect(r.lines).toHaveLength(2);
    expect(r.ellipsized).toBe(true);
    expect(m.widthIn(r.lines[1], 'body', 12)).toBeLessThanOrEqual(1.2 + 0.01);
  });

  it('handles a single word wider than the column', () => {
    const r = wrapToWidth('Supercalifragilisticexpialidocious', 0.8, 'body', 12, m, 2);
    expect(r.ellipsized).toBe(true);
    for (const line of r.lines) {
      expect(m.widthIn(line, 'body', 12)).toBeLessThanOrEqual(0.8 + 0.01);
    }
  });
});

describe('fitSizePt', () => {
  it('finds a size where width and height both fit', () => {
    const pt = fitSizePt('BACHELOR', 6, 1, 'display', m, 300, 8);
    expect(pt).not.toBeNull();
    expect(m.widthIn('BACHELOR', 'display', pt!)).toBeLessThanOrEqual(6 + 0.01);
    expect(m.lineHeightIn('display', pt!)).toBeLessThanOrEqual(1 + 0.01);
  });

  it('returns null when even the minimum cannot fit', () => {
    expect(fitSizePt('BACHELOR WEEKEND EXTRAVAGANZA', 0.05, 1, 'display', m, 300, 8)).toBeNull();
  });
});

describe('fitWrappedText', () => {
  it('chooses the largest wrapped size that fits both dimensions', () => {
    const fit = fitWrappedText('A useful challenge with several words', 2.2, 0.8, 'body', m, {
      minPt: 6,
      maxPt: 20,
      maxLines: 4,
    });
    expect(fit).not.toBeNull();
    expect(fit!.pt).toBeGreaterThan(6);
    expect(fit!.lines.every((line) => m.widthIn(line, 'body', fit!.pt) <= 2.21)).toBe(true);
    expect(fit!.lines.length * m.lineHeightIn('body', fit!.pt)).toBeLessThanOrEqual(0.81);
  });

  it('wraps a long unspaced value without dropping characters', () => {
    const source = 'W'.repeat(90);
    const fit = fitWrappedText(source, 2.4, 0.9, 'body', m, {
      minPt: 5,
      maxPt: 12,
      maxLines: 5,
    });
    expect(fit).not.toBeNull();
    expect(fit!.lines.join('')).toBe(source);
    expect(fit!.lines.every((line) => m.widthIn(line, 'body', fit!.pt) <= 2.41)).toBe(true);
  });
});
