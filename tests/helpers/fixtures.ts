import { boardSpecSchema, type BoardSpec } from '../../src/models/boardSpec';

// Default player pool for makeSpec: a stable set of short, realistic names so
// default-fixture layout results stay predictable across every later test.
// Intentionally separate from the varied-length pool in playerNames() below;
// do NOT merge them — changing these defaults would perturb every test baseline.
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
    rules: [
      { text: 'Score your own points honestly.' },
      { text: 'The honoree can veto anything once.' },
    ],
    ...over,
  });
}

/**
 * n plausible player names, cycling with varied lengths.
 *
 * Deliberately uses a varied-length pool (including long names like
 * 'Bartholomew' and 'Christopher W.') to stress-test text measurement and
 * ellipsizing in later layout tests. Cycles with numeric suffixes when n
 * exceeds the pool. Intentionally distinct from makeSpec's stable NAMES pool.
 */
export function playerNames(n: number): string[] {
  const pool = ['Jo', 'Kyle', 'Oscar', 'Matthew', 'Bartholomew', 'Christopher W.', 'Drew', 'Sam', 'Alexander'];
  return Array.from({ length: n }, (_, i) => `${pool[i % pool.length]} ${Math.floor(i / pool.length) || ''}`.trim());
}
