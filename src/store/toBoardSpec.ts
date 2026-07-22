import type { z } from 'zod';
import { boardSpecSchema, type BoardSpec, type PointsValue } from '../models/boardSpec';
import { STARTER_RULES_CONTENT, type ActivityOccasion } from '../content/activities';
import { THEME_PRESETS } from '../content/themes';

/** Permissive editing shape: same fields as BoardSpec, but nothing enforced until validation. */
export type Draft = {
  title: string;
  honoree: string;
  subtitle: string;
  players: string[];
  /** `uid` is editor-only row identity (React keys); zod strips it from BoardSpec output. */
  activities: Array<{ uid: string; catalogId?: string; name: string; points: PointsValue; maxPoints?: number; bonus: boolean }>;
  /** Editor-only filter preference; zod strips it from the rendered BoardSpec. */
  libraryOccasion: ActivityOccasion;
  posterSize: BoardSpec['posterSize'];
  template: BoardSpec['template'];
  brackets: BoardSpec['brackets'];
  pointsRangeFormat: BoardSpec['pointsRangeFormat'];
  totalsTarget?: number;
  rulesTitle: string;
  rulesContent: string;
  /** Compatibility fields retained until the renderer migration is complete. */
  rulesHeadingSuffix: BoardSpec['rulesHeadingSuffix'];
  rules: Array<{ heading?: string; text: string }>;
  footnote: string;
  writeInRows: number;
  honoreeBonusRow: boolean;
  cornerBoxes: string[];
  theme: Partial<BoardSpec['theme']>;
};

export const DEFAULT_PARTICIPANTS = [
  'Jess', 'Kait', 'Jack', 'Bobbie', 'Caz', 'Brett', 'Rachel', 'Bo',
  'Eleanor', 'Hunter', 'SG', 'Coco', 'Nona', 'Shasha', 'Steven', 'Mary',
].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

export function sortParticipantNames(names: readonly string[]): string[] {
  return [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export function defaultDraft(): Draft {
  // Cloned so in-place draft mutation can never corrupt the shared preset/content constants.
  return structuredClone({
    title: 'Kids Weekend',
    honoree: '',
    subtitle: '',
    players: DEFAULT_PARTICIPANTS,
    activities: [],
    libraryOccasion: 'kids-weekend',
    posterSize: '24x36',
    template: 'portrait',
    brackets: [],
    pointsRangeFormat: 'words',
    totalsTarget: undefined,
    rulesTitle: 'GAME RULES:',
    rulesContent: STARTER_RULES_CONTENT,
    rulesHeadingSuffix: 'colon',
    rules: [],
    footnote: '',
    writeInRows: 0,
    honoreeBonusRow: false,
    cornerBoxes: [],
    theme: THEME_PRESETS[0]!.theme,
  });
}

/** Parse a user-typed points value: "3", "TBD", "1 to 6", "-5 - 5". Null when unparseable. */
export function parsePointsInput(s: string): PointsValue | null {
  const t = s.trim();
  if (/^tbd$/i.test(t)) return 'TBD';
  const range = t.match(/^(-?\d+)\s*(?:to|-)\s*(-?\d+)$/i);
  if (range) {
    const min = Number(range[1]);
    const max = Number(range[2]);
    return max > min ? { min, max } : null;
  }
  if (/^-?\d+$/.test(t)) return Number(t);
  return null;
}

export interface FieldError {
  field: string;
  message: string;
}

export type SpecResult = { ok: true; spec: BoardSpec } | { ok: false; errors: FieldError[] };

const FRIENDLY: Array<[RegExp, (path: string) => string]> = [
  [/^players$/, () => 'Add at least 8 players (35 max).'],
  [/^activities$/, () => 'Add at least 5 activities (80 max).'],
  [/points$/, () => 'Points must be a whole number, a range like "1 to 6", or TBD.'],
];

/** Friendly generic fallback for string length issues; raw zod message otherwise. */
function genericMessage(issue: z.ZodIssue): string {
  if (issue.code === 'too_small' && issue.type === 'string') {
    return Number(issue.minimum) === 1 ? 'Please fill this in.' : `Please enter at least ${issue.minimum} characters.`;
  }
  if (issue.code === 'too_big' && issue.type === 'string') {
    return `Keep this under ${issue.maximum} characters.`;
  }
  return issue.message;
}

export function toBoardSpec(draft: Draft): SpecResult {
  const candidate = {
    ...draft,
    subtitle: draft.subtitle || undefined,
    footnote: draft.footnote || undefined,
  };
  const parsed = boardSpecSchema.safeParse(candidate);
  if (parsed.success) return { ok: true, spec: parsed.data };
  const errors: FieldError[] = parsed.error.issues.map((issue) => {
    const field = issue.path.join('.');
    const friendly = FRIENDLY.find(([re]) => re.test(field));
    return { field, message: friendly ? friendly[1](field) : genericMessage(issue) };
  });
  // Dedupe by field (union errors emit several issues per path)
  const seen = new Set<string>();
  return { ok: false, errors: errors.filter((e) => (seen.has(e.field) ? false : (seen.add(e.field), true))) };
}
