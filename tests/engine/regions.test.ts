import { describe, it, expect } from 'vitest';
import { partitionRegions } from '../../src/engine/layout/regions';
import { makeSpec } from '../helpers/fixtures';

describe('partitionRegions', () => {
  it('stacks header, grid, rules inside the page with margins', () => {
    const r = partitionRegions(makeSpec());
    expect(r.pageW).toBe(24);
    expect(r.pageH).toBe(36);
    expect(r.header.y).toBeGreaterThan(0);
    expect(r.grid.y).toBeGreaterThan(r.header.y + r.header.h);
    expect(r.rules).toBeDefined();
    expect(r.rules!.y + r.rules!.h).toBeLessThan(36);
    expect(r.grid.y + r.grid.h).toBeLessThanOrEqual(r.rules!.y + 0.01);
  });

  it('omits the rules region when there are no rules', () => {
    const r = partitionRegions(makeSpec({ rules: [] }));
    expect(r.rules).toBeUndefined();
  });

  it('gives the grid full width when no rail is requested', () => {
    const r = partitionRegions(makeSpec());
    expect(r.rail).toBeUndefined();
    expect(r.grid.w).toBeCloseTo(r.header.w, 5);
  });

  it('reserves a right rail and narrows the grid', () => {
    const r = partitionRegions(makeSpec({ sideRail: { side: 'right', widthIn: 5, title: 'BEER PONG BRACKET' } }));
    expect(r.rail).toBeDefined();
    expect(r.rail!.box.w).toBeCloseTo(5, 5);
    expect(r.rail!.box.x).toBeGreaterThan(r.grid.x + r.grid.w);
    expect(r.grid.w).toBeLessThan(r.header.w - 5);
    expect(r.rail!.title).toBe('BEER PONG BRACKET');
  });

  it('places a left rail before the grid', () => {
    const r = partitionRegions(makeSpec({ sideRail: { side: 'left', widthIn: 4, title: 'BRACKET' } }));
    expect(r.rail!.box.x).toBeLessThan(r.grid.x);
  });

  it('caps rail width at 30% of content width', () => {
    const r = partitionRegions(makeSpec({ posterSize: '18x24', sideRail: { side: 'right', widthIn: 12, title: 'B' } }));
    expect(r.rail!.box.w).toBeLessThanOrEqual((18 - 1) * 0.3 + 0.01);
  });
});
