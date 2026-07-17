# Plan 3 of 3: Wizard UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the engine into a usable app: a three-step wizard (Setup → Activities → Design) with a live measured preview, quality feedback, and PDF/PNG export.

**Architecture:** React SPA over the frozen engine API (`src/engine/index.ts`). A zustand store holds a permissive Draft; `toBoardSpec` validates it into a `BoardSpec` with friendly per-field errors (including the points-union flattening). Fonts load once at boot (FontFace for the in-DOM preview + the same buffers into FontMetrics, so preview text uses the exact faces the engine measured). The preview debounces `buildBoard` (solver worst case ~205ms) and injects `renderSvg` output in-DOM. Export uses `renderPdf` and the font-embedded SVG → `rasterizePng` path, with a Safari blank-canvas probe added to `rasterizePng` (known silent-failure gap). Starter content (activity library, rules, theme presets) is recovered from the build-4 files in git history, mapped to schema v2; the full content pass is Plan 4.

**Tech Stack:** React 19, zustand (installed), file-saver (installed), vitest + jsdom + @testing-library/react (new devDeps). No component library — plain elements + one CSS file.

**Model note:** all tasks on **Fable 5** except Task 1 (content transcription — Sonnet is fine).

**Branch:** create `plan3-wizard` off main before Task 1.

## Plan-3 must-dos carried from prior reviews (all covered here)

1. FontFace families must match svg.ts's FAMILY/WEIGHT exactly ('Archivo Black' 400, 'Lato' 400/700) — Task 3.
2. Safari PNG silent-blank: post-draw pixel probe in rasterizePng — Task 6.
3. Points union zod error flattening for forms — Task 2.
4. Color fields hex-validated in the wizard (schema stays permissive) — Task 5.
5. Preview debounce ≥250ms (solver ~205ms worst case) — Task 3.

---

## File structure

```
src/content/activities.ts      44-item library (from build-4 presets.ts) + starter rules/footnote
src/content/themes.ts          Theme presets: steven/ink/casino/outdoors (+ ThemePreset type)
src/store/wizardStore.ts       zustand store: Draft, step, patch/reset, versioned localStorage persist
src/store/toBoardSpec.ts       Draft -> BoardSpec safeParse + friendly error map + parsePointsInput
src/app/fonts.ts               loadAppFonts(): FontFace registration + FontMetrics/buffers singletons
src/app/useBoard.ts            debounced draft -> buildBoard result hook
src/app/export.ts              exportPdf/exportPng (Safari probe via rasterizePng), filenames
src/app/App.tsx                shell: header, step tabs, panels + always-visible Preview
src/app/Preview.tsx            in-DOM SVG preview + quality badge + infeasible/invalid message
src/app/steps/SetupStep.tsx    event fields + poster size + roster editor
src/app/steps/ActivitiesStep.tsx  library picker + activity table + options toggles
src/app/steps/DesignStep.tsx   theme presets + color fields + corner boxes + rules + export buttons
src/main.tsx                   boot: load fonts, render App
src/index.css                  minimal styles
src/engine/render/png.ts       MODIFIED: blank-canvas probe in rasterizePng
tests/content/content.test.ts
tests/store/wizardStore.test.ts
tests/store/toBoardSpec.test.ts
tests/app/appSmoke.test.tsx    (jsdom)
tests/app/export.test.ts
```

---

### Task 1: Branch, deps, and the starter content module

**Files:**
- Create: `src/content/activities.ts`, `src/content/themes.ts`
- Test: `tests/content/content.test.ts`

- [ ] **Step 1: Branch + deps**

```bash
cd /Users/jesse/claude/bachelor-game-claude
git checkout -b plan3-wizard
npm install -D jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

- [ ] **Step 2: Write the failing test**

Create `tests/content/content.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ACTIVITY_LIBRARY, ACTIVITY_CATEGORIES, STARTER_RULES, STARTER_FOOTNOTE } from '../../src/content/activities';
import { THEME_PRESETS } from '../../src/content/themes';
import { boardSpecSchema, pointsValueSchema } from '../../src/models/boardSpec';
import { makeSpec } from '../helpers/fixtures';

describe('activity library', () => {
  it('has at least 40 activities, all schema-valid', () => {
    expect(ACTIVITY_LIBRARY.length).toBeGreaterThanOrEqual(40);
    for (const a of ACTIVITY_LIBRARY) {
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.name.length).toBeLessThanOrEqual(90);
      expect(pointsValueSchema.safeParse(a.points).success).toBe(true);
      expect(ACTIVITY_CATEGORIES).toContain(a.category);
      if (a.maxPoints !== undefined) {
        expect(a.maxPoints).toBeGreaterThanOrEqual(1);
        expect(a.maxPoints).toBeLessThanOrEqual(99);
      }
    }
  });

  it('tournament entries carry ranges', () => {
    const bp = ACTIVITY_LIBRARY.find((a) => a.name === 'Beer Pong Tournament');
    expect(bp?.points).toEqual({ min: 1, max: 6 });
  });

  it('starter rules and footnote satisfy the schema inside a spec', () => {
    const spec = makeSpec({ rules: STARTER_RULES, footnote: STARTER_FOOTNOTE });
    expect(spec.rules.length).toBeGreaterThanOrEqual(4);
  });
});

describe('theme presets', () => {
  it('every preset merges into a valid spec theme', () => {
    expect(THEME_PRESETS.length).toBeGreaterThanOrEqual(4);
    for (const p of THEME_PRESETS) {
      const spec = boardSpecSchema.parse({ ...makeSpec(), theme: p.theme });
      expect(spec.theme).toBeDefined();
      expect(p.id.length).toBeGreaterThan(0);
      expect(p.name.length).toBeGreaterThan(0);
    }
  });

  it('includes the steven look with the fidelity fields on', () => {
    const steven = THEME_PRESETS.find((p) => p.id === 'steven');
    expect(steven?.theme.allCaps).toBe(true);
    expect(steven?.theme.cornerLabel).toBe('THE GAME');
  });
});
```

- [ ] **Step 3: Run to verify it fails** (`npx vitest run tests/content/content.test.ts` — cannot resolve module)

- [ ] **Step 4: Implement the content module**

Create `src/content/activities.ts`. Source material: `git show d0eb034:src/config/presets.ts` (the build-4 library). Map every entry: `title`→`name`, `pointValue`→`points` (but entries with `pointsDisplay: '1 to 6'` become `points: { min: 1, max: 6 }`), `maxCompletions > 1`→`maxPoints: maxCompletions` (maxCompletions of 1 maps to NO maxPoints — blank means once), and keep the category. Drop the 'General Bonus' entry (superseded by honoreeBonusRow). Structure:

```ts
import type { PointsValue } from '../models/boardSpec';

export const ACTIVITY_CATEGORIES = ['drinking', 'physical', 'service', 'challenge', 'game', 'social', 'wildcard'] as const;
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export interface PresetActivity {
  name: string;
  points: PointsValue;
  maxPoints?: number;
  category: ActivityCategory;
}

export const ACTIVITY_LIBRARY: PresetActivity[] = [
  { name: 'Go to Sleep Before 7pm', points: 3, category: 'challenge' },
  { name: 'Go to Sleep After 2:30am', points: 4, category: 'challenge' },
  { name: "Don't Sleep in a Bed", points: 3, category: 'challenge' },
  { name: "Don't Take a Bath/Shower", points: 2, category: 'challenge' },
  { name: 'Shotgun a Beer', points: 1, maxPoints: 5, category: 'drinking' },
  { name: 'Beer Funnel', points: 2, category: 'drinking' },
  { name: 'Do 2 Shots in a Row', points: 2, category: 'drinking' },
  { name: 'Beer Bong', points: 2, category: 'drinking' },
  { name: 'Ching Chong Chug', points: 1, category: 'drinking' },
  { name: 'Ice Bath', points: 2, category: 'physical' },
  { name: 'Jump in the River', points: 2, category: 'physical' },
  { name: '100 Pushups in 30 Minutes', points: 2, category: 'physical' },
  { name: '100 Pullups', points: 3, category: 'physical' },
  { name: 'Catch a Fish', points: 2, category: 'physical' },
  { name: 'Water Boy', points: 2, category: 'service' },
  { name: 'Cook Something of Quality', points: 2, category: 'service' },
  { name: 'Meal Cleanup', points: 2, category: 'service' },
  { name: 'Wear Handcuffs for 30 Minutes', points: 2, category: 'challenge' },
  { name: 'Eat a (Really Hot) Pepper', points: 2, category: 'challenge' },
  { name: 'Paper Airplane Throw > 40 ft', points: 2, category: 'challenge' },
  { name: 'Make Indoor Bball Shot from 30 ft', points: 2, category: 'challenge' },
  { name: 'Throwing Axe Bullseye', points: 3, category: 'challenge' },
  { name: 'Hula Hoop for 10 Seconds', points: 1, category: 'challenge' },
  { name: 'Hot Ones Challenge: Try All 10', points: 3, category: 'challenge' },
  { name: 'Karaoke', points: 1, category: 'challenge' },
  { name: 'Paintball Duel', points: 2, category: 'challenge' },
  { name: 'Beer Pong Tournament', points: { min: 1, max: 6 }, category: 'game' },
  { name: 'Pool Tournament', points: { min: 1, max: 6 }, category: 'game' },
  { name: 'Shuffleboard Tournament', points: { min: 1, max: 6 }, category: 'game' },
  { name: 'Win a Board Game', points: 2, category: 'game' },
  { name: 'Win a Game of Chess', points: 2, category: 'game' },
  { name: 'Win a Game of Stump', points: 2, category: 'game' },
  { name: 'Win a Game of CanJam', points: 2, category: 'game' },
  { name: 'Win Mario Kart Game', points: 2, category: 'game' },
  { name: 'Coin Race', points: 1, category: 'game' },
  { name: 'Buffalo Someone Else', points: 1, maxPoints: 2, category: 'social' },
  { name: 'LIFE Someone Else', points: 1, category: 'social' },
  { name: 'Call Someone on a Banned Word', points: 1, maxPoints: 3, category: 'social' },
  { name: 'Bleed (Involuntary)', points: 3, category: 'wildcard' },
  { name: 'Throw Up', points: 1, category: 'wildcard' },
  { name: 'Go to Sleep Before 10pm', points: 2, category: 'challenge' },
  { name: 'Win Rock Paper Scissors Best of 5', points: 1, category: 'game' },
  { name: 'Give a Toast at Dinner', points: 1, category: 'social' },
  { name: 'First One Up Makes Coffee', points: 2, category: 'service' },
];

export const STARTER_RULES = [
  { heading: 'BUFFALO', text: 'If someone is drinking with their right hand, call Buffalo and they have to chug it.' },
  { heading: 'WATER BOY', text: 'Go around offering water to every person to ensure they are hydrated.' },
  { heading: 'COIN RACE', text: 'Spin a coin on a table, then start chugging. Finish before the coin falls to win.' },
  { heading: 'ICE BATH', text: 'Sit in the ice bath for one minute. Emerge with your entire body wet.' },
  { heading: 'CHING CHONG CHUG', text: 'There is a dedicated ping pong ball. The possessor tries to put it in someones cup; success means they chug and take the ball.' },
];

export const STARTER_FOOTNOTE = 'Speaking a banned word means you must finish your drink.';
```

(The last four activities are new fillers to clear 40 after dropping 'General Bonus'; keep them.)

Create `src/content/themes.ts`:

```ts
import type { BoardSpec } from '../models/boardSpec';

export type ThemeValues = BoardSpec['theme'];

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  theme: Partial<ThemeValues>;
}

/**
 * Starter presets mapped from the build-4 theme ideas onto the flat schema-v2
 * theme. Fonts/decorations from the old model don't map yet (Plan 4).
 */
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'steven',
    name: 'Classic Teal',
    description: 'The original hand-made look: teal masthead, blue grid, tinted scoring columns',
    theme: {
      titleColor: '#45C0C8',
      accentColor: '#3A6BC7',
      activityColor: '#3A6BC7',
      highlightColor: '#141414',
      rowTint: '#EAF1F8',
      pointsColTint: '#D8E9F5',
      maxPointsColTint: '#E8E8E8',
      cornerLabel: 'THE GAME',
      cornerSubLabel: 'ACTIVITIES',
      allCaps: true,
    },
  },
  {
    id: 'ink',
    name: 'Ink',
    description: 'Clean black-on-white, red highlights',
    theme: {},
  },
  {
    id: 'casino',
    name: 'Casino',
    description: 'High-roller gold and felt green',
    theme: {
      titleColor: '#B8860B',
      accentColor: '#0B6B3A',
      activityColor: '#1A1A1A',
      highlightColor: '#B22222',
      rowTint: '#F5EEDC',
      pointsColTint: '#EFE3C0',
      maxPointsColTint: '#E8E8E8',
      cornerLabel: 'THE GAME',
      cornerSubLabel: 'ACTIVITIES',
      allCaps: true,
    },
  },
  {
    id: 'outdoors',
    name: 'Outdoors',
    description: 'Forest green and timber',
    theme: {
      titleColor: '#2F5D3A',
      accentColor: '#7A4A21',
      activityColor: '#23402B',
      highlightColor: '#7A4A21',
      rowTint: '#EDF3EA',
      pointsColTint: '#DDE9D6',
      maxPointsColTint: '#EAE4DA',
      cornerLabel: 'THE GAME',
      cornerSubLabel: 'ACTIVITIES',
      allCaps: true,
    },
  },
];
```

- [ ] **Step 5: Run to verify it passes** (`npx vitest run tests/content/content.test.ts` — 5 tests)

- [ ] **Step 6: Full suite + commit**

```bash
npx vitest run && npx tsc --noEmit
git add -A && git commit -m "feat: starter content module from build-4 library"
```

---

### Task 2: Store, Draft→BoardSpec mapping, points parsing

**Files:**
- Create: `src/store/wizardStore.ts`, `src/store/toBoardSpec.ts`
- Test: `tests/store/toBoardSpec.test.ts`, `tests/store/wizardStore.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/store/toBoardSpec.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { toBoardSpec, parsePointsInput, defaultDraft } from '../../src/store/toBoardSpec';
import { pointsLabel } from '../../src/models/boardSpec';

describe('parsePointsInput', () => {
  it('parses integers, TBD, and ranges in both notations', () => {
    expect(parsePointsInput('3')).toBe(3);
    expect(parsePointsInput('-3')).toBe(-3);
    expect(parsePointsInput('tbd')).toBe('TBD');
    expect(parsePointsInput('TBD')).toBe('TBD');
    expect(parsePointsInput('1 to 6')).toEqual({ min: 1, max: 6 });
    expect(parsePointsInput('-5 - 5')).toEqual({ min: -5, max: 5 });
    expect(parsePointsInput('nonsense')).toBeNull();
    expect(parsePointsInput('6 to 1')).toBeNull();
  });

  it('round-trips through pointsLabel', () => {
    for (const s of ['3', 'TBD', '1 to 6']) {
      const v = parsePointsInput(s);
      expect(v).not.toBeNull();
      expect(parsePointsInput(pointsLabel(v!))).toEqual(v);
    }
  });
});

describe('toBoardSpec', () => {
  it('accepts a complete draft', () => {
    const r = toBoardSpec(defaultDraft());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.spec.players.length).toBeGreaterThanOrEqual(8);
  });

  it('reports friendly field errors, not raw zod unions', () => {
    const d = defaultDraft();
    d.players = ['OnlyOne'];
    const r = toBoardSpec(d);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.field === 'players' && /at least 8/i.test(e.message))).toBe(true);
  });

  it('flattens the points union error to a friendly message', () => {
    const d = defaultDraft();
    (d.activities[0] as { points: unknown }).points = 'garbage';
    const r = toBoardSpec(d);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const err = r.errors.find((e) => e.field.startsWith('activities.0'));
    expect(err?.message).toMatch(/whole number.*range.*TBD/i);
  });
});
```

Create `tests/store/wizardStore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useWizardStore } from '../../src/store/wizardStore';

describe('wizardStore', () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
  });

  it('starts with a renderable default draft and step 0', () => {
    const s = useWizardStore.getState();
    expect(s.step).toBe(0);
    expect(s.draft.players.length).toBeGreaterThanOrEqual(8);
    expect(s.draft.activities.length).toBeGreaterThanOrEqual(10);
  });

  it('patches the draft immutably', () => {
    const before = useWizardStore.getState().draft;
    useWizardStore.getState().patch({ honoree: 'Kyle' });
    const after = useWizardStore.getState().draft;
    expect(after.honoree).toBe('Kyle');
    expect(before).not.toBe(after);
  });

  it('persists via the storage key with a schema version', () => {
    expect(useWizardStore.persist.getOptions().name).toBe('bachelor-board-v2');
  });
});
```

- [ ] **Step 2: Run to verify both fail.**

- [ ] **Step 3: Implement**

Create `src/store/toBoardSpec.ts`:

```ts
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
```

Create `src/store/wizardStore.ts`:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultDraft, type Draft } from './toBoardSpec';

interface WizardState {
  draft: Draft;
  step: 0 | 1 | 2;
  patch: (p: Partial<Draft>) => void;
  setStep: (s: 0 | 1 | 2) => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      draft: defaultDraft(),
      step: 0,
      patch: (p) => set((s) => ({ draft: { ...s.draft, ...p } })),
      setStep: (step) => set({ step }),
      reset: () => set({ draft: defaultDraft(), step: 0 }),
    }),
    // Versioned key: build-4 saves used different keys and are deliberately ignored.
    { name: 'bachelor-board-v2' },
  ),
);
```

Note: zustand persist touches localStorage at import time — in the Node test environment provide the shim vitest needs. If `localStorage` is undefined in the store test, add at the top of that test file:

```ts
import { beforeAll } from 'vitest';
// zustand persist no-ops gracefully when storage getItem throws; a minimal shim keeps it quiet
beforeAll(() => {
  if (typeof globalThis.localStorage === 'undefined') {
    const mem = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
      clear: () => mem.clear(),
      key: (i: number) => [...mem.keys()][i] ?? null,
      get length() { return mem.size; },
    } as Storage;
  }
});
```

(Adapt minimally if zustand's persist API differs; the requirement is the versioned key name and working patch/reset.)

- [ ] **Step 4: Run to verify both pass, then the full suite + tsc.**

- [ ] **Step 5: Commit** — `feat: wizard store and draft validation with friendly errors`

---

### Task 3: Fonts bootstrap and the debounced board hook

**Files:**
- Create: `src/app/fonts.ts`, `src/app/useBoard.ts`
- Test: `tests/app/useBoard.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/app/useBoard.test.ts`:

```ts
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBoard } from '../../src/app/useBoard';
import { defaultDraft } from '../../src/store/toBoardSpec';
import { testMetrics } from '../helpers/loadFonts';

describe('useBoard', () => {
  it('produces svg + quality for the default draft (debounced)', async () => {
    const { result } = renderHook(() => useBoard(defaultDraft(), testMetrics(), 10));
    await waitFor(() => expect(result.current.status).toBe('ready'), { timeout: 5000 });
    if (result.current.status !== 'ready') return;
    expect(result.current.svg.startsWith('<svg ')).toBe(true);
    expect(['good', 'tight', 'poor']).toContain(result.current.quality.grade);
  });

  it('reports invalid drafts with field errors', async () => {
    const bad = defaultDraft();
    bad.players = [];
    const { result } = renderHook(() => useBoard(bad, testMetrics(), 10));
    await waitFor(() => expect(result.current.status).toBe('invalid'), { timeout: 5000 });
    if (result.current.status !== 'invalid') return;
    expect(result.current.errors.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to verify it fails.**

- [ ] **Step 3: Implement**

Create `src/app/useBoard.ts`:

```ts
import { useEffect, useState } from 'react';
import { buildBoard, renderSvg, type FontMetrics, type QualityReport } from '../engine';
import { toBoardSpec, type Draft, type FieldError } from '../store/toBoardSpec';

export type BoardState =
  | { status: 'loading' }
  | { status: 'invalid'; errors: FieldError[] }
  | { status: 'infeasible'; reason: string }
  | { status: 'ready'; svg: string; quality: QualityReport };

/**
 * Debounced draft -> rendered preview. The solver's worst case is ~205ms, so
 * the default 300ms debounce keeps typing responsive; tests pass a short one.
 */
export function useBoard(draft: Draft, metrics: FontMetrics | null, debounceMs = 300): BoardState {
  const [state, setState] = useState<BoardState>({ status: 'loading' });

  useEffect(() => {
    if (!metrics) return;
    const t = setTimeout(() => {
      const validated = toBoardSpec(draft);
      if (!validated.ok) {
        setState({ status: 'invalid', errors: validated.errors });
        return;
      }
      const built = buildBoard(validated.spec, metrics);
      if (!built.ok) {
        setState({ status: 'infeasible', reason: built.reason });
        return;
      }
      setState({ status: 'ready', svg: renderSvg(built.scene, metrics), quality: built.quality });
    }, debounceMs);
    return () => clearTimeout(t);
  }, [draft, metrics, debounceMs]);

  return state;
}
```

Create `src/app/fonts.ts`:

```ts
import { FontMetrics, type FontBuffers } from '../engine';
import archivoUrl from '../assets/fonts/ArchivoBlack-Regular.ttf?url';
import latoUrl from '../assets/fonts/Lato-Regular.ttf?url';
import latoBoldUrl from '../assets/fonts/Lato-Bold.ttf?url';

export interface AppFonts {
  metrics: FontMetrics;
  buffers: FontBuffers;
}

/**
 * Fetch the bundled TTFs once: register them as document fonts (families MUST
 * match svg.ts's FAMILY/WEIGHT maps exactly — 'Archivo Black' 400, 'Lato'
 * 400/700 — or the in-DOM preview silently falls back while textLength still
 * pins measured widths) and build the shared FontMetrics from the same bytes.
 */
export async function loadAppFonts(): Promise<AppFonts> {
  const [display, body, bodyBold] = await Promise.all(
    [archivoUrl, latoUrl, latoBoldUrl].map(async (u) => (await fetch(u)).arrayBuffer()),
  );
  const buffers: FontBuffers = { display: display!, body: body!, bodyBold: bodyBold! };
  const faces = [
    new FontFace('Archivo Black', buffers.display, { weight: '400' }),
    new FontFace('Lato', buffers.body, { weight: '400' }),
    new FontFace('Lato', buffers.bodyBold, { weight: '700' }),
  ];
  await Promise.all(faces.map((f) => f.load()));
  for (const f of faces) document.fonts.add(f);
  return { metrics: new FontMetrics(buffers), buffers };
}
```

Add the TTF asset type declaration if `?url` imports fail typecheck — extend `vite-env.d.ts` with `declare module '*.ttf?url' { const url: string; export default url; }`.

- [ ] **Step 4: Run the new test, full suite, tsc.**

- [ ] **Step 5: Commit** — `feat: font bootstrap and debounced board preview hook`

---

### Task 4: App shell and Preview

**Files:**
- Create: `src/app/App.tsx`, `src/app/Preview.tsx`
- Modify: `src/main.tsx`, `src/index.css` (create)
- Test: `tests/app/appSmoke.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/app/appSmoke.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from '../../src/app/App';
import { testMetrics } from '../helpers/loadFonts';
import { useWizardStore } from '../../src/store/wizardStore';

describe('App', () => {
  it('renders the wizard shell, preview svg, and quality badge', async () => {
    useWizardStore.getState().reset();
    render(<App metrics={testMetrics()} buffers={null} />);
    expect(screen.getByText(/Setup/)).toBeDefined();
    expect(screen.getByText(/Activities/)).toBeDefined();
    expect(screen.getByText(/Design/)).toBeDefined();
    await waitFor(() => expect(document.querySelector('.preview svg')).not.toBeNull(), { timeout: 5000 });
    await waitFor(() => expect(screen.getByTestId('quality-badge').textContent).toMatch(/good|tight|poor/i));
  });
});
```

- [ ] **Step 2: Run to verify it fails.**

- [ ] **Step 3: Implement**

Create `src/app/Preview.tsx`:

```tsx
import type { BoardState } from './useBoard';

const GRADE_COLORS: Record<string, string> = { good: '#27763d', tight: '#e67e22', poor: '#c0392b' };

export function Preview({ board }: { board: BoardState }) {
  return (
    <div className="preview-pane">
      {board.status === 'ready' && (
        <div className="quality" data-testid="quality-badge" style={{ background: GRADE_COLORS[board.quality.grade] }}>
          {board.quality.grade.toUpperCase()} · {board.quality.bodyPt}pt
          <div className="advice">{board.quality.advice.join(' ')}</div>
        </div>
      )}
      {board.status === 'invalid' && (
        <div className="problems" data-testid="quality-badge">
          {board.errors.map((e) => (
            <div key={e.field}>{e.message}</div>
          ))}
        </div>
      )}
      {board.status === 'infeasible' && (
        <div className="problems" data-testid="quality-badge">{board.reason}</div>
      )}
      {board.status === 'ready' ? (
        // The engine SVG is self-generated markup (user text XML-escaped by renderSvg).
        <div className="preview" dangerouslySetInnerHTML={{ __html: board.svg }} />
      ) : (
        <div className="preview preview-empty">{board.status === 'loading' ? 'Rendering…' : 'Fix the items above to see the preview.'}</div>
      )}
    </div>
  );
}
```

Create `src/app/App.tsx`:

```tsx
import { useWizardStore } from '../store/wizardStore';
import { useBoard } from './useBoard';
import { Preview } from './Preview';
import { SetupStep } from './steps/SetupStep';
import { ActivitiesStep } from './steps/ActivitiesStep';
import { DesignStep } from './steps/DesignStep';
import type { FontMetrics, FontBuffers } from '../engine';

const STEPS = ['Setup', 'Activities', 'Design'] as const;

export function App({ metrics, buffers }: { metrics: FontMetrics; buffers: FontBuffers | null }) {
  const { draft, step, setStep } = useWizardStore();
  const board = useBoard(draft, metrics);

  return (
    <div className="shell">
      <header>
        <h1>Game Board Poster Builder</h1>
        <nav>
          {STEPS.map((label, i) => (
            <button key={label} className={step === i ? 'tab active' : 'tab'} onClick={() => setStep(i as 0 | 1 | 2)}>
              {i + 1}. {label}
            </button>
          ))}
        </nav>
      </header>
      <main>
        <section className="panel">
          {step === 0 && <SetupStep />}
          {step === 1 && <ActivitiesStep />}
          {step === 2 && <DesignStep board={board} metrics={metrics} buffers={buffers} />}
        </section>
        <Preview board={board} />
      </main>
    </div>
  );
}
```

Update `src/main.tsx`:

```tsx
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { loadAppFonts } from './app/fonts';
import './index.css';

const root = createRoot(document.getElementById('root')!);
root.render(<div className="boot">Loading fonts…</div>);

loadAppFonts()
  .then(({ metrics, buffers }) => root.render(<App metrics={metrics} buffers={buffers} />))
  .catch((err) => root.render(<div className="boot">Failed to load fonts: {String(err)}</div>));
```

Create `src/index.css` — minimal, readable layout (temporary until DesignStep exists in Task 6, SetupStep/ActivitiesStep in Task 5; for THIS task create placeholder step components so App compiles):

```css
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Lato', system-ui, sans-serif; color: #1a1a1a; background: #f4f6f8; }
.shell { min-height: 100vh; display: flex; flex-direction: column; }
header { padding: 12px 20px; background: #141414; color: #fff; display: flex; align-items: center; gap: 24px; }
header h1 { font-size: 18px; margin: 0; }
nav { display: flex; gap: 8px; }
.tab { background: transparent; color: #bbb; border: 1px solid #444; padding: 6px 14px; border-radius: 6px; cursor: pointer; }
.tab.active { background: #fff; color: #141414; }
main { flex: 1; display: grid; grid-template-columns: minmax(360px, 480px) 1fr; gap: 16px; padding: 16px; }
.panel { background: #fff; border-radius: 10px; padding: 16px; overflow-y: auto; max-height: calc(100vh - 90px); }
.preview-pane { display: flex; flex-direction: column; gap: 8px; max-height: calc(100vh - 90px); }
.preview { background: #fff; border-radius: 10px; padding: 12px; overflow: auto; flex: 1; }
.preview svg { width: 100%; height: auto; display: block; box-shadow: 0 2px 12px rgba(0,0,0,0.15); }
.preview-empty { display: flex; align-items: center; justify-content: center; color: #888; }
.quality { color: #fff; padding: 8px 12px; border-radius: 8px; font-weight: 700; }
.quality .advice { font-weight: 400; font-size: 13px; }
.problems { background: #fdecea; color: #c0392b; padding: 8px 12px; border-radius: 8px; }
.field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.field label { font-size: 13px; font-weight: 700; }
.field input, .field textarea, .field select { padding: 8px; border: 1px solid #ccc; border-radius: 6px; font: inherit; }
.row { display: flex; gap: 8px; align-items: center; }
.chip { border: 1px solid #ccc; border-radius: 999px; padding: 2px 10px; font-size: 12px; background: #fafafa; cursor: pointer; }
.chip.on { background: #14532d; color: #fff; border-color: #14532d; }
button.primary { background: #14532d; color: #fff; border: 0; padding: 10px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; }
button.ghost { background: #fff; border: 1px solid #ccc; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
table.activities { width: 100%; border-collapse: collapse; font-size: 13px; }
table.activities td, table.activities th { border-bottom: 1px solid #eee; padding: 6px 4px; text-align: left; }
```

For Task 4, create placeholder `src/app/steps/SetupStep.tsx`, `ActivitiesStep.tsx`, `DesignStep.tsx` that render `<div>Coming in Task 5/6</div>` (DesignStep accepts and ignores its props, typed correctly) so the shell compiles and the smoke test passes. Tasks 5-6 replace them.

- [ ] **Step 4: Run the smoke test, full suite, tsc, AND `npm run build`. Also `npm run dev` briefly (backgrounded with timeout) to confirm the page serves without console errors — report.**

- [ ] **Step 5: Commit** — `feat: app shell with live measured preview and quality badge`

---

### Task 5: Setup and Activities steps

**Files:**
- Replace: `src/app/steps/SetupStep.tsx`, `src/app/steps/ActivitiesStep.tsx`
- Test: `tests/app/steps.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/app/steps.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetupStep } from '../../src/app/steps/SetupStep';
import { ActivitiesStep } from '../../src/app/steps/ActivitiesStep';
import { useWizardStore } from '../../src/store/wizardStore';

beforeEach(() => useWizardStore.getState().reset());

describe('SetupStep', () => {
  it('edits event fields and roster', async () => {
    render(<SetupStep />);
    const honoree = screen.getByLabelText(/honoree/i);
    await userEvent.clear(honoree);
    await userEvent.type(honoree, 'Kyle');
    expect(useWizardStore.getState().draft.honoree).toBe('Kyle');

    await userEvent.type(screen.getByPlaceholderText(/add player/i), 'Newguy{enter}');
    expect(useWizardStore.getState().draft.players).toContain('Newguy');
  });

  it('changes poster size', async () => {
    render(<SetupStep />);
    await userEvent.selectOptions(screen.getByLabelText(/poster size/i), '36x48');
    expect(useWizardStore.getState().draft.posterSize).toBe('36x48');
  });
});

describe('ActivitiesStep', () => {
  it('adds from the library and edits points', async () => {
    const store = useWizardStore.getState();
    store.patch({ activities: store.draft.activities.slice(0, 6) });
    render(<ActivitiesStep />);
    const before = useWizardStore.getState().draft.activities.length;
    const addButtons = screen.getAllByRole('button', { name: /^add .+/i }); // library buttons are aria-labeled "Add <name>"
    await userEvent.click(addButtons[0]!);
    expect(useWizardStore.getState().draft.activities.length).toBe(before + 1);
  });

  it('toggles write-in rows and honoree bonus', async () => {
    render(<ActivitiesStep />);
    await userEvent.click(screen.getByLabelText(/honoree bonus row/i));
    expect(useWizardStore.getState().draft.honoreeBonusRow).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails.**

- [ ] **Step 3: Implement**

`src/app/steps/SetupStep.tsx`:

```tsx
import { useState } from 'react';
import { useWizardStore } from '../../store/wizardStore';
import { POSTER_SIZES, type PosterSizeId } from '../../engine';

export function SetupStep() {
  const { draft, patch } = useWizardStore();
  const [newPlayer, setNewPlayer] = useState('');

  const addPlayer = () => {
    const name = newPlayer.trim();
    if (!name || draft.players.length >= 35) return;
    patch({ players: [...draft.players, name] });
    setNewPlayer('');
  };

  return (
    <div>
      <h2>Event</h2>
      <div className="field">
        <label htmlFor="title">Title line</label>
        <input id="title" value={draft.title} onChange={(e) => patch({ title: e.target.value })} maxLength={60} />
      </div>
      <div className="field">
        <label htmlFor="honoree">Honoree</label>
        <input id="honoree" value={draft.honoree} onChange={(e) => patch({ honoree: e.target.value })} maxLength={30} />
      </div>
      <div className="field">
        <label htmlFor="subtitle">Subtitle / date line (optional)</label>
        <input id="subtitle" value={draft.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} maxLength={80} />
      </div>
      <div className="field">
        <label htmlFor="size">Poster size</label>
        <select id="size" value={draft.posterSize} onChange={(e) => patch({ posterSize: e.target.value as PosterSizeId })}>
          {Object.keys(POSTER_SIZES).map((s) => (
            <option key={s} value={s}>{s.replace('x', '" x ')}"</option>
          ))}
        </select>
      </div>

      <h2>Players ({draft.players.length}/35)</h2>
      <ul className="roster">
        {draft.players.map((p, i) => (
          <li key={`${p}-${i}`} className="row">
            <input
              value={p}
              maxLength={24}
              onChange={(e) => patch({ players: draft.players.map((x, j) => (j === i ? e.target.value : x)) })}
            />
            <button className="ghost" aria-label={`Remove ${p}`} onClick={() => patch({ players: draft.players.filter((_, j) => j !== i) })}>×</button>
          </li>
        ))}
      </ul>
      <div className="row">
        <input
          placeholder="Add player…"
          value={newPlayer}
          maxLength={24}
          onChange={(e) => setNewPlayer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
        />
        <button className="ghost" onClick={addPlayer}>Add</button>
      </div>
    </div>
  );
}
```

`src/app/steps/ActivitiesStep.tsx`:

```tsx
import { useState } from 'react';
import { useWizardStore } from '../../store/wizardStore';
import { ACTIVITY_LIBRARY, ACTIVITY_CATEGORIES, type ActivityCategory } from '../../content/activities';
import { pointsLabel } from '../../models/boardSpec';
import { parsePointsInput } from '../../store/toBoardSpec';

export function ActivitiesStep() {
  const { draft, patch } = useWizardStore();
  const [category, setCategory] = useState<ActivityCategory | 'all'>('all');

  const inBoard = new Set(draft.activities.map((a) => a.name));
  const library = ACTIVITY_LIBRARY.filter((a) => (category === 'all' || a.category === category) && !inBoard.has(a.name));

  const setActivity = (i: number, p: Partial<Draft['activities'][number]>) =>
    patch({ activities: draft.activities.map((a, j) => (j === i ? { ...a, ...p } : a)) });

  return (
    <div>
      <h2>On the board ({draft.activities.length}/80)</h2>
      <table className="activities">
        <thead>
          <tr><th>Activity</th><th>Points</th><th>Max</th><th>Bonus</th><th /></tr>
        </thead>
        <tbody>
          {draft.activities.map((a, i) => (
            <tr key={`${a.name}-${i}`}>
              <td><input value={a.name} maxLength={90} onChange={(e) => setActivity(i, { name: e.target.value })} /></td>
              <td>
                <input
                  className="points"
                  defaultValue={pointsLabel(a.points)}
                  onBlur={(e) => {
                    const v = parsePointsInput(e.target.value);
                    if (v !== null) setActivity(i, { points: v });
                    else e.target.value = pointsLabel(a.points);
                  }}
                  title='A number, a range like "1 to 6", or TBD'
                />
              </td>
              <td>
                <input
                  className="points"
                  value={a.maxPoints ?? ''}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setActivity(i, { maxPoints: e.target.value === '' || !Number.isInteger(n) || n < 1 ? undefined : Math.min(n, 99) });
                  }}
                  placeholder="—"
                  title="Cumulative cap for repeatable activities; blank = once only"
                />
              </td>
              <td>
                <input type="checkbox" checked={a.bonus} aria-label={`Bonus: ${a.name}`} onChange={(e) => setActivity(i, { bonus: e.target.checked })} />
              </td>
              <td>
                <button className="ghost" aria-label={`Remove ${a.name}`} onClick={() => patch({ activities: draft.activities.filter((_, j) => j !== i) })}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        className="ghost"
        onClick={() => patch({ activities: [...draft.activities, { name: 'New activity', points: 1, bonus: false }] })}
      >
        + Custom activity
      </button>

      <h2>Options</h2>
      <div className="field row">
        <label htmlFor="writeins">Blank write-in rows</label>
        <input
          id="writeins"
          type="number"
          min={0}
          max={5}
          value={draft.writeInRows}
          onChange={(e) => patch({ writeInRows: Math.max(0, Math.min(5, Number(e.target.value) || 0)) })}
        />
      </div>
      <div className="field row">
        <input
          id="honoreeBonus"
          type="checkbox"
          checked={draft.honoreeBonusRow}
          onChange={(e) => patch({ honoreeBonusRow: e.target.checked })}
        />
        <label htmlFor="honoreeBonus">Honoree bonus row (−5 to 5, granted by the honoree)</label>
      </div>

      <h2>Library</h2>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        {(['all', ...ACTIVITY_CATEGORIES] as const).map((c) => (
          <button key={c} className={category === c ? 'chip on' : 'chip'} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>
      <table className="activities">
        <tbody>
          {library.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{pointsLabel(a.points)}{a.maxPoints ? ` (max ${a.maxPoints})` : ''}</td>
              <td>
                <button
                  className="ghost"
                  aria-label={`Add ${a.name}`}
                  disabled={draft.activities.length >= 80}
                  onClick={() => patch({ activities: [...draft.activities, { name: a.name, points: a.points, ...(a.maxPoints !== undefined ? { maxPoints: a.maxPoints } : {}), bonus: false }] })}
                >
                  Add
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

Import `type { Draft }` from the store module where referenced. Fix any small type frictions minimally and report them.

- [ ] **Step 4: Run tests (new file + full suite), tsc, build.**

- [ ] **Step 5: Commit** — `feat: setup and activities wizard steps`

---

### Task 6: Design step, export, and the Safari probe

**Files:**
- Replace: `src/app/steps/DesignStep.tsx`
- Create: `src/app/export.ts`
- Modify: `src/engine/render/png.ts` (probe)
- Test: `tests/app/export.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/app/export.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { exportFilename } from '../../src/app/export';

describe('exportFilename', () => {
  it('builds sane filenames from the honoree and size', () => {
    expect(exportFilename('Steven Victor Watts', '24x36', 'pdf', 300)).toBe('Steven-Victor-Watts-24x36.pdf');
    expect(exportFilename('Kyle', '48x72', 'png', 227)).toBe('Kyle-48x72-227dpi.png');
  });

  it('strips filesystem-hostile characters', () => {
    expect(exportFilename('A/B\\C:D', '18x24', 'pdf', 300)).toBe('A-B-C-D-18x24.pdf');
  });
});
```

- [ ] **Step 2: Run to verify it fails.**

- [ ] **Step 3: Implement**

Add the Safari probe to `rasterizePng` in `src/engine/render/png.ts` — after `ctx.drawImage(...)`, before `toBlob`:

```ts
    // Safari exceeds-canvas-limit failures are SILENT (blank canvas, no throw).
    // Probe a small central region: an all-transparent readback on a poster
    // that always paints a white background means the canvas was invalidated.
    const probe = ctx.getImageData(Math.floor(plan.widthPx / 2), Math.floor(plan.heightPx / 2), 4, 4).data;
    if (!probe.some((channel) => channel !== 0)) {
      throw new Error('PNG rasterization failed: the canvas exceeded this browser\'s size limits. Try a smaller poster size, or use the PDF export (unlimited).');
    }
```

Create `src/app/export.ts`:

```ts
import { saveAs } from 'file-saver';
import { renderPdf, renderSvg, planPngScale, rasterizePng, type FontMetrics, type FontBuffers, type Scene } from '../engine';

export function exportFilename(honoree: string, size: string, ext: 'pdf' | 'png', dpi: number): string {
  const safe = honoree.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  return ext === 'pdf' ? `${safe}-${size}.pdf` : `${safe}-${size}-${dpi}dpi.png`;
}

export async function exportPdf(scene: Scene, m: FontMetrics, buffers: FontBuffers, honoree: string, size: string): Promise<void> {
  const bytes = await renderPdf(scene, m, buffers);
  saveAs(new Blob([bytes as BlobPart], { type: 'application/pdf' }), exportFilename(honoree, size, 'pdf', 300));
}

/** Returns the effective DPI so the UI can tell the user when it was reduced. */
export async function exportPng(scene: Scene, m: FontMetrics, buffers: FontBuffers, honoree: string, size: string): Promise<number> {
  const plan = planPngScale(scene.widthIn, scene.heightIn, 300);
  const svg = renderSvg(scene, m, { embedFonts: buffers });
  const blob = await rasterizePng(svg, plan);
  saveAs(blob, exportFilename(honoree, size, 'png', plan.dpi));
  return plan.dpi;
}
```

Replace `src/app/steps/DesignStep.tsx`:

```tsx
import { useState } from 'react';
import { useWizardStore } from '../../store/wizardStore';
import { THEME_PRESETS } from '../../content/themes';
import { toBoardSpec } from '../../store/toBoardSpec';
import { buildBoard, planPngScale, type FontMetrics, type FontBuffers } from '../../engine';
import { exportPdf, exportPng } from '../export';
import type { BoardState } from '../useBoard';

const HEX = /^#[0-9a-fA-F]{6}$/;

const COLOR_FIELDS: Array<{ key: 'titleColor' | 'accentColor' | 'activityColor' | 'highlightColor' | 'rowTint' | 'pointsColTint' | 'maxPointsColTint'; label: string }> = [
  { key: 'titleColor', label: 'Title' },
  { key: 'accentColor', label: 'Accents' },
  { key: 'activityColor', label: 'Activities' },
  { key: 'highlightColor', label: 'Highlights' },
  { key: 'rowTint', label: 'Row tint' },
  { key: 'pointsColTint', label: 'Points column tint' },
  { key: 'maxPointsColTint', label: 'Max points column tint' },
];

export function DesignStep({ board, metrics, buffers }: { board: BoardState; metrics: FontMetrics; buffers: FontBuffers | null }) {
  const { draft, patch } = useWizardStore();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const setTheme = (p: Partial<typeof draft.theme>) => patch({ theme: { ...draft.theme, ...p } });

  const doExport = async (kind: 'pdf' | 'png') => {
    if (!buffers) return;
    const validated = toBoardSpec(draft);
    if (!validated.ok) return;
    const built = buildBoard(validated.spec, metrics);
    if (!built.ok) return;
    setBusy(kind);
    setNote('');
    try {
      if (kind === 'pdf') {
        await exportPdf(built.scene, metrics, buffers, draft.honoree, draft.posterSize);
      } else {
        const dpi = await exportPng(built.scene, metrics, buffers, draft.honoree, draft.posterSize);
        if (dpi < 300) setNote(`PNG exported at ${dpi} DPI (browser canvas limit for this size). The PDF export is full quality at any size.`);
      }
    } catch (err) {
      setNote(String(err instanceof Error ? err.message : err));
    } finally {
      setBusy(null);
    }
  };

  const pngPlan = planPngScale(...(draft.posterSize.split('x').map(Number) as [number, number]), 300);

  return (
    <div>
      <h2>Theme</h2>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        {THEME_PRESETS.map((p) => (
          <button key={p.id} className="chip" title={p.description} onClick={() => setTheme(p.theme)}>{p.name}</button>
        ))}
      </div>
      {COLOR_FIELDS.map(({ key, label }) => (
        <div className="field row" key={key}>
          <label htmlFor={`c-${key}`}>{label}</label>
          <input
            id={`c-${key}`}
            type="color"
            value={HEX.test(draft.theme[key] ?? '') ? (draft.theme[key] as string) : '#141414'}
            onChange={(e) => setTheme({ [key]: e.target.value })}
          />
          <button className="ghost" onClick={() => setTheme({ [key]: '' })} title="Clear (tints only)">clear</button>
        </div>
      ))}
      <div className="field row">
        <input id="allcaps" type="checkbox" checked={draft.theme.allCaps ?? false} onChange={(e) => setTheme({ allCaps: e.target.checked })} />
        <label htmlFor="allcaps">ALL-CAPS activity names</label>
      </div>
      <div className="field">
        <label htmlFor="cornerLabel">Corner label</label>
        <input id="cornerLabel" value={draft.theme.cornerLabel ?? ''} maxLength={20} onChange={(e) => setTheme({ cornerLabel: e.target.value })} />
      </div>

      <h2>Corner boxes</h2>
      {draft.cornerBoxes.map((label, i) => (
        <div className="row" key={i}>
          <input value={label} maxLength={30} onChange={(e) => patch({ cornerBoxes: draft.cornerBoxes.map((x, j) => (j === i ? e.target.value : x)) })} />
          <button className="ghost" onClick={() => patch({ cornerBoxes: draft.cornerBoxes.filter((_, j) => j !== i) })}>×</button>
        </div>
      ))}
      {draft.cornerBoxes.length < 3 && (
        <button className="ghost" onClick={() => patch({ cornerBoxes: [...draft.cornerBoxes, 'NEW BOX'] })}>+ Corner box</button>
      )}

      <h2>Rules</h2>
      {draft.rules.map((r, i) => (
        <div className="field" key={i}>
          <div className="row">
            <input
              placeholder="HEADING (optional)"
              value={r.heading ?? ''}
              maxLength={40}
              onChange={(e) => patch({ rules: draft.rules.map((x, j) => (j === i ? { ...x, heading: e.target.value || undefined } : x)) })}
            />
            <button className="ghost" onClick={() => patch({ rules: draft.rules.filter((_, j) => j !== i) })}>×</button>
          </div>
          <textarea
            value={r.text}
            maxLength={300}
            onChange={(e) => patch({ rules: draft.rules.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })}
          />
        </div>
      ))}
      {draft.rules.length < 12 && (
        <button className="ghost" onClick={() => patch({ rules: [...draft.rules, { text: 'New rule' }] })}>+ Rule</button>
      )}
      <div className="field">
        <label htmlFor="footnote">Footnote (optional)</label>
        <input id="footnote" value={draft.footnote} maxLength={200} onChange={(e) => patch({ footnote: e.target.value })} />
      </div>

      <h2>Export</h2>
      <div className="row">
        <button className="primary" disabled={board.status !== 'ready' || busy !== null || !buffers} onClick={() => doExport('pdf')}>
          {busy === 'pdf' ? 'Rendering…' : 'Download PDF (print quality)'}
        </button>
        <button className="primary" disabled={board.status !== 'ready' || busy !== null || !buffers} onClick={() => doExport('png')}>
          {busy === 'png' ? 'Rendering…' : `Download PNG (${pngPlan.dpi} DPI)`}
        </button>
      </div>
      {note && <div className="problems">{note}</div>}
    </div>
  );
}
```

- [ ] **Step 4: Run tests (new + full suite), tsc, build. Also update `tests/app/appSmoke.test.tsx` if the DesignStep prop change breaks it (it shouldn't — App already passes the props).**

- [ ] **Step 5: Commit** — `feat: design step with theme presets, structured rules, and export`

---

### Task 7: Final verification and manual QA handoff

**Files:**
- Create: `docs/QA-checklist.md`

- [ ] **Step 1: Full verification**

```bash
npx vitest run
npx tsc --noEmit
npm run build
```

All green. Report exact counts.

- [ ] **Step 2: Write the QA checklist for the human**

Create `docs/QA-checklist.md` — a dev-server walkthrough: `npm run dev`, then: fonts load without console errors; preview matches typing within ~a second; each Setup/Activities/Design control round-trips into the preview; quality badge changes when overloading a small poster; infeasible message on 18x24 + 35 players; theme presets restyle instantly; PDF downloads and opens; PNG downloads at the shown DPI; reload restores state (localStorage); reset works. Note the known limitations (Safari PNG may error with guidance to use PDF; preview fonts require first load to complete).

- [ ] **Step 3: Commit** — `docs: manual QA checklist for the wizard`

The controller performs visual QA via the dev server and the user walks the checklist before merge.

---

## Done criteria for Plan 3

- Suite green (~150 tests expected), build clean.
- `npm run dev` serves a working wizard: live preview, quality feedback, all schema-v2 features editable, PDF/PNG export with honest DPI reporting and the Safari probe.
- Draft persists in localStorage under a versioned key.
- Starter content available in-app: 44-activity library with categories, 5 starter rules + footnote, 4 theme presets including the Steven look.
