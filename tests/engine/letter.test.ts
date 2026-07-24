import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { buildBoard } from '../../src/engine/buildBoard';
import { renderPdf } from '../../src/engine/render/pdf';
import { solveGrid, FLOOR_PT } from '../../src/engine/layout/gridSolver';
import { partitionRegions } from '../../src/engine/layout/regions';
import { planPortrait } from '../../src/engine/layout/portraitPlan';
import { boardSpecSchema, POSTER_SIZES } from '../../src/models/boardSpec';
import { PT_PER_IN } from '../../src/engine/geometry';
import { makeSpec } from '../helpers/fixtures';
import { testMetrics, fontBuffers } from '../helpers/loadFonts';
import { overflowingRuns, outOfPage } from '../helpers/invariants';

const m = testMetrics();

// The concrete launch case: a 5-person Kids Weekend printed at home on plain
// Letter paper, ~10 activities, a couple of rules.
function kidsWeekend(over: Record<string, unknown> = {}) {
  return boardSpecSchema.parse({
    title: 'Kids Weekend',
    players: ['Jack', 'Bobbie', 'Shasha', 'Hunter', 'SG'],
    activities: [
      { name: 'Make your bed every morning', points: 1 },
      { name: 'Try a new food without complaining', points: 5 },
      { name: 'Read a book to a younger sibling', points: 4 },
      { name: 'Help set the table without being asked', points: 2 },
      { name: 'Clean up all the toys', points: 2 },
      { name: 'Draw a picture for grandma', points: 3 },
      { name: 'Do 20 jumping jacks', points: 2 },
      { name: 'Win a round of the memory game', points: 3 },
      { name: 'Say please and thank you all day', points: 4 },
      { name: 'Water the plants', points: 1 },
    ],
    posterSize: '8.5x11',
    rules: [
      { text: 'Score your own points honestly.' },
      { text: 'A grown-up is the tiebreaker.' },
    ],
    ...over,
  });
}

describe('US Letter (8.5x11) home-printer board', () => {
  it('is a registered portrait size at exact Letter dimensions', () => {
    expect(POSTER_SIZES['8.5x11']).toEqual({ w: 8.5, h: 11 });
  });

  it('lays out the kids board feasibly at a legible body size', () => {
    const spec = kidsWeekend();
    const grid = partitionRegions(spec).grid;
    const solved = solveGrid(grid, spec, m);
    expect(solved.feasible).toBe(true);
    if (!solved.feasible) return;
    // Legible on paper read at arm's length: at/above the 9pt floor, no clipping.
    expect(solved.bodyPt).toBeGreaterThanOrEqual(FLOOR_PT);
    expect(solved.degradations.ellipsized).toBe(0);
  });

  it('builds the kids board with no overflow, in-page, and an honest badge', () => {
    const built = buildBoard(kidsWeekend(), m);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(overflowingRuns(built.scene, m)).toEqual([]);
    expect(outOfPage(built.scene)).toEqual([]);
    // Honest close-read grading: a clean ~10pt Letter board is not "poor", and
    // its advice must not tell a home printer their text is unreadable "from a
    // distance" (that warning is only meaningful for wall posters).
    expect(['good', 'tight']).toContain(built.quality.grade);
    expect(built.quality.advice.join(' ')).not.toMatch(/from a distance/i);
  });

  it('keeps all content at least 0.25in from the page edge (home-printer safe zone)', () => {
    const built = buildBoard(kidsWeekend(), m);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const { widthIn, heightIn, primitives } = built.scene;
    const SAFE = 0.25;
    const offenders = primitives
      .map((p) => {
        // The full-bleed white page background is the one intentional edge-to-edge fill.
        if (p.kind === 'rect' && p.box.x === 0 && p.box.y === 0 && p.box.w === widthIn && p.box.h === heightIn) return null;
        let x1: number, y1: number, x2: number, y2: number;
        if (p.kind === 'line') {
          x1 = Math.min(p.x1, p.x2); x2 = Math.max(p.x1, p.x2);
          y1 = Math.min(p.y1, p.y2); y2 = Math.max(p.y1, p.y2);
        } else {
          x1 = p.box.x; y1 = p.box.y; x2 = p.box.x + p.box.w; y2 = p.box.y + p.box.h;
        }
        const bad = x1 < SAFE - 1e-9 || y1 < SAFE - 1e-9 || x2 > widthIn - SAFE + 1e-9 || y2 > heightIn - SAFE + 1e-9;
        return bad ? p.kind : null;
      })
      .filter((k) => k !== null);
    expect(offenders).toEqual([]);
  });

  it('exports an exact US Letter PDF page (612 x 792 pt)', async () => {
    const built = buildBoard(kidsWeekend(), m);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.scene.widthIn * PT_PER_IN).toBe(612);
    expect(built.scene.heightIn * PT_PER_IN).toBe(792);
    const pdf = await renderPdf(built.scene, m, fontBuffers());
    const doc = await PDFDocument.load(pdf);
    expect(doc.getPageCount()).toBe(1);
    const { width, height } = doc.getPage(0).getSize();
    expect(width).toBeCloseTo(612, 3);
    expect(height).toBeCloseTo(792, 3);
  }, 30_000);

  it('fails honestly when the sheet is overloaded (30 players x 40 activities)', () => {
    const built = buildBoard(
      makeSpec({
        posterSize: '8.5x11',
        players: Array.from({ length: 30 }, (_, i) => `Player ${i + 1}`),
        activities: Array.from({ length: 40 }, (_, i) => ({
          name: `Activity number ${i + 1} that is fairly wordy`,
          points: (i % 5) + 1,
        })),
        rules: [{ text: 'Score honestly.' }],
      }),
      m,
    );
    expect(built.ok).toBe(false);
    if (built.ok) return;
    expect(built.reason.length).toBeGreaterThan(10);
    expect(built.reason).toContain('8.5x11');
    // It must own the honest verdict, not silently downscale to unreadable text.
    expect(built.reason).toMatch(/cannot fit|do not fit/i);
  });

  it('grades a sparse Letter board as good (uses the sheet instead of collapsing to 9pt)', () => {
    const built = buildBoard(kidsWeekend({ activities: Array.from({ length: 5 }, (_, i) => ({ name: `Chore ${i + 1}`, points: 1 })), rules: [] }), m);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    // The old height-based start collapsed every Letter board to the 9pt floor;
    // a nearly empty sheet should render comfortably larger than the floor.
    expect(built.quality.bodyPt).toBeGreaterThan(FLOOR_PT);
    expect(built.quality.grade).toBe('good');
  });

  it('omits printed rules without deleting their source content', () => {
    const spec = kidsWeekend({ includeRules: false });
    expect(spec.rules).toHaveLength(2);
    const built = buildBoard(spec, m);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const strings = built.scene.primitives
      .filter((primitive) => primitive.kind === 'text')
      .map((primitive) => primitive.text);
    expect(strings).not.toContain('GAME RULES:');
    expect(strings.join(' ')).not.toContain('Score your own points honestly.');
  });

  it('gives short Letter rules a smaller measured band than longer rules', () => {
    const short = planPortrait(kidsWeekend({
      rules: [],
      rulesContent: '**PLAY FAIR**\nScore honestly.',
    }), m);
    const long = planPortrait(kidsWeekend({
      rules: [],
      rulesContent: [
        '**HONOR SYSTEM**\nMark only activities you genuinely complete.',
        '**CONSENT**\nAnyone may skip or adapt an activity that feels unsafe or inaccessible.',
        '**POINTS**\nUse the listed points unless the group agrees on a change.',
        '**GOOD SPIRIT**\nThe goal is shared stories and good effort.',
      ].join('\n\n'),
    }), m);
    expect(short.ok).toBe(true);
    expect(long.ok).toBe(true);
    if (!short.ok || !long.ok) return;
    expect(short.regions.rules?.h).toBeLessThan(long.regions.rules?.h ?? 0);
    expect(short.rulesPlan?.pt).toBeGreaterThanOrEqual(8);
    expect(long.rulesPlan?.pt).toBeGreaterThanOrEqual(8);
  });

  it('fails with actionable guidance when included Letter rules exceed their maximum band', () => {
    const planned = planPortrait(kidsWeekend({
      rules: [],
      rulesContent: `**VERY LONG RULES**\n${'word '.repeat(4_000)}`,
    }), m);
    expect(planned.ok).toBe(false);
    if (planned.ok) return;
    expect(planned.kind).toBe('rules');
    expect(planned.reason).toMatch(/shorten|turn off/i);
  });

  it('renders Compact Header title and secondary copy on one measured line', () => {
    const spec = kidsWeekend({
      letterHeaderStyle: 'compact',
      title: 'CAMP SHEISHEI',
      subtitle: 'KIDS WEEKEND',
    });
    const planned = planPortrait(spec, m);
    expect(planned.ok).toBe(true);
    if (!planned.ok) return;
    expect(planned.regions.header.h).toBe(0.65);
    expect(planned.compactHeader).toBeDefined();

    const built = buildBoard(spec, m);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const textRuns = built.scene.primitives.filter((primitive) => primitive.kind === 'text');
    const title = textRuns.find((run) => run.text === 'CAMP SHEISHEI');
    const secondary = textRuns.find((run) => run.text === 'KIDS WEEKEND');
    expect(title).toBeDefined();
    expect(secondary).toBeDefined();
    expect(title!.box.y + title!.box.h / 2).toBeCloseTo(secondary!.box.y + secondary!.box.h / 2, 3);
    expect(overflowingRuns(built.scene, m)).toEqual([]);
  });

  it('combines legacy honoree and subtitle as Compact Header secondary copy', () => {
    const built = buildBoard(kidsWeekend({
      letterHeaderStyle: 'compact',
      honoree: 'Shasha',
      subtitle: 'Kids Weekend',
    }), m);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const textRuns = built.scene.primitives
      .filter((primitive) => primitive.kind === 'text');
    const strings = textRuns.map((primitive) => primitive.text);
    expect(strings).toContain('Shasha · Kids Weekend');
    expect(textRuns.some((run) => run.text === 'Shasha' && run.rotate === undefined)).toBe(false);
  });

  it('fails rather than dropping an overlong Compact Header headline', () => {
    const planned = planPortrait(kidsWeekend({
      letterHeaderStyle: 'compact',
      title: 'W'.repeat(60),
      subtitle: 'W'.repeat(80),
    }), m);
    expect(planned.ok).toBe(false);
    if (planned.ok) return;
    expect(planned.kind).toBe('compact-header');
    expect(planned.reason).toMatch(/shorten|large header/i);
  });

  it('rejects Compact Header with corner boxes instead of shrinking them illegibly', () => {
    const built = buildBoard(kidsWeekend({
      letterHeaderStyle: 'compact',
      cornerBoxes: ['WINNER'],
    }), m);
    expect(built.ok).toBe(false);
    if (built.ok) return;
    expect(built.reason).toMatch(/compact header.*corner boxes/i);
  });

  it('renders points and smaller parenthetical maximums in one Letter column', () => {
    const built = buildBoard(kidsWeekend({
      includeRules: false,
      activities: [
        { name: 'Repeatable game', points: 3, maxPoints: 6 },
        { name: 'Range game', points: { min: 1, max: 5 }, maxPoints: 10 },
        { name: 'Pending game', points: 'TBD' },
        { name: 'Fourth game', points: 2 },
        { name: 'Fifth game', points: 1 },
      ],
    }), m);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const textRuns = built.scene.primitives.filter((primitive) => primitive.kind === 'text');
    const strings = textRuns.map((run) => run.text);
    expect(strings).toContain('POINTS');
    expect(strings).toContain('(MAX)');
    expect(strings).not.toContain('MAX POINTS');
    expect(strings).toContain('(6)');
    expect(strings).toContain('(10)');
    expect(strings).toContain('1 to 5');
    expect(strings).toContain('TBD');
    const primary = textRuns.find((run) => run.text === '3');
    const maximum = textRuns.find((run) => run.text === '(6)');
    expect(primary).toBeDefined();
    expect(maximum).toBeDefined();
    expect(maximum!.sizePt).toBeLessThan(primary!.sizePt);
    expect(maximum!.box.y + maximum!.box.h / 2).toBeCloseTo(primary!.box.y + primary!.box.h / 2, 3);
    expect(overflowingRuns(built.scene, m)).toEqual([]);
    expect(outOfPage(built.scene)).toEqual([]);
  });
});
