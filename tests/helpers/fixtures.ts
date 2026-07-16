import { boardSpecSchema, type BoardSpec } from '../../src/models/boardSpec';

const NAMES = ['Jesse', 'Kyle', 'Oscar', 'Matt', 'Drew', 'Tony', 'Sam', 'Alex', 'Ben', 'Chris', 'Dan', 'Eric'];

export function makeSpec(over: Record<string, unknown> = {}): BoardSpec {
  return boardSpecSchema.parse({
    title: 'BACHELOR',
    honoree: 'Steven',
    subtitle: 'THE GAME',
    players: NAMES,
    activities: Array.from({ length: 20 }, (_, i) => ({
      name: `Challenge number ${i + 1}`,
      points: (i % 5) + 1,
    })),
    posterSize: '24x36',
    rules: ['Score your own points honestly.', 'The honoree can veto anything once.'],
    ...over,
  });
}

/** n plausible player names, cycling with varied lengths */
export function playerNames(n: number): string[] {
  const pool = ['Jo', 'Kyle', 'Oscar', 'Matthew', 'Bartholomew', 'Christopher W.', 'Drew', 'Sam', 'Alexander'];
  return Array.from({ length: n }, (_, i) => `${pool[i % pool.length]} ${Math.floor(i / pool.length) || ''}`.trim());
}
