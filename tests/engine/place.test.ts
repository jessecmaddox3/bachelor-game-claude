import { describe, it, expect } from 'vitest';
import { placeText } from '../../src/engine/render/place';
import { testMetrics } from '../helpers/loadFonts';
import type { TextRun } from '../../src/engine/scene/types';

const m = testMetrics();

const run = (over: Partial<TextRun> = {}): TextRun => ({
  kind: 'text',
  box: { x: 1, y: 2, w: 4, h: 1 },
  text: 'Steven',
  fontId: 'body',
  sizePt: 24,
  color: '#000',
  align: 'left',
  ...over,
});

describe('placeText: horizontal', () => {
  it('centers the line vertically and returns the measured width', () => {
    const t = run();
    const p = placeText(t, m);
    const lineH = m.lineHeightIn('body', 24);
    const ascent = m.ascentIn('body', 24);
    expect(p.rotate).toBe(0);
    expect(p.widthIn).toBeCloseTo(m.widthIn('Steven', 'body', 24), 6);
    expect(p.y).toBeCloseTo(2 + (1 - lineH) / 2 + ascent, 6);
  });

  it('aligns left, center, right', () => {
    const w = m.widthIn('Steven', 'body', 24);
    expect(placeText(run({ align: 'left' }), m).x).toBeCloseTo(1, 6);
    expect(placeText(run({ align: 'center' }), m).x).toBeCloseTo(1 + (4 - w) / 2, 6);
    expect(placeText(run({ align: 'right' }), m).x).toBeCloseTo(1 + 4 - w, 6);
  });
});

describe('placeText: rotated -90', () => {
  const rot = (align: TextRun['align']) =>
    placeText(run({ rotate: -90, align, box: { x: 1, y: 2, w: 0.6, h: 5 } }), m);

  it('centers the line horizontally within box.w', () => {
    const lineH = m.lineHeightIn('body', 24);
    const ascent = m.ascentIn('body', 24);
    const p = rot('left');
    expect(p.rotate).toBe(-90);
    expect(p.x).toBeCloseTo(1 + (0.6 - lineH) / 2 + ascent, 6);
  });

  it('starts at the box bottom for align left, and shifts for center/right', () => {
    const w = m.widthIn('Steven', 'body', 24);
    expect(rot('left').y).toBeCloseTo(2 + 5, 6);
    expect(rot('center').y).toBeCloseTo(2 + 5 - (5 - w) / 2, 6);
    expect(rot('right').y).toBeCloseTo(2 + w, 6);
  });

  it('rotated text stays inside the box extents', () => {
    const p = rot('left');
    const lineH = m.lineHeightIn('body', 24);
    expect(p.x).toBeGreaterThanOrEqual(1);
    expect(p.x).toBeLessThanOrEqual(1 + 0.6);
    expect(p.y - p.widthIn).toBeGreaterThanOrEqual(2 - 0.01);
    expect(lineH).toBeLessThanOrEqual(0.6 + 0.01);
  });
});

describe('placeText: rotated -45', () => {
  it('anchors left at the bottom-left, centers, and anchors right at the top-right', () => {
    const box = { x: 1, y: 2, w: 4, h: 4 };
    const left = placeText(run({ rotate: -45, align: 'left', box }), m);
    const center = placeText(run({ rotate: -45, align: 'center', box }), m);
    const right = placeText(run({ rotate: -45, align: 'right', box }), m);
    expect(left.rotate).toBe(-45);
    expect(left.x).toBeLessThan(center.x);
    expect(center.x).toBeLessThan(right.x);
    expect(left.y).toBeGreaterThan(center.y);
    expect(center.y).toBeGreaterThan(right.y);
  });
});
