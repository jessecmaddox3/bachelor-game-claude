import { z } from 'zod';

export const CategoryIds = [
  'drinking',
  'physical',
  'social',
  'challenge',
  'game',
  'service',
  'wildcard',
] as const;

export type CategoryId = (typeof CategoryIds)[number];

export const CategoryLabels: Record<CategoryId, string> = {
  drinking: 'Drinking',
  physical: 'Physical',
  social: 'Social',
  challenge: 'Challenge',
  game: 'Game',
  service: 'Service',
  wildcard: 'Wildcard',
};

export const CategoryColors: Record<CategoryId, string> = {
  drinking: '#f59e0b',
  physical: '#ef4444',
  social: '#3b82f6',
  challenge: '#ec4899',
  game: '#8b5cf6',
  service: '#10b981',
  wildcard: '#6b7280',
};

export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(20),
  order: z.number().int().min(0),
});

export type Player = z.infer<typeof PlayerSchema>;

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(80),
  category: z.enum(CategoryIds),
  pointValue: z.number().int().min(-100).max(100),
  maxCompletions: z.number().int().min(1),
  order: z.number().int().min(0),
  source: z.enum(['manual', 'ai', 'preset']),
  pointsDisplay: z.string().optional(),
});

export type Task = z.infer<typeof TaskSchema>;

export const RuleEntrySchema = z.object({
  term: z.string(),
  definition: z.string(),
});

export type RuleEntry = z.infer<typeof RuleEntrySchema>;

export const DesignConfigSchema = z.object({
  posterSize: z.string(),
  showRules: z.boolean(),
  footerNote: z.string(),
  rulesEntries: z.array(RuleEntrySchema),
  emptyRows: z.number().int().min(0).max(10),
  showChampionLoser: z.boolean(),
  accentColor: z.string(),
});

export type DesignConfig = z.infer<typeof DesignConfigSchema>;

export const BoardSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  eventTitle: z.string(),
  honorName: z.string(),
  subtitle: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  players: z.array(PlayerSchema),
  tasks: z.array(TaskSchema),
  design: DesignConfigSchema,
});

export type Board = z.infer<typeof BoardSchema>;

export const DEFAULT_RULES_ENTRIES: RuleEntry[] = [
  { term: 'BUFFALO', definition: "If someone is drinking a beer with their right hand, call 'Buffalo' and they have to chug it." },
  { term: 'WATER BOY', definition: "Go around offering water to every person to ensure they are hydrated. After someone takes a drink, say 'Now that's what I call high-quality H2O.'" },
  { term: 'COIN RACE', definition: 'Spin a coin on a table, then start chugging. Finish chugging before the coin falls to win.' },
  { term: 'ICE BATH', definition: 'Sit in the ice bath for one minute. You must emerge with your entire body wet.' },
];

export function createDefaultDesign(): DesignConfig {
  return {
    posterSize: '24x36',
    showRules: true,
    footerNote: 'Speaking a banned word means you must finish your drink.',
    rulesEntries: [...DEFAULT_RULES_ENTRIES],
    emptyRows: 3,
    showChampionLoser: true,
    accentColor: '#00A6B6',
  };
}
