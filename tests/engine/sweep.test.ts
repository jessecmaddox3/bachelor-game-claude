import { describe, it, expect } from 'vitest';
import { buildBoard } from '../../src/engine/buildBoard';
import { makeSpec, playerNames } from '../helpers/fixtures';
import { testMetrics } from '../helpers/loadFonts';
import { overflowingRuns, outOfPage } from '../helpers/invariants';

const m = testMetrics();

const SIZES = ['18x24', '24x36', '36x48', '48x72'] as const;
const PLAYER_COUNTS = [8, 20, 35];
const ACTIVITY_COUNTS = [5, 30, 80];

const activityName = (i: number) =>
  i % 3 === 0
    ? `Convince a complete stranger to give a heartfelt toast for the groom, challenge ${i}`
    : `Challenge number ${i}`;

describe('invariant sweep across the full envelope', () => {
  for (const posterSize of SIZES) {
    for (const p of PLAYER_COUNTS) {
      for (const a of ACTIVITY_COUNTS) {
        it(`${posterSize} / ${p} players / ${a} activities: fits cleanly or refuses honestly`, () => {
          const spec = makeSpec({
            posterSize,
            players: playerNames(p),
            activities: Array.from({ length: a }, (_, i) => ({
              name: activityName(i),
              points: i % 7 === 0 ? 'TBD' : (i % 9) + 1,
              bonus: i % 11 === 0,
            })),
          });
          const result = buildBoard(spec, m);
          if (result.ok) {
            expect(overflowingRuns(result.scene, m)).toEqual([]);
            expect(outOfPage(result.scene)).toEqual([]);
          } else {
            expect(result.reason.length).toBeGreaterThan(10);
          }
        });
      }
    }
  }

  it('the flagship case is feasible: 20 players, 25 activities, 24x36 (Steven-like)', () => {
    const result = buildBoard(
      makeSpec({
        players: playerNames(20),
        activities: Array.from({ length: 25 }, (_, i) => ({ name: activityName(i), points: (i % 5) + 1 })),
      }),
      m,
    );
    expect(result.ok).toBe(true);
  });

  it('a side rail does not break invariants at high density', () => {
    const result = buildBoard(
      makeSpec({
        posterSize: '36x48',
        players: playerNames(20),
        activities: Array.from({ length: 40 }, (_, i) => ({ name: activityName(i), points: 1 })),
        sideRail: { side: 'right', widthIn: 6, title: 'BEER PONG BRACKET' },
      }),
      m,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(overflowingRuns(result.scene, m)).toEqual([]);
    expect(outOfPage(result.scene)).toEqual([]);
  });

  it('degenerate short content stays clean (regression: TOTAL fit + float round-trip + points header)', () => {
    const result = buildBoard(
      makeSpec({
        players: ['Al', 'Bo', 'Cy', 'Di', 'Ed', 'Fi', 'Gil', 'Hal'],
        activities: Array.from({ length: 20 }, (_, i) => ({ name: `T${i}`, points: 1 })),
      }),
      m,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(overflowingRuns(result.scene, m)).toEqual([]);
    expect(outOfPage(result.scene)).toEqual([]);
    const rotated = result.scene.primitives.filter(
      (p) => p.kind === 'text' && p.rotate === -90 && p.text === 'POSSIBLE POINTS',
    );
    expect(rotated).toHaveLength(1);
  });

  it('full fidelity features pass invariants at density', () => {
    const result = buildBoard(
      makeSpec({
        posterSize: '24x36',
        players: playerNames(24),
        activities: Array.from({ length: 40 }, (_, i) => ({
          name: activityName(i),
          points: i % 5 === 0 ? ({ min: -5, max: 5 } as const) : (i % 9) + 1,
          ...(i % 6 === 0 ? { maxPoints: (i % 4) + 1 } : {}),
          bonus: i % 11 === 0,
        })),
        writeInRows: 3,
        honoreeBonusRow: true,
        cornerBoxes: ['GRAND CHAMPION', 'THE LOSER OF IT ALL', 'MVP'],
        rules: Array.from({ length: 8 }, (_, i) => ({ heading: `RULE ${i}`, text: `Rule text number ${i} explaining the rule in a sentence.` })),
        footnote: 'Footnote line.',
        theme: { allCaps: true, pointsColTint: '#D8E9F5', maxPointsColTint: '#E8E8E8', cornerLabel: 'THE GAME', cornerSubLabel: 'ACTIVITIES' },
      }),
      m,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(overflowingRuns(result.scene, m)).toEqual([]);
    expect(outOfPage(result.scene)).toEqual([]);
  });

  it('fidelity features on the smallest poster fit or refuse honestly', () => {
    const result = buildBoard(
      makeSpec({
        posterSize: '18x24',
        players: playerNames(12),
        activities: Array.from({ length: 25 }, (_, i) => ({ name: `Task ${i}`, points: 1, maxPoints: 2 })),
        writeInRows: 2,
        honoreeBonusRow: true,
        theme: { allCaps: true },
      }),
      m,
    );
    if (result.ok) {
      expect(overflowingRuns(result.scene, m)).toEqual([]);
      expect(outOfPage(result.scene)).toEqual([]);
    } else {
      expect(result.reason.length).toBeGreaterThan(10);
    }
  });
});
