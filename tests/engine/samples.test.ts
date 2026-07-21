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
import { createJesse2017Draft } from '../../src/content/occasions';
import { toBoardSpec } from '../../src/store/toBoardSpec';

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
  landscape: ab('Montserrat-Regular.ttf'),
  landscapeBold: ab('Montserrat-Bold.ttf'),
});

function stevenLike() {
  return makeSpec({
    title: 'THE BACHELOR WEEKEND OF',
    honoree: 'Steven Victor Watts',
    subtitle: 'JANUARY 12 - 15TH, IN THE YEAR OF OUR LORD, 2024',
    players: playerNames(18),
    activities: [
      { name: 'Go to sleep before 7pm', points: 3 },
      { name: 'Go to sleep after 2:30am', points: 4 },
      { name: 'Shotgun a beer', points: 1, maxPoints: 5 },
      { name: 'Water boy', points: 2 },
      { name: 'Cook something of quality', points: 2 },
      { name: '100 pushups in 30 minutes', points: 2 },
      { name: 'Ice bath', points: 2 },
      { name: 'Dont sleep in a bed', points: 3 },
      { name: 'Meal cleanup', points: 2 },
      { name: 'Bleed (involuntary)', points: 3 },
      { name: 'Beer pong tournament', points: { min: 1, max: 6 }, bonus: true },
      { name: 'Buffalo someone else', points: 1, maxPoints: 2 },
      { name: 'Win a board game', points: 2 },
      { name: 'Do 2 shots in a row', points: 2 },
      { name: 'Wear handcuffs for 30 minutes', points: 2 },
      { name: 'Eat a (really hot) pepper', points: 2 },
      { name: 'Make indoor bball shot from 30 ft', points: 2 },
      { name: 'Coin race', points: 1 },
      { name: 'Beer funnel', points: 2 },
      { name: 'Karaoke', points: 1 },
      { name: 'Hula hoop for 10 seconds', points: 1 },
      { name: 'Hot ones challenge: try all 10', points: 3 },
      { name: 'Call someone on a banned word', points: 1, maxPoints: 3 },
    ],
    writeInRows: 2,
    honoreeBonusRow: true,
    cornerBoxes: ['GRAND CHAMPION', 'THE LOSER OF IT ALL'],
    rules: [
      { heading: 'BUFFALO', text: 'If someone is drinking with their right hand, call Buffalo and they have to chug it.' },
      { heading: 'WATER BOY', text: 'Go around offering water to every person to ensure they are hydrated.' },
      { heading: 'COIN RACE', text: 'Spin a coin on a table, then start chugging. Finish before the coin falls to win.' },
      { heading: 'ICE BATH', text: 'Sit in the ice bath for one minute. Emerge with your entire body wet.' },
    ],
    footnote: 'Speaking a banned word means you must finish your drink.',
    theme: {
      titleColor: '#45C0C8',
      accentColor: '#3A6BC7',
      activityColor: '#3A6BC7',
      highlightColor: '#141414',
      pointsColTint: '#D8E9F5',
      maxPointsColTint: '#E8E8E8',
      cornerLabel: 'THE GAME',
      cornerSubLabel: 'ACTIVITIES',
      allCaps: true,
    },
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

  it('rasterizes the Jesse 2017 landscape preset and writes a review sample', async () => {
    const parsed = toBoardSpec(createJesse2017Draft());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const result = buildBoard(parsed.spec, m);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const svg = renderSvg(result.scene, m, { embedFonts: buffers() });
    const png = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
      font: {
        fontFiles: [
          resolve(fontsDir, 'ArchivoBlack-Regular.ttf'),
          resolve(fontsDir, 'Lato-Regular.ttf'),
          resolve(fontsDir, 'Lato-Bold.ttf'),
        ],
        loadSystemFonts: false,
      },
    }).render().asPng();
    expect(pngDimensions(png)).toEqual({ width: 1200, height: 960 });
    expect(png.byteLength).toBeGreaterThan(30_000);

    const pdf = await renderPdf(result.scene, m, buffers());
    expect((await PDFDocument.load(pdf)).getPageCount()).toBe(1);
    mkdirSync(samplesDir, { recursive: true });
    writeFileSync(resolve(samplesDir, 'jesse-2017-landscape.svg'), svg);
    writeFileSync(resolve(samplesDir, 'jesse-2017-landscape.png'), png);
    writeFileSync(resolve(samplesDir, 'jesse-2017-landscape.pdf'), pdf);
  }, 60_000);
});
