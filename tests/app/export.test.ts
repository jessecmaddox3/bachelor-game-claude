import { describe, it, expect } from 'vitest';
import { exportFilename } from '../../src/app/export';

describe('exportFilename', () => {
  it('builds sane filenames from the honoree and size', () => {
    expect(exportFilename('Steven Victor Watts', '24x36', 'pdf', 300)).toBe('Steven-Victor-Watts-24x36.pdf');
    expect(exportFilename('Steven Victor Watts', '24x36', 'svg')).toBe('Steven-Victor-Watts-24x36.svg');
    expect(exportFilename('Kyle', '48x72', 'png', 227)).toBe('Kyle-48x72-227dpi.png');
  });

  it('strips filesystem-hostile characters', () => {
    expect(exportFilename('A/B\\C:D', '18x24', 'pdf', 300)).toBe('A-B-C-D-18x24.pdf');
  });

  it('uses the board title when a new board has no legacy honoree', () => {
    expect(exportFilename('', '24x36', 'svg', 300, 'Kids Weekend')).toBe('Kids-Weekend-24x36.svg');
  });
});

describe('lazy pdf renderer import', () => {
  it('resolves the dynamic import path used by exportPdf', async () => {
    // exportPdf loads the pdf renderer via dynamic import (code-splitting);
    // assert the same specifier resolves and exposes renderPdf.
    const mod = await import('../../src/engine/render/pdf');
    expect(typeof mod.renderPdf).toBe('function');
  });
});
