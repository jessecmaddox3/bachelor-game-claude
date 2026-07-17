import { boardSpecSchema, type BoardSpec, type PointsValue } from '../models/boardSpec';
import { ACTIVITY_LIBRARY, STARTER_RULES, STARTER_FOOTNOTE } from '../content/activities';
import { THEME_PRESETS } from '../content/themes';

/** Permissive editing shape: same fields as BoardSpec, but nothing enforced until validation. */
export type Draft = {
  title: string;
  honoree: string;
  subtitle: string;
  players: string[];
  activities: Array<{ name: string; points: PointsValue; maxPoints?: number; bonus: boolean }>;
  posterSize: BoardSpec['posterSize'];
  rules: Array<{ heading?: string; text: string }>;
  footnote: string;
  writeInRows: number;
  honoreeBonusRow: boolean;
  cornerBoxes: string[];
  theme: Partial<BoardSpec['theme']>;
};

export function defaultDraft(): Draft {
  return {
    title: 'THE BACHELOR WEEKEND OF',
    honoree: 'YOUR GUY HERE',
    subtitle: '',
    players: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6', 'Player 7', 'Player 8'],
    activities: ACTIVITY_LIBRARY.slice(0, 20).map((a) => ({
      name: a.name,
      points: a.points,
      ...(a.maxPoints !== undefined ? { maxPoints: a.maxPoints } : {}),
      bonus: false,
    })),
    posterSize: '24x36',
    rules: STARTER_RULES.slice(0, 4),
    footnote: STARTER_FOOTNOTE,
    writeInRows: 2,
    honoreeBonusRow: true,
    cornerBoxes: ['GRAND CHAMPION', 'THE LOSER OF IT ALL'],
    theme: THEME_PRESETS[0]!.theme,
  };
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
    return { field, message: friendly ? friendly[1](field) : issue.message };
  });
  // Dedupe by field (union errors emit several issues per path)
  const seen = new Set<string>();
  return { ok: false, errors: errors.filter((e) => (seen.has(e.field) ? false : (seen.add(e.field), true))) };
}
