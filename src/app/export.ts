import { saveAs } from 'file-saver';
import { renderSvg, planPngScale, rasterizePng, type FontMetrics, type FontBuffers, type Scene } from '../engine';

export function exportFilename(honoree: string, size: string, ext: 'pdf' | 'png', dpi: number): string {
  const safe = honoree.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  return ext === 'pdf' ? `${safe}-${size}.pdf` : `${safe}-${size}-${dpi}dpi.png`;
}

export async function exportPdf(scene: Scene, m: FontMetrics, buffers: FontBuffers, honoree: string, size: string): Promise<void> {
  // Lazy import (bypassing the engine barrel) so vite splits pdf-lib (~1.2MB)
  // out of the main chunk; it only loads when the user actually exports a PDF.
  const { renderPdf } = await import('../engine/render/pdf');
  const bytes = await renderPdf(scene, m, buffers);
  saveAs(new Blob([bytes as BlobPart], { type: 'application/pdf' }), exportFilename(honoree, size, 'pdf', 300));
}

/** Returns the effective DPI so the UI can tell the user when it was reduced. */
export async function exportPng(scene: Scene, m: FontMetrics, buffers: FontBuffers, honoree: string, size: string): Promise<number> {
  const plan = planPngScale(scene.widthIn, scene.heightIn, 300);
  const svg = renderSvg(scene, m, { embedFonts: buffers });
  const blob = await rasterizePng(svg, plan);
  saveAs(blob, exportFilename(honoree, size, 'png', plan.dpi));
  return plan.dpi;
}
