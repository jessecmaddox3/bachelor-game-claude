import { z } from 'zod';

export const POSTER_SIZES = {
  '18x24': { w: 18, h: 24 },
  '24x36': { w: 24, h: 36 },
  '36x48': { w: 36, h: 48 },
  '48x72': { w: 48, h: 72 },
} as const;

export type PosterSizeId = keyof typeof POSTER_SIZES;

export const POSTER_SIZE_IDS = Object.keys(POSTER_SIZES) as [PosterSizeId, ...PosterSizeId[]];

export const pointsValueSchema = z.union([
  z.number().int().min(-99).max(999),
  z.literal('TBD'),
  z
    .object({ min: z.number().int().min(-99).max(999), max: z.number().int().min(-99).max(999) })
    .refine((r) => r.max > r.min, { message: 'max must exceed min', path: ['max'] }),
]);
export type PointsValue = z.infer<typeof pointsValueSchema>;

/** Human display form of a points value: 3, 'TBD', or '1 to 6'. */
export function pointsLabel(p: PointsValue): string {
  if (typeof p === 'object') return `${p.min} to ${p.max}`;
  return String(p);
}

export const boardSpecSchema = z.object({
  title: z.string().min(1).max(60),
  honoree: z.string().min(1).max(30),
  subtitle: z.string().max(80).optional(),
  players: z.array(z.string().min(1).max(24)).min(8).max(35),
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
  rules: z
    .array(z.object({ heading: z.string().min(1).max(40).optional(), text: z.string().min(1).max(300) }))
    .max(12)
    .default([]),
  footnote: z.string().max(200).optional(),
  /** Blank write-in rows appended after the activities (tiny rotated TBD marker). */
  writeInRows: z.number().int().min(0).max(5).default(0),
  /** Adds a "**BONUS POINTS GRANTED BY <HONOREE>**" row with -5 to 5 points. */
  honoreeBonusRow: z.boolean().default(false),
  /** Labeled write-in boxes in the header's top-right corner. */
  cornerBoxes: z.array(z.string().min(1).max(30)).max(3).default([]),
  theme: z
    .object({
      rowTint: z.string().default('#EAF1F8'),
      highlightPointsHeader: z.boolean().default(true),
      bonusBracket: z.boolean().default(true),
      headerDivider: z.boolean().default(true),
      /** Title and honoree masthead lines. */
      titleColor: z.string().default('#141414'),
      /** Subtitle, divider, corner label, TOTAL, rules headings, corner boxes. */
      accentColor: z.string().default('#141414'),
      /** Activity names, player names, corner sublabel. */
      activityColor: z.string().default('#141414'),
      /** Points-header highlight box and bonus bracket. */
      highlightColor: z.string().default('#B3261E'),
      /** '' disables the tint. */
      pointsColTint: z.string().default(''),
      maxPointsColTint: z.string().default(''),
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
