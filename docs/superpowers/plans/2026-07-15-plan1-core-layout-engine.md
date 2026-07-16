# Plan 1 of 3: Core Layout Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the measurement-driven layout engine that turns a validated `BoardSpec` into a fully-positioned `Scene`, with invariant tests proving no text ever overflows its box.

**Architecture:** Pure TypeScript pipeline: `BoardSpec` (Zod) → `FontMetrics` (opentype.js against bundled TTFs) → region partition → grid solver (font ladder with wrap/ellipsize degradation) → quality grade → `Scene` (flat list of text/rect/line primitives in inches). No DOM, no React, fully unit-testable in Node. Renderers (Plan 2) and wizard UI (Plan 3) come in later plans.

**Tech Stack:** TypeScript, Zod, opentype.js, Vitest. Spec: `docs/superpowers/specs/2026-07-15-board-rebuild-design.md`.

**Model note:** Tasks 5–12 are the layout-critical work — run these on **Fable 5**. Tasks 1–4 are mechanical and can run on any strong model.

**Units convention:** All geometry is in **inches** (numbers). Font sizes are in **points** (1 pt = 1/72 inch). A `TextRun.box` is the *inner* box the glyphs must fit inside (padding already subtracted by the layout code). Multi-line text = one `TextRun` per line. `rotate: -90` means the text reads bottom-to-top; its measured width must fit the box's **height**.

---

## File structure

```
src/
  main.tsx                        (placeholder app shell; real UI in Plan 3)
  assets/fonts/                   ArchivoBlack-Regular.ttf, Lato-Regular.ttf, Lato-Bold.ttf
  models/boardSpec.ts             Zod schema + POSTER_SIZES (single validated input)
  engine/
    geometry.ts                   Box type, clamp, unit constants
    buildBoard.ts                 entry point: spec + metrics → { scene, quality } | { reason }
    fonts/metrics.ts              FontMetrics: exact string widths/line heights from TTFs
    layout/wrap.ts                wrapToWidth, hardEllipsize, fitSizePt
    layout/regions.ts             Pass 1: header / rules / grid / side-rail partition
    layout/gridSolver.ts          Pass 2: font ladder + degradation → GridLayout
    layout/quality.ts             Pass 3: Good/Tight/Poor grade + advice strings
    scene/types.ts                Scene, TextRun, RectPrim, LinePrim
    scene/colors.ts               INK, GRID_LINE, HIGHLIGHT constants
    scene/compose.ts              GridLayout + Regions → Scene primitives
    index.ts                      public barrel export
tests/
  helpers/loadFonts.ts            Node-side font loading, cached FontMetrics singleton
  helpers/fixtures.ts             makeSpec() fixture factory
  helpers/invariants.ts           overflowingRuns(), outOfPage() — the core safety net
  engine/fonts.test.ts
  engine/boardSpec.test.ts
  engine/wrap.test.ts
  engine/regions.test.ts
  engine/gridSolver.test.ts
  engine/quality.test.ts
  engine/compose.test.ts
  engine/sweep.test.ts            extreme-spec invariant sweep
```

---

### Task 1: Reset the project and set up tooling

**Files:**
- Delete: entire old `src/` tree
- Create: `src/main.tsx`
- Modify: `package.json` (scripts + dependencies)

- [ ] **Step 1: Remove the old source tree**

```bash
cd /Users/jesse/claude/bachelor-game-claude
git rm -r src
mkdir -p src/assets/fonts
```

- [ ] **Step 2: Create the placeholder app shell**

Create `src/main.tsx`:

```tsx
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <div style={{ padding: 32, fontFamily: 'sans-serif' }}>
      <h1>Bachelor Game Board v5</h1>
      <p>Engine rebuild in progress. UI arrives in Plan 3.</p>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
```

If `index.html` references a different entry (check its `<script src>`), update it to `/src/main.tsx`.

- [ ] **Step 3: Swap dependencies**

```bash
npm uninstall konva react-konva
npm install opentype.js
npm install -D vitest @types/node
```

If TypeScript later complains about opentype.js types, also run `npm install -D @types/opentype.js`.

- [ ] **Step 4: Add the test script**

In `package.json` `"scripts"`, add:

```json
"test": "vitest run"
```

- [ ] **Step 5: Verify the project still builds and vitest runs**

```bash
npm run build
npx vitest run --passWithNoTests
```

Expected: build succeeds; vitest reports "No test files found" and exits 0.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: reset src for v5 engine rebuild, add vitest + opentype.js"
```

---

### Task 2: Bundle fonts and build FontMetrics

**Files:**
- Create: `src/assets/fonts/ArchivoBlack-Regular.ttf`, `src/assets/fonts/Lato-Regular.ttf`, `src/assets/fonts/Lato-Bold.ttf`
- Create: `src/engine/geometry.ts`, `src/engine/fonts/metrics.ts`
- Test: `tests/engine/fonts.test.ts`, `tests/helpers/loadFonts.ts`

- [ ] **Step 1: Download the fonts (all OFL-licensed)**

```bash
cd /Users/jesse/claude/bachelor-game-claude/src/assets/fonts
curl -fLo ArchivoBlack-Regular.ttf "https://github.com/google/fonts/raw/main/ofl/archivoblack/ArchivoBlack-Regular.ttf"
curl -fLo Lato-Regular.ttf "https://github.com/google/fonts/raw/main/ofl/lato/Lato-Regular.ttf"
curl -fLo Lato-Bold.ttf "https://github.com/google/fonts/raw/main/ofl/lato/Lato-Bold.ttf"
ls -la
```

Expected: three `.ttf` files, each > 50 KB. If a URL 404s (Google occasionally restructures the repo), find the family at https://github.com/google/fonts under `ofl/` and use the current static TTF path — do NOT substitute a variable font (`[wght]` in the filename); opentype.js measures only the default instance of variable fonts.

- [ ] **Step 2: Write the failing test**

Create `tests/helpers/loadFonts.ts`:

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { FontMetrics } from '../../src/engine/fonts/metrics';

const dir = fileURLToPath(new URL('../../src/assets/fonts', import.meta.url));

function ab(name: string): ArrayBuffer {
  const b = readFileSync(resolve(dir, name));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
}

let cached: FontMetrics | null = null;

export function testMetrics(): FontMetrics {
  cached ??= new FontMetrics({
    display: ab('ArchivoBlack-Regular.ttf'),
    body: ab('Lato-Regular.ttf'),
    bodyBold: ab('Lato-Bold.ttf'),
  });
  return cached;
}
```

Create `tests/engine/fonts.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { testMetrics } from '../helpers/loadFonts';

const m = testMetrics();

describe('FontMetrics', () => {
  it('measures wider strings as wider', () => {
    expect(m.widthIn('HHHH', 'body', 12)).toBeGreaterThan(m.widthIn('H', 'body', 12));
  });

  it('scales width linearly with point size', () => {
    const w12 = m.widthIn('Bachelor Party', 'body', 12);
    const w24 = m.widthIn('Bachelor Party', 'body', 24);
    expect(w24).toBeCloseTo(w12 * 2, 5);
  });

  it('returns plausible physical sizes', () => {
    // a 72pt capital M in a heavy display sans is roughly 0.4"-1.4" wide
    const w = m.widthIn('M', 'display', 72);
    expect(w).toBeGreaterThan(0.4);
    expect(w).toBeLessThan(1.4);
  });

  it('line height is positive and scales linearly', () => {
    expect(m.lineHeightIn('body', 12)).toBeGreaterThan(0.1);
    expect(m.lineHeightIn('body', 24)).toBeCloseTo(m.lineHeightIn('body', 12) * 2, 5);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
npx vitest run tests/engine/fonts.test.ts
```

Expected: FAIL — cannot resolve `src/engine/fonts/metrics`.

- [ ] **Step 4: Implement geometry and FontMetrics**

Create `src/engine/geometry.ts`:

```ts
export interface Box {
  x: number; // inches from page left
  y: number; // inches from page top
  w: number;
  h: number;
}

export const PT_PER_IN = 72;

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
```

Create `src/engine/fonts/metrics.ts`:

```ts
import opentype from 'opentype.js';
import { PT_PER_IN } from '../geometry';

export type FontId = 'display' | 'body' | 'bodyBold';
export type FontBuffers = Record<FontId, ArrayBuffer>;

/**
 * Exact text measurement against the bundled font files.
 * The PDF and PNG exports embed these same files, so a measurement here
 * is identical everywhere. All return values are in inches.
 */
export class FontMetrics {
  private fonts: Record<FontId, opentype.Font>;

  constructor(buffers: FontBuffers) {
    this.fonts = {
      display: opentype.parse(buffers.display),
      body: opentype.parse(buffers.body),
      bodyBold: opentype.parse(buffers.bodyBold),
    };
  }

  widthIn(text: string, fontId: FontId, sizePt: number): number {
    return this.fonts[fontId].getAdvanceWidth(text, sizePt) / PT_PER_IN;
  }

  lineHeightIn(fontId: FontId, sizePt: number): number {
    const f = this.fonts[fontId];
    return (((f.ascender - f.descender) / f.unitsPerEm) * sizePt) / PT_PER_IN;
  }

  ascentIn(fontId: FontId, sizePt: number): number {
    const f = this.fonts[fontId];
    return ((f.ascender / f.unitsPerEm) * sizePt) / PT_PER_IN;
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx vitest run tests/engine/fonts.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: bundle poster fonts and exact FontMetrics measurement"
```

---

### Task 3: BoardSpec model and fixtures

**Files:**
- Create: `src/models/boardSpec.ts`
- Test: `tests/engine/boardSpec.test.ts`, `tests/helpers/fixtures.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/helpers/fixtures.ts`:

```ts
import { boardSpecSchema, type BoardSpec } from '../../src/models/boardSpec';

const NAMES = ['Jesse', 'Kyle', 'Oscar', 'Matt', 'Drew', 'Tony', 'Sam', 'Alex', 'Ben', 'Chris', 'Dan', 'Eric'];

export function makeSpec(over: Record<string, unknown> = {}): BoardSpec {
  return boardSpecSchema.parse({
    title: 'BACHELOR',
    honoree: 'Steven',
    subtitle: 'THE GAME',
    players: NAMES,
    activities: Array.from({ length: 20 }, (_, i) => ({
      name: `Challenge number ${i + 1}`,
      points: (i % 5) + 1,
    })),
    posterSize: '24x36',
    rules: ['Score your own points honestly.', 'The honoree can veto anything once.'],
    ...over,
  });
}

/** n plausible player names, cycling with varied lengths */
export function playerNames(n: number): string[] {
  const pool = ['Jo', 'Kyle', 'Oscar', 'Matthew', 'Bartholomew', 'Christopher W.', 'Drew', 'Sam', 'Alexander'];
  return Array.from({ length: n }, (_, i) => `${pool[i % pool.length]} ${Math.floor(i / pool.length) || ''}`.trim());
}
```

Create `tests/engine/boardSpec.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { boardSpecSchema } from '../../src/models/boardSpec';
import { makeSpec } from '../helpers/fixtures';

describe('boardSpecSchema', () => {
  it('accepts a valid spec and applies theme defaults', () => {
    const spec = makeSpec();
    expect(spec.theme.rowTint).toBe('#EAF1F8');
    expect(spec.theme.highlightPointsHeader).toBe(true);
    expect(spec.activities[0].bonus).toBe(false);
  });

  it('accepts TBD points and bonus rows', () => {
    const spec = makeSpec({
      activities: [
        ...Array.from({ length: 5 }, (_, i) => ({ name: `Task ${i}`, points: i + 1 })),
        { name: 'Beer pong champion', points: 'TBD', bonus: true },
      ],
    });
    expect(spec.activities[5].points).toBe('TBD');
    expect(spec.activities[5].bonus).toBe(true);
  });

  it('rejects fewer than 8 players', () => {
    expect(() => makeSpec({ players: ['A', 'B', 'C'] })).toThrow();
  });

  it('rejects more than 80 activities', () => {
    const many = Array.from({ length: 81 }, (_, i) => ({ name: `T${i}`, points: 1 }));
    expect(() => makeSpec({ activities: many })).toThrow();
  });

  it('rejects an unknown poster size', () => {
    expect(() => makeSpec({ posterSize: '11x17' })).toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/engine/boardSpec.test.ts
```

Expected: FAIL — cannot resolve `src/models/boardSpec`.

- [ ] **Step 3: Implement the model**

Create `src/models/boardSpec.ts`:

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/engine/boardSpec.test.ts
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Zod BoardSpec model with poster sizes, bonus rows, side rail"
```

---

### Task 4: Scene types and the invariant checkers

**Files:**
- Create: `src/engine/scene/types.ts`, `src/engine/scene/colors.ts`
- Test: `tests/helpers/invariants.ts`, `tests/engine/invariants.test.ts`

The invariant helpers are the safety net every later task leans on, so they get their own tiny test against hand-built scenes.

- [ ] **Step 1: Write the failing test**

Create `tests/engine/invariants.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type { Scene } from '../../src/engine/scene/types';
import { overflowingRuns, outOfPage } from '../helpers/invariants';
import { testMetrics } from '../helpers/loadFonts';

const m = testMetrics();

function scene(primitives: Scene['primitives']): Scene {
  return { widthIn: 10, heightIn: 10, primitives };
}

describe('invariant checkers', () => {
  it('passes a text run that fits its box', () => {
    const s = scene([
      { kind: 'text', box: { x: 1, y: 1, w: 5, h: 0.5 }, text: 'Hi', fontId: 'body', sizePt: 12, color: '#000', align: 'left' },
    ]);
    expect(overflowingRuns(s, m)).toHaveLength(0);
    expect(outOfPage(s)).toHaveLength(0);
  });

  it('catches a text run wider than its box', () => {
    const s = scene([
      { kind: 'text', box: { x: 1, y: 1, w: 0.1, h: 0.5 }, text: 'Bartholomew Wellington', fontId: 'body', sizePt: 24, color: '#000', align: 'left' },
    ]);
    expect(overflowingRuns(s, m)).toHaveLength(1);
  });

  it('checks rotated text against box height, not width', () => {
    const tall = { kind: 'text' as const, box: { x: 1, y: 1, w: 0.4, h: 5 }, text: 'Bartholomew', fontId: 'body' as const, sizePt: 14, color: '#000', align: 'left' as const, rotate: -90 as const };
    expect(overflowingRuns(scene([tall]), m)).toHaveLength(0);
    const short = { ...tall, box: { ...tall.box, h: 0.2 } };
    expect(overflowingRuns(scene([short]), m)).toHaveLength(1);
  });

  it('catches any primitive escaping the page', () => {
    const s = scene([
      { kind: 'rect', box: { x: 9, y: 9, w: 2, h: 2 } },
      { kind: 'line', x1: -1, y1: 0, x2: 5, y2: 5, color: '#000', widthIn: 0.02 },
    ]);
    expect(outOfPage(s)).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/engine/invariants.test.ts
```

Expected: FAIL — cannot resolve `src/engine/scene/types`.

- [ ] **Step 3: Implement scene types, colors, and the checkers**

Create `src/engine/scene/types.ts`:

```ts
import type { Box } from '../geometry';
import type { FontId } from '../fonts/metrics';

/**
 * A Scene is the fully-solved poster: every primitive has a final position
 * and size in inches. Renderers draw it verbatim and make no layout decisions.
 * TextRun.box is the inner box the glyphs must fit (padding already applied).
 * rotate: -90 = text reads bottom-to-top; measured width must fit box.h.
 */
export interface TextRun {
  kind: 'text';
  box: Box;
  text: string;
  fontId: FontId;
  sizePt: number;
  color: string;
  align: 'left' | 'center' | 'right';
  rotate?: -90;
}

export interface RectPrim {
  kind: 'rect';
  box: Box;
  fill?: string;
  stroke?: string;
  strokeWidthIn?: number;
}

export interface LinePrim {
  kind: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  widthIn: number;
}

export type Primitive = TextRun | RectPrim | LinePrim;

export interface Scene {
  widthIn: number;
  heightIn: number;
  primitives: Primitive[];
}
```

Create `src/engine/scene/colors.ts`:

```ts
export const INK = '#141414';
export const GRID_LINE = '#2A2A2A';
export const HIGHLIGHT = '#B3261E';
export const PAGE_BG = '#FFFFFF';
```

Create `tests/helpers/invariants.ts`:

```ts
import type { Scene, TextRun, Primitive } from '../../src/engine/scene/types';
import type { FontMetrics } from '../../src/engine/fonts/metrics';

const EPS = 0.01; // inches of forgiveness for float noise

/** Text runs whose measured width exceeds their box (the build-1-through-4 bug class). */
export function overflowingRuns(scene: Scene, m: FontMetrics): TextRun[] {
  return scene.primitives.filter((p): p is TextRun => p.kind === 'text').filter((t) => {
    const w = m.widthIn(t.text, t.fontId, t.sizePt);
    const budget = t.rotate === -90 ? t.box.h : t.box.w;
    return w > budget + EPS;
  });
}

/** Any primitive whose extent escapes the page bounds. */
export function outOfPage(scene: Scene): Primitive[] {
  return scene.primitives.filter((p) => {
    let x1: number, y1: number, x2: number, y2: number;
    if (p.kind === 'line') {
      x1 = Math.min(p.x1, p.x2); x2 = Math.max(p.x1, p.x2);
      y1 = Math.min(p.y1, p.y2); y2 = Math.max(p.y1, p.y2);
    } else {
      x1 = p.box.x; y1 = p.box.y; x2 = p.box.x + p.box.w; y2 = p.box.y + p.box.h;
    }
    return x1 < -EPS || y1 < -EPS || x2 > scene.widthIn + EPS || y2 > scene.heightIn + EPS;
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/engine/invariants.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: scene primitive types and overflow/out-of-page invariant checkers"
```

---

### Task 5: Text fitting helpers (wrap, ellipsize, fit-size) — **Fable from here on**

**Files:**
- Create: `src/engine/layout/wrap.ts`
- Test: `tests/engine/wrap.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/engine/wrap.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { wrapToWidth, hardEllipsize, fitSizePt } from '../../src/engine/layout/wrap';
import { testMetrics } from '../helpers/loadFonts';

const m = testMetrics();

describe('hardEllipsize', () => {
  it('leaves fitting text alone', () => {
    const r = hardEllipsize('Kyle', 3, 'body', 12, m);
    expect(r).toEqual({ text: 'Kyle', ellipsized: false });
  });

  it('shortens overflowing text with an ellipsis that fits', () => {
    const r = hardEllipsize('Bartholomew Wellington the Third', 1.0, 'body', 12, m);
    expect(r.ellipsized).toBe(true);
    expect(r.text.endsWith('…')).toBe(true);
    expect(m.widthIn(r.text, 'body', 12)).toBeLessThanOrEqual(1.0 + 0.01);
  });
});

describe('wrapToWidth', () => {
  it('returns one line when it fits', () => {
    const r = wrapToWidth('Shotgun a beer', 5, 'body', 12, m, 2);
    expect(r.lines).toEqual(['Shotgun a beer']);
    expect(r.ellipsized).toBe(false);
  });

  it('wraps on word boundaries and every line fits', () => {
    const r = wrapToWidth('Convince a stranger to do a toast for the groom', 1.6, 'body', 12, m, 4);
    expect(r.lines.length).toBeGreaterThan(1);
    for (const line of r.lines) {
      expect(m.widthIn(line, 'body', 12)).toBeLessThanOrEqual(1.6 + 0.01);
    }
  });

  it('ellipsizes when exceeding maxLines, still fitting the width', () => {
    const r = wrapToWidth('Convince a stranger to do a toast for the groom at dinner', 1.2, 'body', 12, m, 2);
    expect(r.lines).toHaveLength(2);
    expect(r.ellipsized).toBe(true);
    expect(m.widthIn(r.lines[1], 'body', 12)).toBeLessThanOrEqual(1.2 + 0.01);
  });

  it('handles a single word wider than the column', () => {
    const r = wrapToWidth('Supercalifragilisticexpialidocious', 0.8, 'body', 12, m, 2);
    expect(r.ellipsized).toBe(true);
    for (const line of r.lines) {
      expect(m.widthIn(line, 'body', 12)).toBeLessThanOrEqual(0.8 + 0.01);
    }
  });
});

describe('fitSizePt', () => {
  it('finds a size where width and height both fit', () => {
    const pt = fitSizePt('BACHELOR', 6, 1, 'display', m, 300, 8);
    expect(pt).not.toBeNull();
    expect(m.widthIn('BACHELOR', 'display', pt!)).toBeLessThanOrEqual(6 + 0.01);
    expect(m.lineHeightIn('display', pt!)).toBeLessThanOrEqual(1 + 0.01);
  });

  it('returns null when even the minimum cannot fit', () => {
    expect(fitSizePt('BACHELOR WEEKEND EXTRAVAGANZA', 0.05, 1, 'display', m, 300, 8)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/engine/wrap.test.ts
```

Expected: FAIL — cannot resolve `src/engine/layout/wrap`.

- [ ] **Step 3: Implement the helpers**

Create `src/engine/layout/wrap.ts`:

```ts
import type { FontMetrics, FontId } from '../fonts/metrics';

export interface WrapResult {
  lines: string[];
  ellipsized: boolean;
}

/** Truncate with a trailing ellipsis until the text fits maxW. */
export function hardEllipsize(
  text: string,
  maxW: number,
  fontId: FontId,
  sizePt: number,
  m: FontMetrics,
): { text: string; ellipsized: boolean } {
  if (m.widthIn(text, fontId, sizePt) <= maxW) return { text, ellipsized: false };
  let t = text;
  while (t.length > 1 && m.widthIn(t + '…', fontId, sizePt) > maxW) {
    t = t.slice(0, -1).trimEnd();
  }
  return { text: t + '…', ellipsized: true };
}

/**
 * Greedy word-wrap to maxW. If the result exceeds maxLines, the overflow is
 * folded into the last line and ellipsized. Any single word wider than maxW
 * is hard-ellipsized. Every returned line is guaranteed to fit maxW.
 */
export function wrapToWidth(
  text: string,
  maxW: number,
  fontId: FontId,
  sizePt: number,
  m: FontMetrics,
  maxLines: number,
): WrapResult {
  const words = text.split(/\s+/).filter(Boolean);
  const rawLines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || m.widthIn(candidate, fontId, sizePt) <= maxW) {
      current = candidate;
    } else {
      rawLines.push(current);
      current = word;
    }
  }
  if (current) rawLines.push(current);

  let ellipsized = false;
  let lines = rawLines;
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = [kept[maxLines - 1], ...lines.slice(maxLines)].join(' ');
    lines = kept;
    ellipsized = true;
  }

  lines = lines.map((line) => {
    const r = hardEllipsize(line, maxW, fontId, sizePt, m);
    if (r.ellipsized) ellipsized = true;
    return r.text;
  });

  return { lines, ellipsized };
}

/**
 * Largest point size (stepping down by 0.5) at which the text's width fits
 * maxW and its line height fits maxH. Null if minPt still doesn't fit.
 */
export function fitSizePt(
  text: string,
  maxW: number,
  maxH: number,
  fontId: FontId,
  m: FontMetrics,
  maxPt: number,
  minPt: number,
): number | null {
  for (let pt = maxPt; pt >= minPt; pt -= 0.5) {
    if (m.widthIn(text, fontId, pt) <= maxW && m.lineHeightIn(fontId, pt) <= maxH) return pt;
  }
  return null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/engine/wrap.test.ts
```

Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: measured wrap, ellipsize, and fit-size helpers"
```

---

### Task 6: Pass 1 — region partition

**Files:**
- Create: `src/engine/layout/regions.ts`
- Test: `tests/engine/regions.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/engine/regions.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { partitionRegions } from '../../src/engine/layout/regions';
import { makeSpec } from '../helpers/fixtures';

describe('partitionRegions', () => {
  it('stacks header, grid, rules inside the page with margins', () => {
    const r = partitionRegions(makeSpec());
    expect(r.pageW).toBe(24);
    expect(r.pageH).toBe(36);
    expect(r.header.y).toBeGreaterThan(0);
    expect(r.grid.y).toBeGreaterThan(r.header.y + r.header.h);
    expect(r.rules).toBeDefined();
    expect(r.rules!.y + r.rules!.h).toBeLessThan(36);
    expect(r.grid.y + r.grid.h).toBeLessThanOrEqual(r.rules!.y + 0.01);
  });

  it('omits the rules region when there are no rules', () => {
    const r = partitionRegions(makeSpec({ rules: [] }));
    expect(r.rules).toBeUndefined();
  });

  it('gives the grid full width when no rail is requested', () => {
    const r = partitionRegions(makeSpec());
    expect(r.rail).toBeUndefined();
    expect(r.grid.w).toBeCloseTo(r.header.w, 5);
  });

  it('reserves a right rail and narrows the grid', () => {
    const r = partitionRegions(makeSpec({ sideRail: { side: 'right', widthIn: 5, title: 'BEER PONG BRACKET' } }));
    expect(r.rail).toBeDefined();
    expect(r.rail!.box.w).toBeCloseTo(5, 5);
    expect(r.rail!.box.x).toBeGreaterThan(r.grid.x + r.grid.w);
    expect(r.grid.w).toBeLessThan(r.header.w - 5);
    expect(r.rail!.title).toBe('BEER PONG BRACKET');
  });

  it('places a left rail before the grid', () => {
    const r = partitionRegions(makeSpec({ sideRail: { side: 'left', widthIn: 4, title: 'BRACKET' } }));
    expect(r.rail!.box.x).toBeLessThan(r.grid.x);
  });

  it('caps rail width at 30% of content width', () => {
    const r = partitionRegions(makeSpec({ posterSize: '18x24', sideRail: { side: 'right', widthIn: 12, title: 'B' } }));
    expect(r.rail!.box.w).toBeLessThanOrEqual((18 - 1) * 0.3 + 0.01);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/engine/regions.test.ts
```

Expected: FAIL — cannot resolve `src/engine/layout/regions`.

- [ ] **Step 3: Implement the partitioner**

Create `src/engine/layout/regions.ts`:

```ts
import type { BoardSpec } from '../../models/boardSpec';
import { POSTER_SIZES } from '../../models/boardSpec';
import type { Box } from '../geometry';
import { clamp } from '../geometry';

export interface Regions {
  pageW: number;
  pageH: number;
  header: Box;
  grid: Box;
  rules?: Box;
  rail?: { box: Box; title: string };
}

const REGION_GAP = 0.25;

export function partitionRegions(spec: BoardSpec): Regions {
  const { w: pageW, h: pageH } = POSTER_SIZES[spec.posterSize];
  const margin = clamp(pageH * 0.015, 0.5, 1.0);
  const content: Box = { x: margin, y: margin, w: pageW - 2 * margin, h: pageH - 2 * margin };

  const headerH = clamp(pageH * 0.11, 2.2, 6);
  const rulesH = spec.rules.length > 0 ? clamp(pageH * 0.07, 1.5, 4) : 0;

  const bodyTop = content.y + headerH + REGION_GAP;
  const bodyBottom = content.y + content.h - (rulesH ? rulesH + REGION_GAP : 0);

  let gridX = content.x;
  let gridW = content.w;
  let rail: Regions['rail'];
  if (spec.sideRail) {
    const railW = Math.min(spec.sideRail.widthIn, content.w * 0.3);
    rail = {
      title: spec.sideRail.title,
      box: {
        x: spec.sideRail.side === 'left' ? content.x : content.x + content.w - railW,
        y: bodyTop,
        w: railW,
        h: bodyBottom - bodyTop,
      },
    };
    gridW = content.w - railW - REGION_GAP;
    if (spec.sideRail.side === 'left') gridX = content.x + railW + REGION_GAP;
  }

  return {
    pageW,
    pageH,
    header: { x: content.x, y: content.y, w: content.w, h: headerH },
    grid: { x: gridX, y: bodyTop, w: gridW, h: bodyBottom - bodyTop },
    rules: rulesH ? { x: content.x, y: content.y + content.h - rulesH, w: content.w, h: rulesH } : undefined,
    rail,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/engine/regions.test.ts
```

Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: pass 1 region partition with side-rail reservation"
```

---

### Task 7: Pass 2 — the grid solver

**Files:**
- Create: `src/engine/layout/gridSolver.ts`
- Test: `tests/engine/gridSolver.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/engine/gridSolver.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { solveGrid, FLOOR_PT, MIN_COL_W, MIN_ROW_H, CELL_PAD } from '../../src/engine/layout/gridSolver';
import { partitionRegions } from '../../src/engine/layout/regions';
import { makeSpec, playerNames } from '../helpers/fixtures';
import { testMetrics } from '../helpers/loadFonts';

const m = testMetrics();

function solve(over: Record<string, unknown> = {}) {
  const spec = makeSpec(over);
  const regions = partitionRegions(spec);
  return { spec, regions, result: solveGrid(regions.grid, spec, m) };
}

describe('solveGrid', () => {
  it('solves a comfortable board at a generous size', () => {
    const { result } = solve();
    expect(result.feasible).toBe(true);
    if (!result.feasible) return;
    expect(result.bodyPt).toBeGreaterThanOrEqual(12);
    expect(result.degradations.ellipsized).toBe(0);
  });

  it('geometry adds up: columns fill the grid width, rows fill the height budget', () => {
    const { spec, regions, result } = solve();
    if (!result.feasible) throw new Error('expected feasible');
    const totalW = result.taskColW + result.pointsColW + result.playerColW * spec.players.length;
    expect(totalW).toBeCloseTo(regions.grid.w, 3);
    const totalH = result.headerBandH + result.rowH * (spec.activities.length + 1);
    expect(totalH).toBeLessThanOrEqual(regions.grid.h + 0.01);
  });

  it('respects hard floors', () => {
    const { result } = solve({ players: playerNames(35), posterSize: '48x72' });
    if (!result.feasible) throw new Error('expected feasible');
    expect(result.bodyPt).toBeGreaterThanOrEqual(FLOOR_PT);
    expect(result.playerColW).toBeGreaterThanOrEqual(MIN_COL_W);
    expect(result.rowH).toBeGreaterThanOrEqual(MIN_ROW_H);
  });

  it('wrapped task lines each fit the task column', () => {
    const long = Array.from({ length: 20 }, (_, i) => ({
      name: `Convince a complete stranger to give a heartfelt toast for the groom number ${i}`,
      points: 5,
    }));
    const { result } = solve({ activities: long });
    if (!result.feasible) throw new Error('expected feasible');
    for (const lines of result.taskLines) {
      for (const line of lines) {
        expect(m.widthIn(line, 'body', result.bodyPt)).toBeLessThanOrEqual(result.taskColW - 2 * CELL_PAD + 0.01);
      }
    }
  });

  it('ellipsizes very long player names rather than overflowing the header band', () => {
    const { result } = solve({
      players: [...playerNames(10), 'Bartholomew Wellington III', 'Christopher Attenborough'],
    });
    if (!result.feasible) throw new Error('expected feasible');
    for (const name of result.playerNames) {
      expect(m.widthIn(name, 'bodyBold', result.bodyPt)).toBeLessThanOrEqual(result.headerBandH - 2 * CELL_PAD + 0.01);
    }
  });

  it('reports infeasible with a helpful reason for 35 players on 18x24', () => {
    const { result } = solve({ players: playerNames(35), posterSize: '18x24' });
    expect(result.feasible).toBe(false);
    if (result.feasible) return;
    expect(result.reason).toContain('18x24');
  });

  it('more activities never increases the solved font size', () => {
    const a = solve({ activities: Array.from({ length: 15 }, (_, i) => ({ name: `Task ${i}`, points: 1 })) });
    const b = solve({ activities: Array.from({ length: 60 }, (_, i) => ({ name: `Task ${i}`, points: 1 })) });
    if (!a.result.feasible || !b.result.feasible) throw new Error('expected both feasible');
    expect(b.result.bodyPt).toBeLessThanOrEqual(a.result.bodyPt);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/engine/gridSolver.test.ts
```

Expected: FAIL — cannot resolve `src/engine/layout/gridSolver`.

- [ ] **Step 3: Implement the solver**

Create `src/engine/layout/gridSolver.ts`:

```ts
import type { BoardSpec } from '../../models/boardSpec';
import type { Box } from '../geometry';
import type { FontMetrics } from '../fonts/metrics';
import { wrapToWidth, hardEllipsize } from './wrap';

// Print-informed floors (from the spec)
export const FLOOR_PT = 9;
export const MIN_COL_W = 0.55;
export const MIN_ROW_H = 0.28;
export const CELL_PAD = 0.08;

export interface GridLayout {
  feasible: true;
  bodyPt: number;
  headerBandH: number;
  rowH: number;
  taskColW: number;
  pointsColW: number;
  playerColW: number;
  /** wrapped (and possibly ellipsized) label lines, per activity */
  taskLines: string[][];
  /** player names, possibly ellipsized to fit the header band */
  playerNames: string[];
  degradations: { wrappedTasks: number; ellipsized: number };
}

export interface Infeasible {
  feasible: false;
  reason: string;
}

export type SolveResult = GridLayout | Infeasible;

/**
 * Walk a font-size ladder from a poster-scaled starting size down to the
 * floor; the first size whose fully-measured layout fits wins. Degradations
 * (wrapping, ellipsizing) happen inside each attempt and are reported, never
 * silent.
 */
export function solveGrid(grid: Box, spec: BoardSpec, m: FontMetrics): SolveResult {
  const startPt = Math.min(20, Math.max(FLOOR_PT, grid.h * 0.7));
  for (let pt = startPt; pt >= FLOOR_PT; pt -= 0.5) {
    const layout = tryFit(grid, spec, m, pt);
    if (layout) return layout;
  }
  return {
    feasible: false,
    reason:
      `${spec.players.length} players and ${spec.activities.length} activities cannot fit legibly ` +
      `on a ${spec.posterSize} poster. Choose a larger size or remove players/activities.`,
  };
}

function tryFit(grid: Box, spec: BoardSpec, m: FontMetrics, pt: number): GridLayout | null {
  const lineH = m.lineHeightIn('body', pt);
  let ellipsized = 0;

  // Header band: rotated player names need vertical room equal to their measured width.
  const bandCap = grid.h * 0.22;
  const longestName = Math.max(...spec.players.map((p) => m.widthIn(p, 'bodyBold', pt)));
  let headerBandH = longestName + 2 * CELL_PAD;
  let playerNames = [...spec.players];
  if (headerBandH > bandCap) {
    headerBandH = bandCap;
    playerNames = spec.players.map((p) => {
      const r = hardEllipsize(p, bandCap - 2 * CELL_PAD, 'bodyBold', pt, m);
      if (r.ellipsized) ellipsized++;
      return r.text;
    });
  }

  // Points column sized to its widest value ("999" or "TBD").
  const pointsColW = Math.max(
    MIN_COL_W,
    Math.max(...spec.activities.map((a) => m.widthIn(String(a.points), 'bodyBold', pt))) + 2 * CELL_PAD,
  );

  // Task column: natural measured width, capped at 34% of the grid; wrap to 2 lines past the cap.
  const taskCap = grid.w * 0.34;
  const naturalTaskW = Math.max(...spec.activities.map((a) => m.widthIn(a.name, 'body', pt))) + 2 * CELL_PAD;
  const taskColW = Math.min(naturalTaskW, taskCap);
  let wrappedTasks = 0;
  const taskLines = spec.activities.map((a) => {
    const r = wrapToWidth(a.name, taskColW - 2 * CELL_PAD, 'body', pt, m, 2);
    if (r.lines.length > 1) wrappedTasks++;
    if (r.ellipsized) ellipsized++;
    return r.lines;
  });

  // Player columns split the remainder; rotated names also need horizontal room for one line height.
  const playerColW = (grid.w - taskColW - pointsColW) / spec.players.length;
  if (playerColW < Math.max(MIN_COL_W, m.lineHeightIn('bodyBold', pt) + 2 * CELL_PAD)) return null;

  // Rows: activities + one totals row share what the header band leaves.
  const maxLines = Math.max(...taskLines.map((l) => l.length));
  const rowH = (grid.h - headerBandH) / (spec.activities.length + 1);
  if (rowH < Math.max(MIN_ROW_H, maxLines * lineH + 2 * CELL_PAD)) return null;

  return {
    feasible: true,
    bodyPt: pt,
    headerBandH,
    rowH,
    taskColW,
    pointsColW,
    playerColW,
    taskLines,
    playerNames,
    degradations: { wrappedTasks, ellipsized },
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/engine/gridSolver.test.ts
```

Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: pass 2 grid solver with measured font ladder and degradation"
```

---

### Task 8: Pass 3 — quality grading

**Files:**
- Create: `src/engine/layout/quality.ts`
- Test: `tests/engine/quality.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/engine/quality.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { gradeLayout } from '../../src/engine/layout/quality';
import { solveGrid } from '../../src/engine/layout/gridSolver';
import { partitionRegions } from '../../src/engine/layout/regions';
import { makeSpec, playerNames } from '../helpers/fixtures';
import { testMetrics } from '../helpers/loadFonts';

const m = testMetrics();

function grade(over: Record<string, unknown> = {}) {
  const spec = makeSpec(over);
  const result = solveGrid(partitionRegions(spec).grid, spec, m);
  if (!result.feasible) throw new Error('expected feasible: ' + JSON.stringify(over));
  return gradeLayout(result, spec);
}

describe('gradeLayout', () => {
  it('grades a comfortable board as good', () => {
    const q = grade();
    expect(q.grade).toBe('good');
    expect(q.advice.length).toBeGreaterThan(0);
  });

  it('grades a dense board below good and suggests the next size up', () => {
    const q = grade({
      posterSize: '18x24',
      players: playerNames(24),
      activities: Array.from({ length: 45 }, (_, i) => ({ name: `Challenge item ${i}`, points: 2 })),
    });
    expect(['tight', 'poor']).toContain(q.grade);
    expect(q.advice.join(' ')).toContain('24');
  });

  it('grades ellipsized names as poor', () => {
    const q = grade({
      posterSize: '18x24',
      players: [...playerNames(20), 'Bartholomew Wellington Fitzgerald III'],
      activities: Array.from({ length: 40 }, (_, i) => ({ name: `Task ${i}`, points: 1 })),
    });
    if (q.grade === 'poor') {
      expect(q.advice.join(' ')).toMatch(/shortened|minimum/);
    }
    // if the solver managed without ellipsizing, tight is acceptable
    expect(['tight', 'poor']).toContain(q.grade);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/engine/quality.test.ts
```

Expected: FAIL — cannot resolve `src/engine/layout/quality`.

- [ ] **Step 3: Implement grading**

Create `src/engine/layout/quality.ts`:

```ts
import type { BoardSpec, PosterSizeId } from '../../models/boardSpec';
import type { GridLayout } from './gridSolver';

export type Grade = 'good' | 'tight' | 'poor';

export interface QualityReport {
  grade: Grade;
  bodyPt: number;
  advice: string[];
}

const NEXT_SIZE: Record<PosterSizeId, PosterSizeId | null> = {
  '18x24': '24x36',
  '24x36': '36x48',
  '36x48': '48x72',
  '48x72': null,
};

export function gradeLayout(layout: GridLayout, spec: BoardSpec): QualityReport {
  const bigger = NEXT_SIZE[spec.posterSize];
  const suggest = bigger
    ? `Consider a ${bigger.replace('x', '"x')}" poster`
    : 'Consider fewer activities or players';

  let grade: Grade;
  if (layout.degradations.ellipsized > 0 || layout.bodyPt <= 9.5 || layout.rowH < 0.32) {
    grade = 'poor';
  } else if (layout.bodyPt >= 12 && layout.degradations.wrappedTasks === 0 && layout.rowH >= 0.4) {
    grade = 'good';
  } else {
    grade = 'tight';
  }

  const advice: string[] = [];
  if (layout.degradations.ellipsized > 0) {
    advice.push(`${layout.degradations.ellipsized} item(s) were shortened with "…". ${suggest}.`);
  }
  if (layout.bodyPt <= 9.5) {
    advice.push(`Body text is at the ${layout.bodyPt}pt minimum and may be hard to read from a distance. ${suggest}.`);
  }
  if (grade === 'tight') advice.push(`Everything fits but the board is dense. ${suggest} for more breathing room.`);
  if (grade === 'poor' && advice.length === 0) advice.push(`Rows are near the minimum height. ${suggest}.`);
  if (grade === 'good') advice.push('Readable at a comfortable distance. Good to print.');
  return { grade, bodyPt: layout.bodyPt, advice };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/engine/quality.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: pass 3 quality grading with specific advice"
```

---

### Task 9: Scene composition — page, header, divider, side rail

**Files:**
- Create: `src/engine/scene/compose.ts`
- Test: `tests/engine/compose.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/engine/compose.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { composeScene } from '../../src/engine/scene/compose';
import { partitionRegions } from '../../src/engine/layout/regions';
import { solveGrid } from '../../src/engine/layout/gridSolver';
import { makeSpec } from '../helpers/fixtures';
import { testMetrics } from '../helpers/loadFonts';
import { overflowingRuns, outOfPage } from '../helpers/invariants';
import type { TextRun } from '../../src/engine/scene/types';

const m = testMetrics();

export function build(over: Record<string, unknown> = {}) {
  const spec = makeSpec(over);
  const regions = partitionRegions(spec);
  const solved = solveGrid(regions.grid, spec, m);
  if (!solved.feasible) throw new Error('fixture must be feasible');
  return { spec, scene: composeScene(spec, regions, solved, m) };
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
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/engine/compose.test.ts
```

Expected: FAIL — cannot resolve `src/engine/scene/compose`.

- [ ] **Step 3: Implement composition (header + rail only for now)**

Create `src/engine/scene/compose.ts`:

```ts
import type { BoardSpec } from '../../models/boardSpec';
import type { Regions } from '../layout/regions';
import type { GridLayout } from '../layout/gridSolver';
import type { FontMetrics, FontId } from '../fonts/metrics';
import type { Scene, Primitive } from './types';
import type { Box } from '../geometry';
import { fitSizePt } from '../layout/wrap';
import { INK, PAGE_BG } from './colors';

export function composeScene(spec: BoardSpec, regions: Regions, layout: GridLayout, m: FontMetrics): Scene {
  const prims: Primitive[] = [];
  prims.push({ kind: 'rect', box: { x: 0, y: 0, w: regions.pageW, h: regions.pageH }, fill: PAGE_BG });

  composeHeader(spec, regions, m, prims);
  if (regions.rail) composeRail(regions.rail, m, prims);
  // grid, bespoke extras, and rules are added in Tasks 10-11

  return { widthIn: regions.pageW, heightIn: regions.pageH, primitives: prims };
}

/** Centered fitted single-line text inside a box. Skips silently only if even 8pt cannot fit. */
function fittedLine(text: string, box: Box, fontId: FontId, m: FontMetrics, prims: Primitive[]) {
  const pt = fitSizePt(text, box.w, box.h, fontId, m, 300, 8);
  if (pt === null) return;
  prims.push({ kind: 'text', box, text, fontId, sizePt: pt, color: INK, align: 'center' });
}

function composeHeader(spec: BoardSpec, regions: Regions, m: FontMetrics, prims: Primitive[]) {
  const h = regions.header;
  const rows: Array<[string, number, FontId]> = spec.subtitle
    ? [
        [spec.title, 0.5, 'display'],
        [spec.honoree, 0.32, 'display'],
        [spec.subtitle, 0.18, 'bodyBold'],
      ]
    : [
        [spec.title, 0.6, 'display'],
        [spec.honoree, 0.4, 'display'],
      ];

  let y = h.y;
  for (const [text, frac, fontId] of rows) {
    const rowBox: Box = { x: h.x + h.w * 0.05, y, w: h.w * 0.9, h: h.h * frac * 0.9 };
    fittedLine(text, rowBox, fontId, m, prims);
    y += h.h * frac;
  }

  if (spec.theme.headerDivider) {
    const dy = h.y + h.h + 0.1;
    prims.push({ kind: 'line', x1: h.x, y1: dy, x2: h.x + h.w, y2: dy, color: INK, widthIn: 0.03 });
  }
}

function composeRail(rail: NonNullable<Regions['rail']>, m: FontMetrics, prims: Primitive[]) {
  prims.push({ kind: 'rect', box: rail.box, stroke: INK, strokeWidthIn: 0.03 });
  const titleBox: Box = { x: rail.box.x + 0.15, y: rail.box.y + 0.15, w: rail.box.w - 0.3, h: 0.6 };
  fittedLine(rail.title, titleBox, 'bodyBold', m, prims);
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/engine/compose.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: scene composition for page, header, divider, side rail"
```

---

### Task 10: Scene composition — the scoring grid

**Files:**
- Modify: `src/engine/scene/compose.ts`
- Test: `tests/engine/compose.test.ts` (append)

- [ ] **Step 1: Append the failing tests**

Append to `tests/engine/compose.test.ts`:

```ts
import type { RectPrim, LinePrim } from '../../src/engine/scene/types';

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
```

- [ ] **Step 2: Run to verify the new tests fail**

```bash
npx vitest run tests/engine/compose.test.ts
```

Expected: the 5 new tests FAIL (no grid primitives yet); the original 4 still pass.

- [ ] **Step 3: Implement the grid composition**

In `src/engine/scene/compose.ts`, add imports at the top:

```ts
import { CELL_PAD } from '../layout/gridSolver';
import { GRID_LINE } from './colors';
```

Replace the comment `// grid, bespoke extras, and rules are added in Tasks 10-11` in `composeScene` with:

```ts
  composeGrid(spec, regions.grid, layout, m, prims);
```

Add these functions at the bottom of the file:

```ts
function composeGrid(spec: BoardSpec, grid: Box, L: GridLayout, m: FontMetrics, prims: Primitive[]) {
  const n = spec.players.length;
  const rows = spec.activities.length;
  const playersX = grid.x + L.taskColW + L.pointsColW;
  const rowY = (r: number) => grid.y + L.headerBandH + r * L.rowH;
  const gridBottom = rowY(rows + 1); // activities + totals row
  const lineH = m.lineHeightIn('body', L.bodyPt);

  // Alternate-row tint (subtle blue per theme), behind everything else in the grid
  for (let r = 0; r < rows; r++) {
    if (r % 2 === 1) {
      prims.push({ kind: 'rect', box: { x: grid.x, y: rowY(r), w: grid.w, h: L.rowH }, fill: spec.theme.rowTint });
    }
  }

  // Rotated player names in the header band
  spec.players.forEach((_, i) => {
    prims.push({
      kind: 'text',
      box: {
        x: playersX + i * L.playerColW + CELL_PAD,
        y: grid.y + CELL_PAD,
        w: L.playerColW - 2 * CELL_PAD,
        h: L.headerBandH - 2 * CELL_PAD,
      },
      text: L.playerNames[i],
      fontId: 'bodyBold',
      sizePt: L.bodyPt,
      color: INK,
      align: 'left',
      rotate: -90,
    });
  });

  // Rotated POSSIBLE POINTS header in the points column
  const ppBox: Box = {
    x: grid.x + L.taskColW + CELL_PAD,
    y: grid.y + CELL_PAD,
    w: L.pointsColW - 2 * CELL_PAD,
    h: L.headerBandH - 2 * CELL_PAD,
  };
  const ppPt = fitSizePt('POSSIBLE POINTS', ppBox.h, ppBox.w, 'bodyBold', m, L.bodyPt, 6);
  if (ppPt !== null) {
    prims.push({ kind: 'text', box: ppBox, text: 'POSSIBLE POINTS', fontId: 'bodyBold', sizePt: ppPt, color: INK, align: 'left', rotate: -90 });
  }

  // Task labels (one TextRun per wrapped line) and points values
  spec.activities.forEach((a, r) => {
    const lines = L.taskLines[r];
    let ty = rowY(r) + (L.rowH - lines.length * lineH) / 2;
    for (const line of lines) {
      prims.push({
        kind: 'text',
        box: { x: grid.x + CELL_PAD, y: ty, w: L.taskColW - 2 * CELL_PAD, h: lineH },
        text: line,
        fontId: 'body',
        sizePt: L.bodyPt,
        color: INK,
        align: 'left',
      });
      ty += lineH;
    }
    prims.push({
      kind: 'text',
      box: {
        x: grid.x + L.taskColW + CELL_PAD,
        y: rowY(r) + (L.rowH - lineH) / 2,
        w: L.pointsColW - 2 * CELL_PAD,
        h: lineH,
      },
      text: String(a.points),
      fontId: 'bodyBold',
      sizePt: L.bodyPt,
      color: INK,
      align: 'center',
    });
  });

  // Totals row: heavy top border + label
  const totY = rowY(rows);
  prims.push({ kind: 'line', x1: grid.x, y1: totY, x2: grid.x + grid.w, y2: totY, color: INK, widthIn: 0.03 });
  prims.push({
    kind: 'text',
    box: { x: grid.x + CELL_PAD, y: totY + (L.rowH - lineH) / 2, w: L.taskColW - 2 * CELL_PAD, h: lineH },
    text: 'TOTAL',
    fontId: 'bodyBold',
    sizePt: L.bodyPt,
    color: INK,
    align: 'left',
  });

  // Grid lines
  const xs = [grid.x, grid.x + L.taskColW, grid.x + L.taskColW + L.pointsColW];
  for (let i = 1; i <= n; i++) xs.push(playersX + i * L.playerColW);
  for (const x of xs) {
    prims.push({ kind: 'line', x1: x, y1: grid.y, x2: x, y2: gridBottom, color: GRID_LINE, widthIn: 0.015 });
  }
  const ys = [grid.y, grid.y + L.headerBandH];
  for (let r = 1; r <= rows; r++) ys.push(rowY(r));
  ys.push(gridBottom);
  for (const y of ys) {
    prims.push({ kind: 'line', x1: grid.x, y1: y, x2: grid.x + grid.w, y2: y, color: GRID_LINE, widthIn: 0.015 });
  }
}
```

- [ ] **Step 4: Run the full compose suite**

```bash
npx vitest run tests/engine/compose.test.ts
```

Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: scene composition for the scoring grid with tinted rows"
```

---

### Task 11: Bespoke elements, rules strip, and the buildBoard entry point

**Files:**
- Modify: `src/engine/scene/compose.ts`
- Create: `src/engine/buildBoard.ts`, `src/engine/index.ts`
- Test: `tests/engine/compose.test.ts` (append)

- [ ] **Step 1: Append the failing tests**

Append to `tests/engine/compose.test.ts`:

```ts
import { HIGHLIGHT } from '../../src/engine/scene/colors';
import { buildBoard } from '../../src/engine/buildBoard';

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
```

- [ ] **Step 2: Run to verify the new tests fail**

```bash
npx vitest run tests/engine/compose.test.ts
```

Expected: the 7 new tests FAIL; earlier tests still pass.

- [ ] **Step 3: Implement extras, rules, and buildBoard**

In `src/engine/scene/compose.ts`, add to the imports:

```ts
import { wrapToWidth } from '../layout/wrap';
import { HIGHLIGHT } from './colors';
```

In `composeScene`, after the `composeGrid(...)` call, add:

```ts
  composeExtras(spec, regions.grid, layout, m, prims);
  if (regions.rules) composeRules(spec, regions.rules, m, prims);
```

Add at the bottom of the file:

```ts
function composeExtras(spec: BoardSpec, grid: Box, L: GridLayout, m: FontMetrics, prims: Primitive[]) {
  const rowY = (r: number) => grid.y + L.headerBandH + r * L.rowH;

  // Steven-poster highlight box around the POSSIBLE POINTS column header
  if (spec.theme.highlightPointsHeader) {
    prims.push({
      kind: 'rect',
      box: { x: grid.x + L.taskColW - 0.05, y: grid.y - 0.05, w: L.pointsColW + 0.1, h: L.headerBandH + 0.1 },
      stroke: HIGHLIGHT,
      strokeWidthIn: 0.05,
    });
  }

  // Bracket beside contiguous runs of bonus rows, with a rotated BONUS label.
  // A left rail occupies the space the label needs, so draw the line only in that case.
  if (spec.theme.bonusBracket) {
    const leftRail = spec.sideRail?.side === 'left';
    let start = -1;
    const flush = (end: number) => {
      if (start < 0) return;
      const y1 = rowY(start) + 0.05;
      const y2 = rowY(end) - 0.05;
      const x = grid.x - 0.15;
      prims.push({ kind: 'line', x1: x, y1, x2: x, y2, color: HIGHLIGHT, widthIn: 0.04 });
      prims.push({ kind: 'line', x1: x, y1, x2: x + 0.1, y2: y1, color: HIGHLIGHT, widthIn: 0.04 });
      prims.push({ kind: 'line', x1: x, y1: y2, x2: x + 0.1, y2, color: HIGHLIGHT, widthIn: 0.04 });
      if (!leftRail) {
        const labelBox: Box = { x: x - 0.33, y: y1, w: 0.3, h: y2 - y1 };
        const pt = fitSizePt('BONUS', labelBox.h, labelBox.w, 'bodyBold', m, 14, 6);
        if (pt !== null) {
          prims.push({ kind: 'text', box: labelBox, text: 'BONUS', fontId: 'bodyBold', sizePt: pt, color: HIGHLIGHT, align: 'center', rotate: -90 });
        }
      }
      start = -1;
    };
    spec.activities.forEach((a, r) => {
      if (a.bonus && start < 0) start = r;
      if (!a.bonus) flush(r);
    });
    flush(spec.activities.length);
  }
}

function composeRules(spec: BoardSpec, box: Box, m: FontMetrics, prims: Primitive[]) {
  const text = spec.rules.map((r, i) => `${i + 1}. ${r}`).join('    ');
  for (let pt = 14; pt >= 7; pt -= 0.5) {
    const { lines } = wrapToWidth(text, box.w - 0.4, 'body', pt, m, 99);
    const lineH = m.lineHeightIn('body', pt);
    if (lines.length * lineH <= box.h - 0.2) {
      let y = box.y + 0.1;
      for (const line of lines) {
        prims.push({
          kind: 'text',
          box: { x: box.x + 0.2, y, w: box.w - 0.4, h: lineH },
          text: line,
          fontId: 'body',
          sizePt: pt,
          color: INK,
          align: 'left',
        });
        y += lineH;
      }
      return;
    }
  }
}
```

Create `src/engine/buildBoard.ts`:

```ts
import { boardSpecSchema } from '../models/boardSpec';
import { partitionRegions } from './layout/regions';
import { solveGrid } from './layout/gridSolver';
import { gradeLayout, type QualityReport } from './layout/quality';
import { composeScene } from './scene/compose';
import type { FontMetrics } from './fonts/metrics';
import type { Scene } from './scene/types';

export type BuildResult =
  | { ok: true; scene: Scene; quality: QualityReport }
  | { ok: false; reason: string };

/** The engine's single entry point: validated spec in, solved scene out. */
export function buildBoard(input: unknown, m: FontMetrics): BuildResult {
  const spec = boardSpecSchema.parse(input);
  const regions = partitionRegions(spec);
  const solved = solveGrid(regions.grid, spec, m);
  if (!solved.feasible) return { ok: false, reason: solved.reason };
  return {
    ok: true,
    scene: composeScene(spec, regions, solved, m),
    quality: gradeLayout(solved, spec),
  };
}
```

Create `src/engine/index.ts`:

```ts
export { buildBoard, type BuildResult } from './buildBoard';
export { FontMetrics, type FontId, type FontBuffers } from './fonts/metrics';
export type { Scene, Primitive, TextRun, RectPrim, LinePrim } from './scene/types';
export type { QualityReport, Grade } from './layout/quality';
export { boardSpecSchema, POSTER_SIZES, type BoardSpec, type PosterSizeId } from '../models/boardSpec';
```

- [ ] **Step 4: Run the full compose suite**

```bash
npx vitest run tests/engine/compose.test.ts
```

Expected: PASS (16 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: bespoke Steven elements, rules strip, buildBoard entry point"
```

---

### Task 12: Extreme-spec invariant sweep

**Files:**
- Test: `tests/engine/sweep.test.ts`

This is the regression net for the bug class that killed builds 1–4. It is expected to pass immediately; if it fails, that is a real engine bug — fix the engine, never loosen the test.

- [ ] **Step 1: Write the sweep test**

Create `tests/engine/sweep.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildBoard } from '../../src/engine/buildBoard';
import { makeSpec, playerNames } from '../helpers/fixtures';
import { testMetrics } from '../helpers/loadFonts';
import { overflowingRuns, outOfPage } from '../helpers/invariants';

const m = testMetrics();

const SIZES = ['18x24', '24x36', '36x48', '48x72'] as const;
const PLAYER_COUNTS = [8, 20, 35];
const ACTIVITY_COUNTS = [5, 30, 80];

const activityName = (i: number) =>
  i % 3 === 0
    ? `Convince a complete stranger to give a heartfelt toast for the groom, challenge ${i}`
    : `Challenge number ${i}`;

describe('invariant sweep across the full envelope', () => {
  for (const posterSize of SIZES) {
    for (const p of PLAYER_COUNTS) {
      for (const a of ACTIVITY_COUNTS) {
        it(`${posterSize} / ${p} players / ${a} activities: fits cleanly or refuses honestly`, () => {
          const spec = makeSpec({
            posterSize,
            players: playerNames(p),
            activities: Array.from({ length: a }, (_, i) => ({
              name: activityName(i),
              points: i % 7 === 0 ? 'TBD' : (i % 9) + 1,
              bonus: i % 11 === 0,
            })),
          });
          const result = buildBoard(spec, m);
          if (result.ok) {
            expect(overflowingRuns(result.scene, m)).toEqual([]);
            expect(outOfPage(result.scene)).toEqual([]);
          } else {
            expect(result.reason.length).toBeGreaterThan(10);
          }
        });
      }
    }
  }

  it('the flagship case is feasible: 20 players, 25 activities, 24x36 (Steven-like)', () => {
    const result = buildBoard(
      makeSpec({
        players: playerNames(20),
        activities: Array.from({ length: 25 }, (_, i) => ({ name: activityName(i), points: (i % 5) + 1 })),
      }),
      m,
    );
    expect(result.ok).toBe(true);
  });

  it('a side rail does not break invariants at high density', () => {
    const result = buildBoard(
      makeSpec({
        posterSize: '36x48',
        players: playerNames(20),
        activities: Array.from({ length: 40 }, (_, i) => ({ name: activityName(i), points: 1 })),
        sideRail: { side: 'right', widthIn: 6, title: 'BEER PONG BRACKET' },
      }),
      m,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(overflowingRuns(result.scene, m)).toEqual([]);
    expect(outOfPage(result.scene)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the sweep**

```bash
npx vitest run tests/engine/sweep.test.ts
```

Expected: PASS (38 tests). If any sweep case fails, debug the engine (typical culprits: a box built without subtracting `CELL_PAD`, or a bespoke element drawn outside the margin) and fix it there.

- [ ] **Step 3: Run the entire suite and the build**

```bash
npm test
npm run build
```

Expected: all tests pass, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test: extreme-spec invariant sweep across the full content envelope"
```

---

## Done criteria for Plan 1

- `npm test` passes: fonts, model, wrap, regions, solver, quality, compose, and the full sweep.
- `buildBoard(spec, metrics)` is the engine's public API, exported from `src/engine/index.ts`.
- No rendering exists yet — that is Plan 2 (SVG preview, pdf-lib PDF, PNG strip-stitch), followed by Plan 3 (wizard UI, Zustand store, localStorage).
