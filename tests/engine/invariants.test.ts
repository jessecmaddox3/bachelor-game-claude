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
