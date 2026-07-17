import { describe, it, expect } from 'vitest';
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { renderSvg } from '../../src/engine/render/svg';
import { renderPdf } from '../../src/engine/render/pdf';
import { buildBoard } from '../../src/engine/buildBoard';
import { makeSpec, playerNames } from '../helpers/fixtures';
import { testMetrics } from '../helpers/loadFonts';

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

/** Decode a PNG buffer's pixel dimensions from its IHDR header (big-endian u32s at bytes 16-23). */
function pngDimensions(png: Buffer): { width: number; height: number } {
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
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

    // PNG content sanity beyond byteLength: read the pixel dimensions straight
    // from the IHDR header and confirm the fitTo width and 3:2 aspect held.
    const dims = pngDimensions(png);
    expect(dims.width).toBe(1200);
    expect(dims.height).toBe(1800);

    const pdf = await renderPdf(result.scene, m, buffers());
    // The written PDF must be loadable, not just nonempty.
    const loaded = await PDFDocument.load(pdf);
    expect(loaded.getPageCount()).toBe(1);

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
