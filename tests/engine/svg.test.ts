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

  it('b64 browser fallback matches the Buffer path (embedded fonts identical)', () => {
    const buffers = fontBuffers();
    const withBuffer = svgFor({}, { embedFonts: buffers });
    const B = globalThis.Buffer;
    // @ts-expect-error simulating a browser environment without Buffer
    delete globalThis.Buffer;
    // btoa exists in Node >= 16 on globalThis; the fallback path needs it
    try {
      const withoutBuffer = svgFor({}, { embedFonts: buffers });
      expect(withoutBuffer).toBe(withBuffer);
    } finally {
      globalThis.Buffer = B;
    }
  });

  it('draws rects and lines with stroke widths in inches', () => {
    const svg = svgFor();
    expect(svg).toMatch(/<rect [^>]*fill="#FFFFFF"/); // page background
    expect(svg).toMatch(/<line [^>]*stroke-width="0.015"/); // grid lines
  });
});
