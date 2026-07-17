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
  // esc() on colors: theme.rowTint is an unconstrained user string that lands
  // in fill — escaping keeps it from breaking out of the attribute.
  attrs.push(`fill="${esc(p.fill ?? 'none')}"`);
  if (p.stroke) attrs.push(`stroke="${esc(p.stroke)}"`, `stroke-width="${n(p.strokeWidthIn ?? 0.01)}"`);
  return `<rect ${attrs.join(' ')}/>`;
}

function line(p: LinePrim): string {
  return `<line x1="${n(p.x1)}" y1="${n(p.y1)}" x2="${n(p.x2)}" y2="${n(p.y2)}" stroke="${esc(p.color)}" stroke-width="${n(p.widthIn)}"/>`;
}

function text(t: TextRun, m: FontMetrics): string {
  const pl = placeText(t, m);
  const attrs = [
    `x="${n(pl.x)}"`,
    `y="${n(pl.y)}"`,
    `font-family="${FAMILY[t.fontId]}"`,
    `font-weight="${WEIGHT[t.fontId]}"`,
    `font-size="${n(t.sizePt / PT_PER_IN)}"`,
    `fill="${esc(t.color)}"`,
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
