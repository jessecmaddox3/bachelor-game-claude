import { describe, it, expect } from 'vitest';
import { composeScene } from '../../src/engine/scene/compose';
import { partitionRegions } from '../../src/engine/layout/regions';
import { solveGrid } from '../../src/engine/layout/gridSolver';
import { makeSpec } from '../helpers/fixtures';
import { testMetrics } from '../helpers/loadFonts';
import { overflowingRuns, outOfPage } from '../helpers/invariants';
import type { TextRun } from '../../src/engine/scene/types';

const m = testMetrics();

export function build(over: Record<string, unknown> = {}) {
  const spec = makeSpec(over);
  const regions = partitionRegions(spec);
  const solved = solveGrid(regions.grid, spec, m);
  if (!solved.feasible) throw new Error('fixture must be feasible');
  return { spec, scene: composeScene(spec, regions, solved, m) };
}

const texts = (s: ReturnType<typeof build>['scene']) =>
  s.primitives.filter((p): p is TextRun => p.kind === 'text');

describe('composeScene: header and rail', () => {
  it('produces a scene at page dimensions with zero invariant violations', () => {
    const { scene } = build();
    expect(scene.widthIn).toBe(24);
    expect(scene.heightIn).toBe(36);
    expect(overflowingRuns(scene, m)).toEqual([]);
    expect(outOfPage(scene)).toEqual([]);
  });

  it('renders title, honoree, and subtitle', () => {
    const { scene } = build();
    const strings = texts(scene).map((t) => t.text);
    expect(strings).toContain('BACHELOR');
    expect(strings).toContain('Steven');
    expect(strings).toContain('THE GAME');
  });

  it('omits the subtitle row when absent and still passes invariants', () => {
    const { scene } = build({ subtitle: undefined });
    expect(texts(scene).map((t) => t.text)).not.toContain('THE GAME');
    expect(overflowingRuns(scene, m)).toEqual([]);
  });

  it('draws the rail box and title when a rail is reserved', () => {
    const { scene } = build({ sideRail: { side: 'right', widthIn: 5, title: 'BEER PONG BRACKET' } });
    expect(texts(scene).map((t) => t.text)).toContain('BEER PONG BRACKET');
    expect(overflowingRuns(scene, m)).toEqual([]);
    expect(outOfPage(scene)).toEqual([]);
  });
});
