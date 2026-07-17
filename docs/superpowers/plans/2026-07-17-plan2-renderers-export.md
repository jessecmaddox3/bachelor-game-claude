# Plan 2 of 3: Renderers and Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Plan-1 engine's `Scene` into real artifacts: an SVG (the future live preview), a vector PDF with embedded fonts (the print-quality export), and a 300 DPI PNG plan (browser raster export).

**Architecture:** One shared placement module (`place.ts`) decides where every text baseline goes, so all renderers agree by construction. `renderSvg` produces a self-contained SVG string (fonts optionally embedded as data URIs). `renderPdf` draws the same Scene into pdf-lib with the same three fonts embedded (subset). PNG export is split into a pure, tested DPI/size planner and a thin browser-only rasterizer. Node-side visual verification uses @resvg/resvg-js to rasterize sample posters.

**Tech Stack:** TypeScript, pdf-lib + @pdf-lib/fontkit (runtime), @resvg/resvg-js (dev-only), Vitest. Spec: `docs/superpowers/specs/2026-07-15-board-rebuild-design.md`. Builds on the Plan-1 engine (92/92 tests green at `940bc7a`).

**Model note:** Task 1 is mechanical. Tasks 2-7 are geometry-critical — run on **Fable 5**.

## Spec deviations (controller-approved)

1. **PNG strip-stitching is replaced by auto-scaled DPI.** The spec said "render in horizontal strips and stitch" for oversized posters, but a stitched 48x72 @ 300 DPI canvas (14,400 x 21,600 = 311M px) exceeds the browser canvas area limit (~268M px) — there is nowhere legal to stitch strips client-side. Instead, `planPngScale` picks the highest integer DPI whose pixel dims and area fit browser limits (300 DPI for 18x24/24x36/36x48; ~200 DPI for 48x72) and reports `reduced: true` so the UI can tell the user. The PDF is the true-resolution print artifact at every size.
3. **SVG snapshot tests replaced by structural assertions + visual smoke.** The spec's testing section called for SVG output snapshots; this plan substitutes structural assertions (element counts, textLength pinning, dimensions) plus resvg rasterization with human-verified sample artifacts — less brittle than byte snapshots and verifies actual visual output rather than markup stability.
2. **FontMetrics switches to kerning-off measurement.** pdf-lib draws text with plain advance widths (no kerning), so measuring WITH kerning would make the PDF render slightly wider than measured. Kerning-off makes measurement exactly equal PDF output; the SVG preview is forced to the measured width via `textLength` (a few-thousandths-of-an-inch spacing correction, not a squish). Widths become additive, slightly larger (safer) than before.

## Conventions

- Scene coordinates are inches, top-left origin. SVG uses `viewBox="0 0 W H"` in inches with `width="{W}in"`, so 1 SVG user unit = 1 inch; font-size in SVG = `sizePt / 72` (inches). PDF uses points (inches x 72), bottom-left origin, y-up: `pdfX = x*72`, `pdfY = (pageH - y)*72`.
- Vertical placement rule (resolves the Plan-1 review note): a TextRun's single line is **vertically centered** within `box.h` (horizontally centered within `box.w` for rotated runs). `placeText` is the only place this rule lives.
- Rotated (-90) runs read bottom-to-top. SVG: `transform="rotate(-90 x y)"` about the baseline start. PDF: `rotate: degrees(90)` (PDF is y-up, so the sign flips).

---

## File structure

```
src/engine/render/place.ts     shared baseline/rotation/alignment math (the WYSIWYG keystone)
src/engine/render/svg.ts       renderSvg(scene, m, opts) -> string; optional data-URI @font-face
src/engine/render/pdf.ts       renderPdf(scene, m, buffers) -> Promise<Uint8Array>
src/engine/render/png.ts       planPngScale (pure, tested) + rasterizePng (browser-only glue)
tests/engine/place.test.ts
tests/engine/svg.test.ts
tests/engine/pdf.test.ts
tests/engine/png.test.ts
tests/engine/samples.test.ts   resvg visual smoke + writes samples/*.{svg,pdf,png} (gitignored)
```

---

### Task 1: Dependencies and kerning-off measurement

**Files:**
- Modify: `package.json`, `.gitignore`, `src/engine/fonts/metrics.ts`

- [ ] **Step 1: Install dependencies**

```bash
cd /Users/jesse/claude/bachelor-game-claude
npm install pdf-lib @pdf-lib/fontkit
npm install -D @resvg/resvg-js
```

- [ ] **Step 2: Gitignore the samples output dir**

Append to `.gitignore`:

```
samples/
```

- [ ] **Step 3: Switch measurement to kerning-off**

In `src/engine/fonts/metrics.ts`, change `widthIn` to:

```ts
  widthIn(text: string, fontId: FontId, sizePt: number): number {
    return this.fonts[fontId].getAdvanceWidth(text, sizePt, { kerning: false }) / PT_PER_IN;
  }
```

Update the class doc comment: remove the kerning-non-additivity warning and replace with: "Measurement is kerning-OFF (plain advance widths). This exactly matches what pdf-lib draws (it applies no kerning), so the PDF can never render wider than measured; the SVG preview is forced to the measured width via textLength. Widths are additive, and slightly wider than kerned rendering — the safe direction." Keep the construct-once note and the lineGap note on `lineHeightIn`.

- [ ] **Step 4: Run the full suite**

```bash
npx vitest run
```

Expected: 92/92 pass. Widths grow slightly (kerning usually tightens), so solved layouts may pick the same or a 0.5pt-smaller rung — all tests are invariant-based and re-measure with the same metrics, so they must stay green. If any test fails, STOP and report the failure — do not adjust assertions.

- [ ] **Step 5: Build check and commit**

```bash
npm run build
git add -A
git commit -m "feat: pdf/resvg deps; kerning-off measurement to match PDF advances"
```

---

### Task 2: Shared text placement (`place.ts`)

**Files:**
- Create: `src/engine/render/place.ts`
- Test: `tests/engine/place.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/engine/place.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { placeText } from '../../src/engine/render/place';
import { testMetrics } from '../helpers/loadFonts';
import type { TextRun } from '../../src/engine/scene/types';

const m = testMetrics();

const run = (over: Partial<TextRun> = {}): TextRun => ({
  kind: 'text',
  box: { x: 1, y: 2, w: 4, h: 1 },
  text: 'Steven',
  fontId: 'body',
  sizePt: 24,
  color: '#000',
  align: 'left',
  ...over,
});

describe('placeText: horizontal', () => {
  it('centers the line vertically and returns the measured width', () => {
    const t = run();
    const p = placeText(t, m);
    const lineH = m.lineHeightIn('body', 24);
    const ascent = m.ascentIn('body', 24);
    expect(p.rotate).toBe(0);
    expect(p.widthIn).toBeCloseTo(m.widthIn('Steven', 'body', 24), 6);
    expect(p.y).toBeCloseTo(2 + (1 - lineH) / 2 + ascent, 6);
  });

  it('aligns left, center, right', () => {
    const w = m.widthIn('Steven', 'body', 24);
    expect(placeText(run({ align: 'left' }), m).x).toBeCloseTo(1, 6);
    expect(placeText(run({ align: 'center' }), m).x).toBeCloseTo(1 + (4 - w) / 2, 6);
    expect(placeText(run({ align: 'right' }), m).x).toBeCloseTo(1 + 4 - w, 6);
  });
});

describe('placeText: rotated -90', () => {
  const rot = (align: TextRun['align']) =>
    placeText(run({ rotate: -90, align, box: { x: 1, y: 2, w: 0.6, h: 5 } }), m);

  it('centers the line horizontally within box.w', () => {
    const lineH = m.lineHeightIn('body', 24);
    const ascent = m.ascentIn('body', 24);
    const p = rot('left');
    expect(p.rotate).toBe(-90);
    expect(p.x).toBeCloseTo(1 + (0.6 - lineH) / 2 + ascent, 6);
  });

  it('starts at the box bottom for align left, and shifts for center/right', () => {
    const w = m.widthIn('Steven', 'body', 24);
    expect(rot('left').y).toBeCloseTo(2 + 5, 6);
    expect(rot('center').y).toBeCloseTo(2 + 5 - (5 - w) / 2, 6);
    expect(rot('right').y).toBeCloseTo(2 + w, 6);
  });

  it('rotated text stays inside the box extents', () => {
    const p = rot('left');
    const lineH = m.lineHeightIn('body', 24);
    expect(p.x).toBeGreaterThanOrEqual(1);
    expect(p.x).toBeLessThanOrEqual(1 + 0.6);
    expect(p.y - p.widthIn).toBeGreaterThanOrEqual(2 - 0.01);
    expect(lineH).toBeLessThanOrEqual(0.6 + 0.01);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/engine/place.test.ts`
Expected: FAIL — cannot resolve `src/engine/render/place`.

- [ ] **Step 3: Implement**

Create `src/engine/render/place.ts`:

```ts
import type { TextRun } from '../scene/types';
import type { FontMetrics } from '../fonts/metrics';

export interface Placement {
  /** Baseline start point, page inches (top-left origin). */
  x: number;
  y: number;
  /** Rotation about (x, y): 0, or -90 = reads bottom-to-top. */
  rotate: 0 | -90;
  /** Measured advance width in inches (drives SVG textLength). */
  widthIn: number;
}

/**
 * The single source of truth for where a TextRun's baseline starts. Every
 * renderer draws from this, so preview and print agree by construction.
 * Horizontal: the line is vertically centered in box.h; align picks x.
 * Rotated -90: the line is horizontally centered in box.w; align 'left'
 * starts at the box bottom (text reads upward), 'right' ends at the top.
 */
export function placeText(t: TextRun, m: FontMetrics): Placement {
  const w = m.widthIn(t.text, t.fontId, t.sizePt);
  const lineH = m.lineHeightIn(t.fontId, t.sizePt);
  const ascent = m.ascentIn(t.fontId, t.sizePt);

  if (t.rotate === -90) {
    // Rotating -90 about the baseline point maps ascent to page-left, so the
    // glyph column spans [x - ascent, x + (lineH - ascent)]; center it in box.w.
    const x = t.box.x + (t.box.w - lineH) / 2 + ascent;
    const free = t.box.h - w;
    const y =
      t.align === 'center' ? t.box.y + t.box.h - free / 2
      : t.align === 'right' ? t.box.y + w
      : t.box.y + t.box.h;
    return { x, y, rotate: -90, widthIn: w };
  }

  const y = t.box.y + (t.box.h - lineH) / 2 + ascent;
  const x =
    t.align === 'center' ? t.box.x + (t.box.w - w) / 2
    : t.align === 'right' ? t.box.x + t.box.w - w
    : t.box.x;
  return { x, y, rotate: 0, widthIn: w };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/engine/place.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: shared text placement math for all renderers"
```

---

### Task 3: SVG renderer

**Files:**
- Create: `src/engine/render/svg.ts`
- Test: `tests/engine/svg.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/engine/svg.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { renderSvg } from '../../src/engine/render/svg';
import { buildBoard } from '../../src/engine/buildBoard';
import { makeSpec } from '../helpers/fixtures';
import { testMetrics } from '../helpers/loadFonts';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const m = testMetrics();

function svgFor(over: Record<string, unknown> = {}, opts = {}) {
  const result = buildBoard(makeSpec(over), m);
  if (!result.ok) throw new Error('fixture must be feasible');
  return renderSvg(result.scene, m, opts);
}

function fontBuffers() {
  const dir = fileURLToPath(new URL('../../src/assets/fonts', import.meta.url));
  const ab = (n: string) => {
    const b = readFileSync(resolve(dir, n));
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
  };
  return { display: ab('ArchivoBlack-Regular.ttf'), body: ab('Lato-Regular.ttf'), bodyBold: ab('Lato-Bold.ttf') };
}

describe('renderSvg', () => {
  it('emits an inch-based svg at page dimensions', () => {
    const svg = svgFor();
    expect(svg).toContain('width="24in"');
    expect(svg).toContain('height="36in"');
    expect(svg).toContain('viewBox="0 0 24 36"');
  });

  it('renders every text run with textLength pinned to the measured width', () => {
    const svg = svgFor();
    expect(svg).toContain('>BACHELOR<');
    expect(svg).toContain('>Steven<');
    expect(svg).toContain('>TOTAL<');
    const textTags = svg.match(/<text /g) ?? [];
    const pinned = svg.match(/textLength="/g) ?? [];
    expect(pinned.length).toBe(textTags.length);
  });

  it('rotates player names with a transform about the baseline point', () => {
    const svg = svgFor();
    expect(svg).toMatch(/<text [^>]*transform="rotate\(-90 [\d.]+ [\d.]+\)"/);
  });

  it('escapes XML special characters', () => {
    const svg = svgFor({ title: 'BEER & <GAMES>' });
    expect(svg).toContain('BEER &amp; &lt;GAMES&gt;');
    expect(svg).not.toContain('BEER & <GAMES>');
  });

  it('maps font ids to family and weight', () => {
    const svg = svgFor();
    expect(svg).toContain('font-family="Archivo Black"');
    expect(svg).toMatch(/font-family="Lato" font-weight="700"/);
  });

  it('embeds fonts as data URIs only when asked', () => {
    expect(svgFor()).not.toContain('@font-face');
    const embedded = svgFor({}, { embedFonts: fontBuffers() });
    expect((embedded.match(/@font-face/g) ?? []).length).toBe(3);
    expect(embedded).toContain('data:font/ttf;base64,');
  });

  it('draws rects and lines with stroke widths in inches', () => {
    const svg = svgFor();
    expect(svg).toMatch(/<rect [^>]*fill="#FFFFFF"/); // page background
    expect(svg).toMatch(/<line [^>]*stroke-width="0.015"/); // grid lines
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/engine/svg.test.ts`
Expected: FAIL — cannot resolve `src/engine/render/svg`.

- [ ] **Step 3: Implement**

Create `src/engine/render/svg.ts`:

```ts
import type { Scene, Primitive, TextRun, RectPrim, LinePrim } from '../scene/types';
import type { FontMetrics, FontId, FontBuffers } from '../fonts/metrics';
import { PT_PER_IN } from '../geometry';
import { placeText } from './place';

export interface SvgOptions {
  /**
   * Embed the font files as data-URI @font-face rules. Required when the SVG
   * will be rasterized standalone (blob-URL <img> cannot see document fonts);
   * omit for in-DOM preview where the app loads fonts via FontFace/CSS.
   */
  embedFonts?: FontBuffers;
}

const FAMILY: Record<FontId, string> = { display: 'Archivo Black', body: 'Lato', bodyBold: 'Lato' };
const WEIGHT: Record<FontId, number> = { display: 400, body: 400, bodyBold: 700 };

const n = (v: number) => String(Number(v.toFixed(4)));

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function b64(buf: ArrayBuffer): string {
  if (typeof Buffer !== 'undefined') return Buffer.from(buf).toString('base64');
  let s = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
}

function fontFaceDefs(buffers: FontBuffers): string {
  const face = (family: string, weight: number, buf: ArrayBuffer) =>
    `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/ttf;base64,${b64(buf)}) format('truetype');}`;
  return `<defs><style>${face('Archivo Black', 400, buffers.display)}${face('Lato', 400, buffers.body)}${face('Lato', 700, buffers.bodyBold)}</style></defs>`;
}

function rect(p: RectPrim): string {
  const attrs = [`x="${n(p.box.x)}"`, `y="${n(p.box.y)}"`, `width="${n(p.box.w)}"`, `height="${n(p.box.h)}"`];
  attrs.push(`fill="${p.fill ?? 'none'}"`);
  if (p.stroke) attrs.push(`stroke="${p.stroke}"`, `stroke-width="${n(p.strokeWidthIn ?? 0.01)}"`);
  return `<rect ${attrs.join(' ')}/>`;
}

function line(p: LinePrim): string {
  return `<line x1="${n(p.x1)}" y1="${n(p.y1)}" x2="${n(p.x2)}" y2="${n(p.y2)}" stroke="${p.color}" stroke-width="${n(p.widthIn)}"/>`;
}

function text(t: TextRun, m: FontMetrics): string {
  const pl = placeText(t, m);
  const attrs = [
    `x="${n(pl.x)}"`,
    `y="${n(pl.y)}"`,
    `font-family="${FAMILY[t.fontId]}"`,
    `font-weight="${WEIGHT[t.fontId]}"`,
    `font-size="${n(t.sizePt / PT_PER_IN)}"`,
    `fill="${t.color}"`,
    // Pin the rendered width to the measured width: browsers apply kerning,
    // measurement does not (matching the PDF), so this closes the tiny gap.
    `textLength="${n(pl.widthIn)}"`,
    `lengthAdjust="spacing"`,
  ];
  if (pl.rotate === -90) attrs.push(`transform="rotate(-90 ${n(pl.x)} ${n(pl.y)})"`);
  return `<text ${attrs.join(' ')}>${esc(t.text)}</text>`;
}

function prim(p: Primitive, m: FontMetrics): string {
  switch (p.kind) {
    case 'rect': return rect(p);
    case 'line': return line(p);
    case 'text': return text(p, m);
  }
}

/** Render a Scene to a self-contained SVG string. 1 SVG user unit = 1 inch. */
export function renderSvg(scene: Scene, m: FontMetrics, opts: SvgOptions = {}): string {
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${scene.widthIn}in" height="${scene.heightIn}in" viewBox="0 0 ${scene.widthIn} ${scene.heightIn}">`,
  ];
  if (opts.embedFonts) parts.push(fontFaceDefs(opts.embedFonts));
  for (const p of scene.primitives) parts.push(prim(p, m));
  parts.push('</svg>');
  return parts.join('\n');
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/engine/svg.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: SVG renderer with measured textLength and optional font embedding"
```

---

### Task 4: PDF renderer

**Files:**
- Create: `src/engine/render/pdf.ts`
- Test: `tests/engine/pdf.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/engine/pdf.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { renderPdf } from '../../src/engine/render/pdf';
import { buildBoard } from '../../src/engine/buildBoard';
import { makeSpec } from '../helpers/fixtures';
import { testMetrics } from '../helpers/loadFonts';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const m = testMetrics();

function fontBuffers() {
  const dir = fileURLToPath(new URL('../../src/assets/fonts', import.meta.url));
  const ab = (n: string) => {
    const b = readFileSync(resolve(dir, n));
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
  };
  return { display: ab('ArchivoBlack-Regular.ttf'), body: ab('Lato-Regular.ttf'), bodyBold: ab('Lato-Bold.ttf') };
}

async function pdfFor(over: Record<string, unknown> = {}) {
  const result = buildBoard(makeSpec(over), m);
  if (!result.ok) throw new Error('fixture must be feasible');
  return renderPdf(result.scene, m, fontBuffers());
}

describe('renderPdf', () => {
  it('produces a parseable single-page PDF at exact physical size', async () => {
    const bytes = await pdfFor();
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    const page = doc.getPage(0);
    expect(page.getWidth()).toBeCloseTo(24 * 72, 3);
    expect(page.getHeight()).toBeCloseTo(36 * 72, 3);
  });

  it('embeds subset fonts (bytes are font-bearing but not bloated)', async () => {
    const bytes = await pdfFor();
    expect(bytes.byteLength).toBeGreaterThan(20_000);
    expect(bytes.byteLength).toBeLessThan(5_000_000);
  });

  it('handles the largest poster size', async () => {
    const bytes = await pdfFor({ posterSize: '48x72' });
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPage(0).getWidth()).toBeCloseTo(48 * 72, 3);
    expect(doc.getPage(0).getHeight()).toBeCloseTo(72 * 72, 3);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/engine/pdf.test.ts`
Expected: FAIL — cannot resolve `src/engine/render/pdf`.

- [ ] **Step 3: Implement**

Create `src/engine/render/pdf.ts`:

```ts
import { PDFDocument, PDFFont, PDFPage, degrees, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { Scene, Primitive } from '../scene/types';
import type { FontMetrics, FontBuffers, FontId } from '../fonts/metrics';
import { PT_PER_IN } from '../geometry';
import { placeText } from './place';

function color(hex: string) {
  return rgb(
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  );
}

/**
 * Render a Scene to a vector PDF with the three fonts embedded (subset).
 * pdf-lib draws plain advance widths (no kerning), which is exactly what
 * FontMetrics measures — so the PDF can never disagree with the layout.
 */
export async function renderPdf(scene: Scene, m: FontMetrics, buffers: FontBuffers): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fonts: Record<FontId, PDFFont> = {
    display: await doc.embedFont(buffers.display, { subset: true }),
    body: await doc.embedFont(buffers.body, { subset: true }),
    bodyBold: await doc.embedFont(buffers.bodyBold, { subset: true }),
  };
  const page = doc.addPage([scene.widthIn * PT_PER_IN, scene.heightIn * PT_PER_IN]);
  const X = (x: number) => x * PT_PER_IN;
  const Y = (y: number) => (scene.heightIn - y) * PT_PER_IN; // PDF origin is bottom-left

  for (const p of scene.primitives) drawPrim(p, page, fonts, m);

  function drawPrim(p: Primitive, pg: PDFPage, f: Record<FontId, PDFFont>, metrics: FontMetrics) {
    if (p.kind === 'rect') {
      pg.drawRectangle({
        x: X(p.box.x),
        y: Y(p.box.y + p.box.h),
        width: p.box.w * PT_PER_IN,
        height: p.box.h * PT_PER_IN,
        ...(p.fill ? { color: color(p.fill) } : {}),
        ...(p.stroke
          ? { borderColor: color(p.stroke), borderWidth: (p.strokeWidthIn ?? 0.01) * PT_PER_IN }
          : {}),
      });
    } else if (p.kind === 'line') {
      pg.drawLine({
        start: { x: X(p.x1), y: Y(p.y1) },
        end: { x: X(p.x2), y: Y(p.y2) },
        thickness: p.widthIn * PT_PER_IN,
        color: color(p.color),
      });
    } else {
      const pl = placeText(p, metrics);
      pg.drawText(p.text, {
        x: X(pl.x),
        y: Y(pl.y),
        size: p.sizePt,
        font: f[p.fontId],
        color: color(p.color),
        // Scene -90 (clockwise, y-down page) = PDF +90 (counterclockwise, y-up)
        rotate: degrees(pl.rotate === -90 ? 90 : 0),
      });
    }
  }

  return doc.save();
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/engine/pdf.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: vector PDF renderer with subset-embedded fonts"
```

---

### Task 5: PNG planning (pure) and browser rasterizer (thin)

**Files:**
- Create: `src/engine/render/png.ts`
- Test: `tests/engine/png.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/engine/png.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { planPngScale, MAX_DIM_PX, MAX_AREA_PX } from '../../src/engine/render/png';

describe('planPngScale', () => {
  it('keeps 300 DPI for sizes that fit browser limits', () => {
    for (const [w, h] of [[18, 24], [24, 36], [36, 48]] as const) {
      const p = planPngScale(w, h, 300);
      expect(p.dpi).toBe(300);
      expect(p.reduced).toBe(false);
      expect(p.widthPx).toBe(w * 300);
      expect(p.heightPx).toBe(h * 300);
    }
  });

  it('auto-reduces 48x72 to the highest DPI that fits', () => {
    const p = planPngScale(48, 72, 300);
    expect(p.reduced).toBe(true);
    expect(p.dpi).toBeLessThan(300);
    expect(p.widthPx).toBeLessThanOrEqual(MAX_DIM_PX);
    expect(p.heightPx).toBeLessThanOrEqual(MAX_DIM_PX);
    expect(p.widthPx * p.heightPx).toBeLessThanOrEqual(MAX_AREA_PX);
    // maximality: one more DPI would break a limit
    const bigger = p.dpi + 1;
    const bw = Math.round(48 * bigger);
    const bh = Math.round(72 * bigger);
    expect(bw > MAX_DIM_PX || bh > MAX_DIM_PX || bw * bh > MAX_AREA_PX).toBe(true);
  });

  it('still produces a print-worthy DPI for the giant size', () => {
    expect(planPngScale(48, 72, 300).dpi).toBeGreaterThanOrEqual(150);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/engine/png.test.ts`
Expected: FAIL — cannot resolve `src/engine/render/png`.

- [ ] **Step 3: Implement**

Create `src/engine/render/png.ts`:

```ts
/** Conservative cross-browser canvas ceilings (Chrome/Firefox: 16384px per side, ~268M px area). */
export const MAX_DIM_PX = 16384;
export const MAX_AREA_PX = 268_435_456;

export interface PngPlan {
  dpi: number;
  widthPx: number;
  heightPx: number;
  /** true when dpi < the requested target (oversized poster; UI should tell the user). */
  reduced: boolean;
}

/**
 * Pick the highest integer DPI (≤ target) whose raster fits browser canvas
 * limits. A stitched full-size canvas is impossible past these limits, so
 * oversized posters export at reduced DPI; the PDF is the true-resolution
 * artifact.
 */
export function planPngScale(wIn: number, hIn: number, targetDpi: number): PngPlan {
  const fits = (d: number) => {
    const w = Math.round(wIn * d);
    const h = Math.round(hIn * d);
    return w <= MAX_DIM_PX && h <= MAX_DIM_PX && w * h <= MAX_AREA_PX;
  };
  let dpi = targetDpi;
  while (dpi > 1 && !fits(dpi)) dpi--;
  return { dpi, widthPx: Math.round(wIn * dpi), heightPx: Math.round(hIn * dpi), reduced: dpi < targetDpi };
}

/**
 * Browser-only: rasterize a font-embedded SVG string to a PNG Blob at the
 * planned size. The SVG MUST have been rendered with embedFonts — an <img>
 * loaded from a blob URL cannot see document fonts. Not unit-tested (DOM);
 * exercised by the Plan-3 UI. Node-side visual verification uses resvg.
 */
export async function rasterizePng(svg: string, plan: PngPlan): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = plan.widthPx;
    canvas.height = plan.heightPx;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(img, 0, 0, plan.widthPx, plan.heightPx);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png');
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/engine/png.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: PNG scale planning within browser canvas limits + rasterizer"
```

---

### Task 6: Visual smoke test and sample artifacts (resvg)

**Files:**
- Test: `tests/engine/samples.test.ts`

- [ ] **Step 1: Write the test (expected to pass once written — it exercises existing code)**

Create `tests/engine/samples.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { renderSvg } from '../../src/engine/render/svg';
import { renderPdf } from '../../src/engine/render/pdf';
import { buildBoard } from '../../src/engine/buildBoard';
import { makeSpec, playerNames } from '../helpers/fixtures';
import { testMetrics } from '../helpers/loadFonts';
import { readFileSync } from 'node:fs';

const m = testMetrics();
const fontsDir = fileURLToPath(new URL('../../src/assets/fonts', import.meta.url));
const samplesDir = fileURLToPath(new URL('../../samples', import.meta.url));

const ab = (n: string) => {
  const b = readFileSync(resolve(fontsDir, n));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
};
const buffers = () => ({
  display: ab('ArchivoBlack-Regular.ttf'),
  body: ab('Lato-Regular.ttf'),
  bodyBold: ab('Lato-Bold.ttf'),
});

function stevenLike() {
  return makeSpec({
    players: playerNames(20),
    activities: [
      ...Array.from({ length: 22 }, (_, i) => ({
        name: i % 3 === 0 ? `Convince a stranger to toast the groom, round ${i + 1}` : `Challenge number ${i + 1}`,
        points: (i % 5) + 1,
      })),
      { name: 'Beer pong tournament champion', points: 'TBD', bonus: true },
      { name: 'Flip cup finals winner', points: 'TBD', bonus: true },
    ],
  });
}

describe('visual smoke (resvg) + sample artifacts', () => {
  it('rasterizes the Steven-like poster and writes samples', async () => {
    const result = buildBoard(stevenLike(), m);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const svg = renderSvg(result.scene, m, { embedFonts: buffers() });
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
      font: {
        fontFiles: [
          resolve(fontsDir, 'ArchivoBlack-Regular.ttf'),
          resolve(fontsDir, 'Lato-Regular.ttf'),
          resolve(fontsDir, 'Lato-Bold.ttf'),
        ],
        loadSystemFonts: false,
      },
    });
    const png = resvg.render().asPng();

    // 24x36 poster at width 1200 -> height 1800
    const rendered = new Resvg(svg).width; // sanity: parseable
    expect(rendered).toBeGreaterThan(0);
    expect(png.byteLength).toBeGreaterThan(30_000); // a blank render is far smaller

    const pdf = await renderPdf(result.scene, m, buffers());

    mkdirSync(samplesDir, { recursive: true });
    writeFileSync(resolve(samplesDir, 'steven-like.svg'), svg);
    writeFileSync(resolve(samplesDir, 'steven-like.png'), png);
    writeFileSync(resolve(samplesDir, 'steven-like.pdf'), pdf);
  }, 60_000);

  it('rasterizes the degenerate short-content board without blank output', () => {
    const result = buildBoard(
      makeSpec({
        players: ['Al', 'Bo', 'Cy', 'Di', 'Ed', 'Fi', 'Gil', 'Hal'],
        activities: Array.from({ length: 20 }, (_, i) => ({ name: `T${i}`, points: 1 })),
      }),
      m,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const svg = renderSvg(result.scene, m, { embedFonts: buffers() });
    const png = new Resvg(svg, {
      fitTo: { mode: 'width', value: 600 },
      font: { fontFiles: [resolve(fontsDir, 'Lato-Regular.ttf'), resolve(fontsDir, 'Lato-Bold.ttf'), resolve(fontsDir, 'ArchivoBlack-Regular.ttf')], loadSystemFonts: false },
    }).render().asPng();
    expect(png.byteLength).toBeGreaterThan(10_000);
  }, 60_000);
});
```

Note: if `new Resvg(svg).width` is not a valid API in the installed @resvg/resvg-js version, replace that sanity line with rendering and checking `render().width === 1200` — adapt minimally to the actual API and report the adaptation.

- [ ] **Step 2: Run it**

Run: `npx vitest run tests/engine/samples.test.ts`
Expected: PASS (2 tests). `samples/steven-like.{svg,png,pdf}` exist on disk (gitignored).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test: resvg visual smoke and sample poster artifacts"
```

---

### Task 7: Public API, integration test, full verification

**Files:**
- Modify: `src/engine/index.ts`
- Test: `tests/engine/renderIntegration.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/engine/renderIntegration.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildBoard, renderSvg, renderPdf, planPngScale } from '../../src/engine';
import { makeSpec, playerNames } from '../helpers/fixtures';
import { testMetrics } from '../helpers/loadFonts';

const m = testMetrics();

describe('engine public API end to end', () => {
  it('spec -> scene -> svg + pdf plan without touching internals', async () => {
    const result = buildBoard(makeSpec({ players: playerNames(20) }), m);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const svg = renderSvg(result.scene, m);
    expect(svg.startsWith('<svg ')).toBe(true);
    const plan = planPngScale(result.scene.widthIn, result.scene.heightIn, 300);
    expect(plan.dpi).toBe(300);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/engine/renderIntegration.test.ts`
Expected: FAIL — `renderSvg` is not exported from `../../src/engine`.

- [ ] **Step 3: Extend the barrel**

Append to `src/engine/index.ts`:

```ts
export { renderSvg, type SvgOptions } from './render/svg';
export { renderPdf } from './render/pdf';
export { planPngScale, rasterizePng, MAX_DIM_PX, MAX_AREA_PX, type PngPlan } from './render/png';
export { placeText, type Placement } from './render/place';
```

- [ ] **Step 4: Run everything**

```bash
npx vitest run
npm run build
```

Expected: all tests pass (Plan-1's 92 + ~21 new ≈ 113; use the actual count), build succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: export renderers from the engine public API"
```

---

## Done criteria for Plan 2

- `npm test` fully green; `npm run build` succeeds.
- `renderSvg`, `renderPdf`, `planPngScale`, `rasterizePng` exported from `src/engine/index.ts`.
- `samples/steven-like.{svg,png,pdf}` generated locally by the test suite for human eyeball verification.
- No UI code — that is Plan 3 (wizard, preview mounting, export buttons, font loading via FontFace).
