import { z } from 'zod';

export const POSTER_SIZES = {
  // 8.5x11 is the only home-printer size: it targets an exact US Letter page so
  // the PDF prints edge-correct at 100%. The rest are large-format poster sizes.
  '8.5x11': { w: 8.5, h: 11 },
  '18x24': { w: 18, h: 24 },
  '24x36': { w: 24, h: 36 },
  '36x48': { w: 36, h: 48 },
  '48x72': { w: 48, h: 72 },
  '60x48': { w: 60, h: 48 },
} as const;

export type PosterSizeId = keyof typeof POSTER_SIZES;

export const POSTER_SIZE_IDS = Object.keys(POSTER_SIZES) as [PosterSizeId, ...PosterSizeId[]];

/** Friendly dropdown labels; the raw keys are dimensions, not human-readable use cases. */
export const POSTER_SIZE_LABELS: Record<PosterSizeId, string> = {
  '8.5x11': '8.5 × 11 in — Letter (home printer)',
  '18x24': '18 × 24 in — Small poster',
  '24x36': '24 × 36 in — Standard poster',
  '36x48': '36 × 48 in — Large poster',
  '48x72': '48 × 72 in — Extra-large poster',
  '60x48': '60 × 48 in — Wide poster',
};

export const pointsValueSchema = z.union([
  z.number().int().min(-99).max(999),
  z.literal('TBD'),
  z
    .object({ min: z.number().int().min(-99).max(999), max: z.number().int().min(-99).max(999) })
    .refine((r) => r.max > r.min, { message: 'max must exceed min', path: ['max'] }),
]);
export type PointsValue = z.infer<typeof pointsValueSchema>;

/** Human display form of a points value, with word or compact dash ranges. */
export function pointsLabel(p: PointsValue, rangeFormat: 'words' | 'dash' = 'words'): string {
  if (typeof p === 'object') return rangeFormat === 'dash' ? `${p.min}-${p.max}` : `${p.min} to ${p.max}`;
  return String(p);
}

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a six-digit hex color.');
const optionalHexColorSchema = z.union([z.literal(''), hexColorSchema]);

export const boardSpecSchema = z.object({
  title: z.string().min(1).max(60),
  /** Legacy second masthead line. New boards leave this blank and use title + subtitle. */
  honoree: z.string().max(30).default(''),
  subtitle: z.string().max(80).optional(),
  // Floor of 2: the smallest meaningful competition. Lowered from 8 so small
  // groups (e.g. a 5-person Kids Weekend on Letter) are valid boards.
  players: z.array(z.string().min(1).max(24)).min(2).max(35),
  activities: z
    .array(
      z.object({
        name: z.string().min(1).max(90),
        /** Single value (negatives allowed, e.g. a -3 penalty activity), 'TBD', or a range. */
        points: pointsValueSchema,
        /** Cumulative cap for repeatable activities (the MAX POINTS column); blank means the activity can only be done once. */
        maxPoints: z.number().int().min(1).max(99).optional(),
        bonus: z.boolean().default(false),
      }),
    )
    .min(5)
    .max(80),
  posterSize: z.enum(POSTER_SIZE_IDS),
  template: z.enum(['portrait', 'landscapeBrackets']).default('portrait'),
  /** Letter-only title treatment. Other sizes retain their established masthead. */
  letterHeaderStyle: z.enum(['large', 'compact']).default('large'),
  /** Controls printed rule visibility without deleting the authored rule source. */
  includeRules: z.boolean().default(true),
  brackets: z.array(z.object({
    title: z.string().min(1).max(50),
    slots: z.union([z.literal(8), z.literal(16)]),
    teamSize: z.union([z.literal(1), z.literal(2)]).default(1),
  })).max(4, 'The Landscape / Brackets layout fits at most 4 brackets on a 60x48 poster.').default([]),
  /**
   * Section labels for the landscapeBrackets template. Defaults reproduce the
   * original 2017 board so existing specs render byte-identically; the engine
   * reads these instead of embedding event-specific literals. gameHeading is
   * rendered one whitespace-delimited word per stacked line.
   */
  landscapeLabels: z
    .object({
      gameHeading: z.string().max(40).default('THE GAME'),
      activitiesLabel: z.string().max(40).default('ACTIVITIES'),
      deadlineNote: z.string().max(80).default('(DEADLINE FOR POINTS: 9PM SATURDAY)'),
      pointsHeading: z.string().max(40).default('POINTS (MAX)'),
      victimsHeading: z.string().max(40).default('VICTIMS'),
      resultsHeading: z.string().max(60).default('THE AWFUL RESULTS:'),
    })
    .default({}),
  /** Display point ranges as "1 to 5" or the compact "1-5" form. */
  pointsRangeFormat: z.enum(['words', 'dash']).default('words'),
  /** Optional target printed in the TOTAL row's possible-points cell. */
  totalsTarget: z.number().int().min(0).max(9999).optional(),
  /** Optional strip title above the rules region; empty disables it. */
  rulesTitle: z.string().max(80).default('GAME RULES:'),
  /** Safe rich-text-lite source. Supports blank lines, `- ` bullets, and paired `**bold**`. */
  rulesContent: z.string().max(50000).default(''),
  /** Compatibility fields retained while the renderer migrates to rulesContent. */
  /** Generic boards use heading colons; source-faithful occasion packs may opt out. */
  rulesHeadingSuffix: z.enum(['colon', 'none']).default('colon'),
  rules: z
    .array(z.object({ heading: z.string().min(1).max(140).optional(), text: z.string().min(1).max(6000) }))
    .max(20)
    .default([]),
  footnote: z.string().max(200).optional(),
  /** Blank write-in rows appended after the activities (tiny rotated TBD marker). */
  writeInRows: z.number().int().min(0).max(5).default(0),
  /** Adds a "**BONUS POINTS GRANTED BY <HONOREE>**" row with -5 to 5 points. */
  honoreeBonusRow: z.boolean().default(false),
  /** Labeled write-in boxes in the header's top-right corner. */
  cornerBoxes: z.array(z.string().min(1).max(40)).max(4).default([]),
  theme: z
    .object({
      rowTint: hexColorSchema.default('#EAF1F8'),
      highlightPointsHeader: z.boolean().default(true),
      bonusBracket: z.boolean().default(true),
      headerDivider: z.boolean().default(true),
      /** Title and honoree masthead lines. */
      titleColor: hexColorSchema.default('#141414'),
      /** Subtitle, divider, corner label, TOTAL, rules headings, corner boxes. */
      accentColor: hexColorSchema.default('#141414'),
      /** Activity names, player names, corner sublabel. */
      activityColor: hexColorSchema.default('#141414'),
      /** Points-header highlight box and bonus bracket. */
      highlightColor: hexColorSchema.default('#B3261E'),
      /** '' disables the tint. */
      pointsColTint: optionalHexColorSchema.default(''),
      maxPointsColTint: optionalHexColorSchema.default(''),
      /** '' disables the corner labels. */
      cornerLabel: z.string().max(20).default(''),
      cornerSubLabel: z.string().max(20).default(''),
      allCaps: z.boolean().default(false),
    })
    .default({}),
  sideRail: z
    .object({
      side: z.enum(['left', 'right']),
      widthIn: z.number().min(3).max(12),
      title: z.string().min(1).max(40),
    })
    .optional(),
});

export type BoardSpec = z.infer<typeof boardSpecSchema>;
export type Activity = BoardSpec['activities'][number];
