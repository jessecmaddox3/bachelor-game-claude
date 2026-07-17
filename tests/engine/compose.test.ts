import { describe, it, expect } from 'vitest';
import { makeSpec } from '../helpers/fixtures';
import { testMetrics } from '../helpers/loadFonts';
import { overflowingRuns, outOfPage } from '../helpers/invariants';
import type { TextRun, RectPrim, LinePrim } from '../../src/engine/scene/types';
import { HIGHLIGHT } from '../../src/engine/scene/colors';
import { buildBoard } from '../../src/engine/buildBoard';

const m = testMetrics();

// Routed through buildBoard (not composeScene directly) so display-string
// preprocessing (allCaps) is part of what these tests exercise: the solver
// must measure exactly what compose renders.
export function build(over: Record<string, unknown> = {}) {
  const spec = makeSpec(over);
  const result = buildBoard(spec, m);
  if (!result.ok) throw new Error('fixture must be feasible');
  return { spec, scene: result.scene };
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

describe('composeScene: grid', () => {
  it('renders every player name rotated in the header band', () => {
    const { spec, scene } = build();
    const rotated = texts(scene).filter((t) => t.rotate === -90);
    for (const p of spec.players) {
      expect(rotated.map((t) => t.text)).toContain(p);
    }
    expect(overflowingRuns(scene, m)).toEqual([]);
  });

  it('renders every task label and its points value', () => {
    const { spec, scene } = build();
    const strings = texts(scene).map((t) => t.text);
    expect(strings).toContain(spec.activities[0].name);
    expect(strings).toContain(String(spec.activities[0].points));
    expect(strings).toContain('TOTAL');
  });

  it('tints alternate rows with the theme color', () => {
    const { spec, scene } = build();
    const tints = scene.primitives.filter(
      (p): p is RectPrim => p.kind === 'rect' && p.fill === spec.theme.rowTint,
    );
    expect(tints.length).toBe(Math.floor(spec.activities.length / 2));
  });

  it('draws one vertical line per column boundary', () => {
    const { spec, scene } = build();
    const verticals = scene.primitives.filter(
      (p): p is LinePrim => p.kind === 'line' && Math.abs(p.x1 - p.x2) < 0.001,
    );
    // outer left/right + task/points boundary + points/players boundary + between players
    expect(verticals.length).toBeGreaterThanOrEqual(spec.players.length + 3);
  });

  it('passes invariants at a dense but feasible spec', () => {
    const { scene } = build({
      posterSize: '24x36',
      activities: Array.from({ length: 50 }, (_, i) => ({
        name: `Do the challenge that is listed as number ${i + 1} here`,
        points: (i % 9) + 1,
      })),
    });
    expect(overflowingRuns(scene, m)).toEqual([]);
    expect(outOfPage(scene)).toEqual([]);
  });
});

describe('composeScene: bespoke elements and rules', () => {
  it('draws the highlight box around the points header when themed on', () => {
    const { scene } = build();
    const highlights = scene.primitives.filter(
      (p): p is RectPrim => p.kind === 'rect' && p.stroke === HIGHLIGHT,
    );
    expect(highlights).toHaveLength(1);
  });

  it('omits the highlight box when themed off', () => {
    const { scene } = build({ theme: { highlightPointsHeader: false } });
    const highlights = scene.primitives.filter(
      (p): p is RectPrim => p.kind === 'rect' && p.stroke === HIGHLIGHT,
    );
    expect(highlights).toHaveLength(0);
  });

  it('draws a bonus bracket beside contiguous bonus rows', () => {
    const activities = [
      ...Array.from({ length: 10 }, (_, i) => ({ name: `Task ${i}`, points: 1 })),
      { name: 'Beer pong finals', points: 'TBD', bonus: true },
      { name: 'Flip cup finals', points: 'TBD', bonus: true },
    ];
    const { scene } = build({ activities });
    const bracketLines = scene.primitives.filter(
      (p): p is LinePrim => p.kind === 'line' && p.color === HIGHLIGHT,
    );
    expect(bracketLines.length).toBeGreaterThanOrEqual(1);
    expect(outOfPage(scene)).toEqual([]);
  });

  it('renders the rules text wrapped and fitting', () => {
    const { spec, scene } = build();
    const all = texts(scene).map((t) => t.text).join(' ');
    expect(all).toContain('Score your own points honestly.');
    expect(overflowingRuns(scene, m)).toEqual([]);
  });
});

describe('buildBoard', () => {
  it('returns scene + quality for a valid spec', () => {
    const result = buildBoard(makeSpec(), m);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.scene.primitives.length).toBeGreaterThan(50);
    expect(['good', 'tight', 'poor']).toContain(result.quality.grade);
  });

  it('returns a reason for an infeasible spec', () => {
    const spec = makeSpec({
      posterSize: '18x24',
      players: Array.from({ length: 35 }, (_, i) => `Player Number ${i + 1}`),
      activities: Array.from({ length: 80 }, (_, i) => ({ name: `Task ${i}`, points: 1 })),
    });
    const result = buildBoard(spec, m);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason.length).toBeGreaterThan(10);
  });

  it('rejects invalid input with a Zod error', () => {
    expect(() => buildBoard({ nonsense: true }, m)).toThrow();
  });
});

describe('composeScene: steven theme elements', () => {
  const stevenTheme = {
    titleColor: '#45C0C8',
    accentColor: '#3A6BC7',
    activityColor: '#3A6BC7',
    pointsColTint: '#D8E9F5',
    maxPointsColTint: '#E8E8E8',
    cornerLabel: 'THE GAME',
    cornerSubLabel: 'ACTIVITIES',
    allCaps: true,
  };

  it('renders corner label and sublabel in the accent color', () => {
    const { scene } = build({ theme: stevenTheme });
    const corner = texts(scene).find((t) => t.text === 'THE GAME');
    expect(corner).toBeDefined();
    expect(corner!.color).toBe('#3A6BC7');
    expect(texts(scene).map((t) => t.text)).toContain('ACTIVITIES');
    expect(overflowingRuns(scene, m)).toEqual([]);
  });

  it('uppercases activity names when allCaps is on, measured as displayed', () => {
    const { scene } = build({ theme: stevenTheme });
    const strings = texts(scene).map((t) => t.text);
    expect(strings).toContain('CHALLENGE NUMBER 2');
    expect(strings).not.toContain('Challenge number 2');
    expect(overflowingRuns(scene, m)).toEqual([]);
  });

  it('tints the scoring columns and colors title/subtitle', () => {
    const { scene } = build({
      theme: stevenTheme,
      activities: Array.from({ length: 20 }, (_, i) => ({ name: `Task ${i}`, points: 1, maxPoints: 3 })),
    });
    const tints = scene.primitives.filter((p) => p.kind === 'rect' && p.fill === '#D8E9F5');
    expect(tints.length).toBeGreaterThanOrEqual(1);
    const grayTints = scene.primitives.filter((p) => p.kind === 'rect' && p.fill === '#E8E8E8');
    expect(grayTints.length).toBeGreaterThanOrEqual(1);
    const title = texts(scene).find((t) => t.text === 'BACHELOR');
    expect(title!.color).toBe('#45C0C8');
  });

  it('renders the points subheader and the max points column values', () => {
    const { scene } = build({
      activities: Array.from({ length: 20 }, (_, i) => ({
        name: `Task ${i}`,
        points: 1,
        ...(i === 0 ? { maxPoints: 5 } : {}),
      })),
    });
    const strings = texts(scene).map((t) => t.text);
    expect(strings).toContain('MAX POINTS');
    expect(strings.filter((s) => s === '5').length).toBeGreaterThanOrEqual(1);
    expect(overflowingRuns(scene, m)).toEqual([]);
    expect(outOfPage(scene)).toEqual([]);
  });

  it('renders range labels in the points column', () => {
    const { scene } = build({
      activities: [
        ...Array.from({ length: 5 }, (_, i) => ({ name: `Task ${i}`, points: 1 })),
        { name: 'Beer pong tournament', points: { min: 1, max: 6 } },
      ],
    });
    expect(texts(scene).map((t) => t.text)).toContain('1 to 6');
  });
});

describe('composeScene: write-in elements', () => {
  it('renders blank write-in rows with a rotated TBD marker', () => {
    const { scene } = build({ writeInRows: 2 });
    const markers = texts(scene).filter((t) => t.text === 'TBD' && t.rotate === -90);
    expect(markers).toHaveLength(2);
    expect(overflowingRuns(scene, m)).toEqual([]);
    expect(outOfPage(scene)).toEqual([]);
  });

  it('renders the honoree bonus row with its range', () => {
    const { scene } = build({ honoreeBonusRow: true });
    const strings = texts(scene).map((t) => t.text);
    expect(strings).toContain('**BONUS POINTS GRANTED BY STEVEN**');
    expect(strings).toContain('-5 to 5');
    expect(overflowingRuns(scene, m)).toEqual([]);
  });

  it('renders corner boxes with labels in the header', () => {
    const { scene } = build({ cornerBoxes: ['GRAND CHAMPION', 'THE LOSER OF IT ALL'] });
    const strings = texts(scene).map((t) => t.text);
    expect(strings).toContain('GRAND CHAMPION');
    expect(strings).toContain('THE LOSER OF IT ALL');
    const boxes = scene.primitives.filter(
      (p) => p.kind === 'rect' && p.stroke && !p.fill && p.box.h < 1 && p.box.w < 4,
    );
    expect(boxes.length).toBeGreaterThanOrEqual(2);
    expect(overflowingRuns(scene, m)).toEqual([]);
    expect(outOfPage(scene)).toEqual([]);
  });
});
