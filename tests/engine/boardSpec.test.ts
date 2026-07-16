import { describe, it, expect } from 'vitest';
import { boardSpecSchema } from '../../src/models/boardSpec';
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

  it('rejects fewer than 8 players', () => {
    expect(() => makeSpec({ players: ['A', 'B', 'C'] })).toThrow();
  });

  it('rejects more than 80 activities', () => {
    const many = Array.from({ length: 81 }, (_, i) => ({ name: `T${i}`, points: 1 }));
    expect(() => makeSpec({ activities: many })).toThrow();
  });

  it('rejects an unknown poster size', () => {
    expect(() => makeSpec({ posterSize: '11x17' })).toThrow();
  });
});
