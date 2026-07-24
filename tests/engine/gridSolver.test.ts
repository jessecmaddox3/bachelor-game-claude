import { describe, it, expect } from 'vitest';
import { solveGrid, FLOOR_PT, MIN_COL_W, MIN_ROW_H, CELL_PAD } from '../../src/engine/layout/gridSolver';
import { partitionRegions } from '../../src/engine/layout/regions';
import { makeSpec, playerNames } from '../helpers/fixtures';
import { testMetrics } from '../helpers/loadFonts';

const m = testMetrics();

function solve(over: Record<string, unknown> = {}) {
  const spec = makeSpec(over);
  const regions = partitionRegions(spec);
  return { spec, regions, result: solveGrid(regions.grid, spec, m) };
}

describe('solveGrid', () => {
  it('solves a comfortable board at a generous size', () => {
    const { result } = solve();
    expect(result.feasible).toBe(true);
    if (!result.feasible) return;
    expect(result.bodyPt).toBeGreaterThanOrEqual(12);
    expect(result.degradations.ellipsized).toBe(0);
  });

  it('geometry adds up: columns fill the grid width, rows fill the height budget', () => {
    const { spec, regions, result } = solve();
    if (!result.feasible) throw new Error('expected feasible');
    const totalW = result.taskColW + result.pointsColW + result.maxPointsColW + result.playerColW * spec.players.length;
    expect(totalW).toBeCloseTo(regions.grid.w, 3);
    const totalH = result.headerBandH + result.rowH * (result.displayRows + 1);
    expect(totalH).toBeLessThanOrEqual(regions.grid.h + 0.01);
  });

  it('respects hard floors', () => {
    const { result } = solve({ players: playerNames(35), posterSize: '48x72' });
    if (!result.feasible) throw new Error('expected feasible');
    expect(result.bodyPt).toBeGreaterThanOrEqual(FLOOR_PT);
    expect(result.playerColW).toBeGreaterThanOrEqual(MIN_COL_W);
    expect(result.rowH).toBeGreaterThanOrEqual(MIN_ROW_H);
  });

  it('wrapped task lines each fit the task column', () => {
    const long = Array.from({ length: 20 }, (_, i) => ({
      name: `Convince a complete stranger to give a heartfelt toast for the groom number ${i}`,
      points: 5,
    }));
    const { result } = solve({ activities: long });
    if (!result.feasible) throw new Error('expected feasible');
    for (const lines of result.taskLines) {
      for (const line of lines) {
        expect(m.widthIn(line, 'body', result.bodyPt)).toBeLessThanOrEqual(result.taskColW - 2 * CELL_PAD + 0.01);
      }
    }
  });

  it('ellipsizes very long player names rather than overflowing the header band', () => {
    const { result } = solve({
      // Both names are exactly the schema's 24-char maximum.
      players: [...playerNames(10), 'Bartholomew Wellington I', 'Christopher Attenborough'],
    });
    if (!result.feasible) throw new Error('expected feasible');
    for (const name of result.playerNames) {
      expect(m.widthIn(name, 'bodyBold', result.bodyPt)).toBeLessThanOrEqual(result.headerBandH - 2 * CELL_PAD + 0.01);
    }
  });

  it('reports infeasible with a helpful reason for 35 players on 18x24', () => {
    const { result } = solve({ players: playerNames(35), posterSize: '18x24' });
    expect(result.feasible).toBe(false);
    if (result.feasible) return;
    expect(result.reason).toContain('18x24');
  });

  it('more activities never increases the solved font size', () => {
    const a = solve({ activities: Array.from({ length: 15 }, (_, i) => ({ name: `Task ${i}`, points: 1 })) });
    const b = solve({ activities: Array.from({ length: 60 }, (_, i) => ({ name: `Task ${i}`, points: 1 })) });
    if (!a.result.feasible || !b.result.feasible) throw new Error('expected both feasible');
    expect(b.result.bodyPt).toBeLessThanOrEqual(a.result.bodyPt);
  });

  it('reserves a max-points column only when any activity has maxPoints', () => {
    const base = solve();
    if (!base.result.feasible) throw new Error('expected feasible');
    expect(base.result.maxPointsColW).toBe(0);

    const withMax = solve({
      activities: Array.from({ length: 20 }, (_, i) => ({
        name: `Task ${i}`,
        points: 1,
        ...(i % 4 === 0 ? { maxPoints: 5 } : {}),
      })),
    });
    if (!withMax.result.feasible) throw new Error('expected feasible');
    expect(withMax.result.maxPointsColW).toBeGreaterThan(0);
  });

  it('combines capped scoring into the points column on Letter', () => {
    const letter = solve({
      posterSize: '8.5x11',
      players: ['Jack', 'Bobbie', 'Shasha', 'Hunter', 'SG'],
      activities: Array.from({ length: 10 }, (_, i) => ({
        name: `Task ${i}`,
        points: i === 1 ? { min: 1, max: 5 } : 3,
        ...(i < 2 ? { maxPoints: i === 0 ? 6 : 10 } : {}),
      })),
      includeRules: false,
    });
    if (!letter.result.feasible) throw new Error('expected feasible');
    expect(letter.result.maxPointsColW).toBe(0);
    expect(letter.result.pointsColW).toBeGreaterThan(MIN_COL_W);
  });

  it('counts write-in and honoree bonus rows in the row budget', () => {
    const plain = solve();
    const extra = solve({ writeInRows: 2, honoreeBonusRow: true });
    if (!plain.result.feasible || !extra.result.feasible) throw new Error('expected feasible');
    expect(extra.result.displayRows).toBe(plain.result.displayRows + 3);
    expect(extra.result.rowH).toBeLessThan(plain.result.rowH);
  });

  it('sizes the points column to range labels', () => {
    const ranges = solve({
      activities: Array.from({ length: 10 }, (_, i) => ({ name: `Task ${i}`, points: { min: -5, max: 5 } })),
    });
    if (!ranges.result.feasible) throw new Error('expected feasible');
    expect(
      m.widthIn('-5 to 5', 'bodyBold', ranges.result.bodyPt),
    ).toBeLessThanOrEqual(ranges.result.pointsColW - 2 * CELL_PAD + 0.01);
  });

  it('the honoree bonus label always fits the task column', () => {
    const { spec, result } = solve({
      posterSize: '18x24',
      honoree: 'A'.repeat(30),
      honoreeBonusRow: true,
      activities: Array.from({ length: 5 }, (_, i) => ({ name: `T${i}`, points: 1 })),
    });
    if (!result.feasible) throw new Error('expected feasible');
    const label = `**BONUS POINTS GRANTED BY ${spec.honoree.toUpperCase()}**`;
    expect(m.widthIn(label, 'bodyBold', result.bodyPt)).toBeLessThanOrEqual(result.taskColW - 2 * CELL_PAD + 0.01);
  });
});
