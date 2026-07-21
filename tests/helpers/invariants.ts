import type { Scene, TextRun, Primitive } from '../../src/engine/scene/types';
import type { FontMetrics } from '../../src/engine/fonts/metrics';

const EPS = 0.01; // inches of forgiveness for float noise

/** Text runs whose measured width exceeds their box (the build-1-through-4 bug class). */
export function overflowingRuns(scene: Scene, m: FontMetrics): TextRun[] {
  return scene.primitives.filter((p): p is TextRun => p.kind === 'text').filter((t) => {
    const w = m.widthIn(t.text, t.fontId, t.sizePt);
    if (t.rotate === -90) return w > t.box.h + EPS;
    if (t.rotate === -45) {
      const lineH = m.lineHeightIn(t.fontId, t.sizePt);
      const extent = Math.SQRT1_2 * (w + lineH);
      return extent > t.box.w + EPS || extent > t.box.h + EPS;
    }
    return w > t.box.w + EPS;
  });
}

/** Any primitive whose extent escapes the page bounds. Assumes non-negative box dimensions (the layout engine never produces negative w/h) and ignores stroke overhang per the RectPrim contract. */
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
