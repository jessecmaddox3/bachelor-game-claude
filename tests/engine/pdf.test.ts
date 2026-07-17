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
    // Fixture-independent proof that all three fonts are genuinely embedded
    // (the byte floor alone is coupled to fixture string lengths). renderPdf's
    // save() packs the FontDescriptor dicts into compressed object streams, so
    // re-serialize without them to make the /FontFile2 keys greppable.
    const flat = await (await PDFDocument.load(bytes)).save({ useObjectStreams: false });
    const raw = Buffer.from(flat).toString('latin1');
    expect((raw.match(/\/FontFile2/g) ?? []).length).toBe(3);
  });

  it('handles the largest poster size', async () => {
    const bytes = await pdfFor({ posterSize: '48x72' });
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPage(0).getWidth()).toBeCloseTo(48 * 72, 3);
    expect(doc.getPage(0).getHeight()).toBeCloseTo(72 * 72, 3);
  });
});
