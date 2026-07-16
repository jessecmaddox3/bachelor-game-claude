import { z } from 'zod';

export const POSTER_SIZES = {
  '18x24': { w: 18, h: 24 },
  '24x36': { w: 24, h: 36 },
  '36x48': { w: 36, h: 48 },
  '48x72': { w: 48, h: 72 },
} as const;

export type PosterSizeId = keyof typeof POSTER_SIZES;

export const boardSpecSchema = z.object({
  title: z.string().min(1).max(60),
  honoree: z.string().min(1).max(30),
  subtitle: z.string().max(80).optional(),
  players: z.array(z.string().min(1).max(24)).min(8).max(35),
  activities: z
    .array(
      z.object({
        name: z.string().min(1).max(90),
        points: z.union([z.number().int().min(0).max(999), z.literal('TBD')]),
        bonus: z.boolean().default(false),
      }),
    )
    .min(5)
    .max(80),
  posterSize: z.enum(['18x24', '24x36', '36x48', '48x72']),
  rules: z.array(z.string().min(1).max(200)).max(8).default([]),
  theme: z
    .object({
      rowTint: z.string().default('#EAF1F8'),
      highlightPointsHeader: z.boolean().default(true),
      bonusBracket: z.boolean().default(true),
      headerDivider: z.boolean().default(true),
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
