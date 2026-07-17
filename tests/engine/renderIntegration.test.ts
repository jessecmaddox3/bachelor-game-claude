import { describe, it, expect } from 'vitest';
import { buildBoard, renderSvg, planPngScale } from '../../src/engine';
import { renderPdf } from '../../src/engine/render/pdf';
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
