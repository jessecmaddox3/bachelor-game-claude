import { describe, it, expect } from 'vitest';
import { makeSpec } from '../helpers/fixtures';
import { testMetrics } from '../helpers/loadFonts';
import { overflowingRuns, outOfPage } from '../helpers/invariants';
import type { TextRun, RectPrim, LinePrim } from '../../src/engine/scene/types';
import { HIGHLIGHT } from '../../src/engine/scene/colors';
import { buildBoard } from '../../src/engine/buildBoard';
import { createJesse2017Draft } from '../../src/content/occasions';
import { toBoardSpec } from '../../src/store/toBoardSpec';

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

  it('lays out a new-board header using only title and subtitle when honoree is blank', () => {
    const { scene } = build({ title: 'Kids Weekend', honoree: '', subtitle: 'October 19th - 22nd, 2022 - Blue Ridge, GA' });
    const headerText = texts(scene).filter((run) => run.box.y < 5);
    expect(headerText.map((run) => run.text)).toEqual(expect.arrayContaining([
      'Kids Weekend', 'October 19th - 22nd, 2022 - Blue Ridge, GA',
    ]));
    expect(headerText.some((run) => run.text === '')).toBe(false);
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

  it('grows sparse landscape activity, point, and participant text within each cell', () => {
    const players = [
      'Bo', 'Bobby', 'Brett', 'Coco', 'Eleanor', 'Hunter', 'Jack', 'Jess', 'Kate', 'Kaz',
      'Mary', 'Nona', 'Rachel', 'SG', 'Shay Shay', 'Steven', 'Amy', 'Ben', 'Cara', 'Dan',
      'Eva', 'Finn', 'Gus', 'Hope', 'Ian', 'Jane', 'Kyle', 'Liam', 'Mia', 'Noah',
    ];
    const activities = Array.from({ length: 5 }, (_, i) => ({ name: `Sparse Task ${i + 1}`, points: i + 1 }));
    const { scene } = build({
      template: 'landscapeBrackets', posterSize: '60x48', players, activities,
      brackets: [], cornerBoxes: [], rules: [], rulesContent: '', footnote: '', totalsTarget: undefined,
    });
    const activityRuns = texts(scene).filter((run) => /^SPARSE TASK/.test(run.text));
    const pointRuns = texts(scene).filter((run) => ['1', '2', '3', '4', '5'].includes(run.text));
    const playerRuns = texts(scene).filter((run) => run.rotate === -45 && players.map((name) => name.toUpperCase()).includes(run.text));
    expect(activityRuns).toHaveLength(5);
    expect(activityRuns.every((run) => run.sizePt > 9 && run.sizePt <= 20)).toBe(true);
    expect(pointRuns.every((run) => run.sizePt > 9 && run.sizePt <= 20)).toBe(true);
    expect(playerRuns).toHaveLength(players.length);
    expect(playerRuns.every((run) => run.sizePt <= 18)).toBe(true);
    expect(overflowingRuns(scene, m)).toEqual([]);
    expect(outOfPage(scene)).toEqual([]);
  });

  it('fits sparse portrait activity, point, and participant text independently within each cell', () => {
    const players = Array.from({ length: 30 }, (_, i) => i === 0 ? 'Bartholomew Wellington' : `P${i + 1}`);
    const activities = Array.from({ length: 5 }, (_, i) => ({ name: `Portrait Task ${i + 1}`, points: i + 1 }));
    const result = buildBoard(makeSpec({
      posterSize: '24x36', players, activities,
      brackets: [], cornerBoxes: [], rules: [], rulesContent: '', footnote: '', totalsTarget: undefined,
    }), m);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const activityRuns = texts(result.scene).filter((run) => /^Portrait Task/.test(run.text));
    const pointRuns = texts(result.scene).filter((run) => ['1', '2', '3', '4', '5'].includes(run.text));
    const playerRuns = texts(result.scene).filter((run) => run.rotate === -90 && players.includes(run.text));
    expect(activityRuns).toHaveLength(5);
    expect(activityRuns.every((run) => run.sizePt >= result.quality.bodyPt && run.sizePt <= 20)).toBe(true);
    expect(pointRuns.every((run) => run.sizePt >= result.quality.bodyPt && run.sizePt <= 20)).toBe(true);
    expect(playerRuns.length).toBeGreaterThanOrEqual(players.length - 1);
    expect(playerRuns.every((run) => run.sizePt <= 18)).toBe(true);
    expect(overflowingRuns(result.scene, m)).toEqual([]);
  });

  it('never returns a successful landscape scene with worst-case allowed text overflow', () => {
    const result = buildBoard(makeSpec({
      template: 'landscapeBrackets',
      posterSize: '60x48',
      players: Array.from({ length: 30 }, (_, i) => i === 0 ? 'W'.repeat(24) : `P${i + 1}`),
      activities: [
        { name: 'W'.repeat(90), points: 1 },
        ...Array.from({ length: 4 }, (_, i) => ({ name: `Task ${i + 2}`, points: i + 2 })),
      ],
      brackets: [], cornerBoxes: [], rules: [], rulesContent: '', footnote: '', totalsTarget: undefined,
    }), m);
    if (result.ok) {
      expect(overflowingRuns(result.scene, m)).toEqual([]);
    } else {
      expect(result.reason).toMatch(/landscape content cannot fit/i);
    }
  });

  it('does not silently omit an unfit landscape rules heading', () => {
    const result = buildBoard(makeSpec({
      template: 'landscapeBrackets', posterSize: '60x48',
      players: ['Jess', 'Brett', 'Hunter', 'Kate', 'Jack', 'Bobby', 'Kaz', 'Bo'],
      activities: Array.from({ length: 5 }, (_, i) => ({ name: `Task ${i + 1}`, points: i + 1 })),
      brackets: [], cornerBoxes: [], rules: [], rulesContent: `**${'W'.repeat(300)}**`, footnote: '',
    }), m);
    expect(result.ok).toBe(false);
  });
});

describe('landscapeBrackets template: labels, size guard, and quality', () => {
  const landscapeSpec = (over: Record<string, unknown> = {}) => makeSpec({
    template: 'landscapeBrackets', posterSize: '60x48',
    players: Array.from({ length: 12 }, (_, i) => `P${i + 1}`),
    activities: Array.from({ length: 5 }, (_, i) => ({ name: `Task ${i + 1}`, points: i + 1 })),
    brackets: [], cornerBoxes: [], rules: [], rulesContent: '', footnote: '', totalsTarget: undefined,
    ...over,
  });

  it('renders spec-supplied section labels instead of hardcoded 2017 literals', () => {
    const result = buildBoard(landscapeSpec({
      landscapeLabels: {
        gameHeading: 'THE SHOWDOWN',
        activitiesLabel: 'CHALLENGES',
        deadlineNote: '(DUE BY MIDNIGHT)',
        pointsHeading: 'SCORE (MAX)',
        victimsHeading: 'PLAYERS',
        resultsHeading: 'THE FINAL RESULTS:',
      },
    }), m);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const strings = texts(result.scene).map((t) => t.text);
    // gameHeading renders one whitespace-delimited word per stacked line
    expect(strings).toContain('THE');
    expect(strings).toContain('SHOWDOWN');
    expect(strings).toContain('CHALLENGES');
    expect(strings).toContain('(DUE BY MIDNIGHT)');
    expect(strings).toContain('SCORE (MAX)');
    expect(strings).toContain('PLAYERS');
    expect(strings).toContain('THE FINAL RESULTS:');
    // the original event-specific literals no longer leak from the engine
    expect(strings).not.toContain('GAME');
    expect(strings).not.toContain('VICTIMS');
    expect(strings).not.toContain('THE AWFUL RESULTS:');
    expect(overflowingRuns(result.scene, m)).toEqual([]);
    expect(outOfPage(result.scene)).toEqual([]);
  });

  it('refuses a landscape board on any poster size other than 60x48', () => {
    for (const posterSize of ['18x24', '24x36', '36x48', '48x72'] as const) {
      const result = buildBoard(landscapeSpec({ posterSize }), m);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toMatch(/60"x48"|60x48/i);
    }
  });

  it('reports the real (smaller) rail rules point size, not the old fabricated 7.2pt', () => {
    const parsed = toBoardSpec(createJesse2017Draft());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const result = buildBoard(parsed.spec, m);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // The rail squeezes these NDA-length rules to a real size in [3.5, 4.5]pt;
    // the previous code lied with a constant 7.2pt / 'good'.
    expect(result.quality.bodyPt).toBeLessThan(7.2);
    expect(result.quality.bodyPt).toBeLessThanOrEqual(4.5);
    expect(result.quality.bodyPt).toBeGreaterThanOrEqual(3.5);
    expect(['good', 'tight', 'poor']).toContain(result.quality.grade);
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

describe('composeScene: structured rules footer', () => {
  const rules = [
    { heading: 'BUFFALO', text: 'If someone is drinking with their right hand, call Buffalo and they chug.' },
    { heading: 'WATER BOY', text: 'Offer water to every person to keep them hydrated.' },
    { heading: 'COIN RACE', text: 'Spin a coin, then chug before it falls to win.' },
    { heading: 'ICE BATH', text: 'One minute, fully wet.' },
    { text: 'Score your own points honestly.' },
  ];

  it('renders GAME RULES heading, rule headings, and texts in columns', () => {
    const rulesContent = rules.map((rule) => `${rule.heading ? `**${rule.heading}**\n` : ''}${rule.text}`).join('\n\n');
    const { scene } = build({ rules, rulesContent, footnote: 'Speaking a banned word means you must finish your drink.' });
    const strings = texts(scene).map((t) => t.text);
    expect(strings).toContain('GAME RULES:');
    expect(strings).toContain('BUFFALO:');
    expect(strings.join(' ')).toContain('call Buffalo and they chug.');
    expect(strings.join(' ')).toContain('Speaking a banned word');
    expect(overflowingRuns(scene, m)).toEqual([]);
    expect(outOfPage(scene)).toEqual([]);
  });

  it('headed rules use the accent color for headings', () => {
    const { scene } = build({ rules, rulesContent: '**BUFFALO**\nCall it and they chug.', theme: { accentColor: '#3A6BC7' } });
    const heading = texts(scene).find((t) => t.text === 'BUFFALO:');
    expect(heading!.color).toBe('#3A6BC7');
  });

  it('renders inline bold spans and measured bullets without marker characters', () => {
    const { scene } = build({
      rules: [],
      rulesContent: 'Choose a **helpful** challenge.\n\n- Encourage them **kindly** today.',
      footnote: '',
    });
    const runs = texts(scene);
    expect(runs.find((run) => run.text === 'helpful')?.fontId).toBe('bodyBold');
    expect(runs.find((run) => run.text === 'kindly')?.fontId).toBe('bodyBold');
    expect(runs.some((run) => run.text === '•')).toBe(true);
    expect(runs.some((run) => run.text.includes('**'))).toBe(false);
    expect(overflowingRuns(scene, m)).toEqual([]);
  });

  it('refuses rules that cannot fit instead of silently dropping content', () => {
    const fat = Array.from({ length: 12 }, (_, i) => ({
      heading: `RULE NUMBER ${i} WITH A LONG HEADING`,
      text: 'x'.repeat(280) + ' end.',
    }));
    const result = buildBoard(makeSpec({
      posterSize: '18x24',
      rules: fat,
      rulesContent: fat.map((rule) => `**${rule.heading}**\n${rule.text}`).join('\n\n'),
      footnote: 'f'.repeat(190),
    }), m);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/rules do not fit/i);
  }, 15_000);
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
