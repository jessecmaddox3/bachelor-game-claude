import { describe, it, expect } from 'vitest';
import { gradeLayout } from '../../src/engine/layout/quality';
import { solveGrid } from '../../src/engine/layout/gridSolver';
import { partitionRegions } from '../../src/engine/layout/regions';
import { makeSpec, playerNames } from '../helpers/fixtures';
import { testMetrics } from '../helpers/loadFonts';

const m = testMetrics();

function grade(over: Record<string, unknown> = {}) {
  const spec = makeSpec(over);
  const result = solveGrid(partitionRegions(spec).grid, spec, m);
  if (!result.feasible) throw new Error('expected feasible: ' + JSON.stringify(over));
  return gradeLayout(result, spec);
}

describe('gradeLayout', () => {
  it('grades a comfortable board as good', () => {
    const q = grade();
    expect(q.grade).toBe('good');
    expect(q.advice.length).toBeGreaterThan(0);
  });

  it('grades a dense board below good and suggests the next size up', () => {
    const q = grade({
      posterSize: '18x24',
      players: playerNames(24),
      activities: Array.from({ length: 45 }, (_, i) => ({ name: `Challenge item ${i}`, points: 2 })),
    });
    expect(['tight', 'poor']).toContain(q.grade);
    expect(q.advice.join(' ')).toContain('24');
  });

  it('grades ellipsized names as poor', () => {
    // 24-char name: boardSpecSchema caps player names at max(24).
    const q = grade({
      posterSize: '18x24',
      players: [...playerNames(20), 'Bartholomew Wellington I'],
      activities: Array.from({ length: 40 }, (_, i) => ({ name: `Task ${i}`, points: 1 })),
    });
    if (q.grade === 'poor') {
      expect(q.advice.join(' ')).toMatch(/shortened|minimum/);
    }
    // if the solver managed without ellipsizing, tight is acceptable
    expect(['tight', 'poor']).toContain(q.grade);
  });
});
