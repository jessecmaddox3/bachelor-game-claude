import { describe, it, expect } from 'vitest';
import { boardSpecSchema, pointsLabel } from '../../src/models/boardSpec';
import { makeSpec } from '../helpers/fixtures';

describe('boardSpecSchema', () => {
  it('accepts a valid spec and applies theme defaults', () => {
    const spec = makeSpec();
    expect(spec.theme.rowTint).toBe('#EAF1F8');
    expect(spec.theme.highlightPointsHeader).toBe(true);
    expect(spec.activities[0].bonus).toBe(false);
  });

  it('accepts TBD points and bonus rows', () => {
    const spec = makeSpec({
      activities: [
        ...Array.from({ length: 5 }, (_, i) => ({ name: `Task ${i}`, points: i + 1 })),
        { name: 'Beer pong champion', points: 'TBD', bonus: true },
      ],
    });
    expect(spec.activities[5].points).toBe('TBD');
    expect(spec.activities[5].bonus).toBe(true);
  });

  it('rejects fewer than 2 players', () => {
    expect(() => makeSpec({ players: ['A'] })).toThrow();
  });

  it('accepts a small group (5 players) for a home-printer board', () => {
    expect(() => makeSpec({ players: ['Jack', 'Bobbie', 'Shasha', 'Hunter', 'SG'] })).not.toThrow();
  });

  it('rejects more than 80 activities', () => {
    const many = Array.from({ length: 81 }, (_, i) => ({ name: `T${i}`, points: 1 }));
    expect(() => makeSpec({ activities: many })).toThrow();
  });

  it('rejects an unknown poster size', () => {
    expect(() => makeSpec({ posterSize: '11x17' })).toThrow();
  });

  it('accepts point ranges and formats labels', () => {
    const spec = makeSpec({
      activities: [
        ...Array.from({ length: 5 }, (_, i) => ({ name: `Task ${i}`, points: i + 1 })),
        { name: 'Beer pong tournament', points: { min: 1, max: 6 } },
      ],
    });
    expect(pointsLabel(spec.activities[5]!.points)).toBe('1 to 6');
    expect(pointsLabel(spec.activities[5]!.points, 'dash')).toBe('1-6');
    expect(pointsLabel(-3)).toBe('-3');
    expect(pointsLabel('TBD')).toBe('TBD');
  });

  it('accepts four corner boxes, compact ranges, and a totals target', () => {
    const spec = makeSpec({
      pointsRangeFormat: 'dash',
      totalsTarget: 100,
      cornerBoxes: ['FIRST', 'SECOND', 'THIRD', 'LAST'],
    });
    expect(spec.pointsRangeFormat).toBe('dash');
    expect(spec.totalsTarget).toBe(100);
    expect(spec.cornerBoxes).toHaveLength(4);
  });

  it('rejects renderer-unsafe color strings at the schema boundary', () => {
    expect(() => makeSpec({ theme: { titleColor: 'red' } })).toThrow();
    expect(() => makeSpec({ theme: { pointsColTint: '' } })).not.toThrow();
  });

  it('rejects inverted ranges', () => {
    expect(() =>
      makeSpec({
        activities: [
          ...Array.from({ length: 5 }, (_, i) => ({ name: `Task ${i}`, points: 1 })),
          { name: 'Bad', points: { min: 5, max: 5 } },
        ],
      }),
    ).toThrow();
  });

  it('caps the landscape layout at four brackets with a clear message', () => {
    const bracket = { title: 'BEER PONG', slots: 8 as const };
    expect(() => makeSpec({ brackets: Array.from({ length: 4 }, () => ({ ...bracket })) })).not.toThrow();
    expect(() => makeSpec({ brackets: Array.from({ length: 5 }, () => ({ ...bracket })) }))
      .toThrow(/at most 4 brackets/i);
  });

  it('defaults landscape section labels to the original board strings', () => {
    const labels = makeSpec().landscapeLabels;
    expect(labels.gameHeading).toBe('THE GAME');
    expect(labels.activitiesLabel).toBe('ACTIVITIES');
    expect(labels.deadlineNote).toBe('(DEADLINE FOR POINTS: 9PM SATURDAY)');
    expect(labels.pointsHeading).toBe('POINTS (MAX)');
    expect(labels.victimsHeading).toBe('VICTIMS');
    expect(labels.resultsHeading).toBe('THE AWFUL RESULTS:');
  });

  it('accepts maxPoints, write-ins, honoree bonus, corner boxes, structured rules', () => {
    const spec = makeSpec({
      activities: [
        ...Array.from({ length: 5 }, (_, i) => ({ name: `Task ${i}`, points: 1, maxPoints: i + 1 })),
      ],
      writeInRows: 2,
      honoreeBonusRow: true,
      cornerBoxes: ['GRAND CHAMPION', 'THE LOSER OF IT ALL'],
      rules: [{ heading: 'BUFFALO', text: 'Call it and they chug.' }],
      footnote: 'Speaking a banned word means you must finish your drink.',
    });
    expect(spec.activities[0]!.maxPoints).toBe(1);
    expect(spec.writeInRows).toBe(2);
    expect(spec.theme.allCaps).toBe(false);
  });
});
