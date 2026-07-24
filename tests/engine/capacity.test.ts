import { describe, expect, it } from 'vitest';
import { buildBoard } from '../../src/engine/buildBoard';
import { estimateLetterCapacity } from '../../src/engine/layout/capacity';
import { boardSpecSchema, type Activity } from '../../src/models/boardSpec';
import { testMetrics } from '../helpers/loadFonts';
import { makeSpec } from '../helpers/fixtures';

const m = testMetrics();
const players = ['Jack', 'Bobbie', 'Shasha', 'Hunter', 'SG'];
const representative: Activity = {
  name: 'Complete a moderately long kids weekend activity',
  points: 3,
  maxPoints: 6,
  bonus: false,
};

function letter(over: Record<string, unknown> = {}) {
  return boardSpecSchema.parse({
    title: 'CAMP SHEISHEI',
    subtitle: 'KIDS WEEKEND',
    players,
    activities: Array.from({ length: 10 }, () => ({ ...representative })),
    posterSize: '8.5x11',
    rulesContent: '**PLAY FAIR**\nScore honestly and be kind.',
    ...over,
  });
}

describe('estimateLetterCapacity', () => {
  it('returns no activity guidance for non-Letter output', () => {
    expect(estimateLetterCapacity(makeSpec({ posterSize: '24x36' }), m)).toBeUndefined();
  });

  it('reports selected, total, additional, and overage counts', () => {
    const fit = estimateLetterCapacity(letter(), m);
    expect(fit).toBeDefined();
    expect(fit!.selectedActivities).toBe(10);
    expect(fit!.estimatedMaxActivities).toBeGreaterThanOrEqual(10);
    expect(fit!.estimatedAdditionalActivities)
      .toBe(fit!.estimatedMaxActivities - fit!.selectedActivities);
    expect(fit!.overBy).toBe(0);
  });

  it('uses a monotonic probe whose boundary agrees with the real build', () => {
    const spec = letter();
    const fit = estimateLetterCapacity(spec, m)!;
    const atLimit = boardSpecSchema.parse({
      ...spec,
      activities: Array.from({ length: fit.estimatedMaxActivities }, () => ({ ...representative })),
    });
    expect(buildBoard(atLimit, m).ok).toBe(true);
    if (fit.estimatedMaxActivities < 80) {
      const overLimit = boardSpecSchema.parse({
        ...spec,
        activities: Array.from({ length: fit.estimatedMaxActivities + 1 }, () => ({ ...representative })),
      });
      expect(buildBoard(overLimit, m).ok).toBe(false);
    }
  });

  it('recalculates upward for Compact Header and hidden rules', () => {
    const largeWithRules = estimateLetterCapacity(letter(), m)!;
    const compactWithRules = estimateLetterCapacity(letter({ letterHeaderStyle: 'compact' }), m)!;
    const largeWithoutRules = estimateLetterCapacity(letter({ includeRules: false }), m)!;
    const compactWithoutRules = estimateLetterCapacity(letter({
      letterHeaderStyle: 'compact',
      includeRules: false,
    }), m)!;

    expect(compactWithRules.estimatedMaxActivities)
      .toBeGreaterThanOrEqual(largeWithRules.estimatedMaxActivities);
    expect(largeWithoutRules.estimatedMaxActivities)
      .toBeGreaterThan(largeWithRules.estimatedMaxActivities);
    expect(compactWithoutRules.estimatedMaxActivities)
      .toBeGreaterThanOrEqual(largeWithoutRules.estimatedMaxActivities);
  });

  it('reports overage without changing the authoritative build result', () => {
    const crowded = letter({
      activities: Array.from({ length: 40 }, () => ({ ...representative })),
    });
    const fit = estimateLetterCapacity(crowded, m)!;
    expect(fit.overBy).toBeGreaterThan(0);
    expect(fit.estimatedAdditionalActivities).toBe(0);
    expect(buildBoard(crowded, m).ok).toBe(false);
  });

  it('never tells a currently feasible heterogeneous board to remove activities', () => {
    const feasible = letter({
      players: Array.from({ length: 11 }, (_, index) => `P${index}`),
      activities: [
        { name: 'W', points: { min: -99, max: 999 }, bonus: false },
        { name: 'A', points: 1, maxPoints: 99, bonus: false },
        ...Array.from({ length: 3 }, () => ({ name: 'A', points: 1, bonus: false })),
      ],
      includeRules: false,
    });

    expect(buildBoard(feasible, m).ok).toBe(true);
    const fit = estimateLetterCapacity(feasible, m)!;
    expect(fit.estimatedMaxActivities).toBeGreaterThanOrEqual(feasible.activities.length);
    expect(fit.overBy).toBe(0);
  });
});
