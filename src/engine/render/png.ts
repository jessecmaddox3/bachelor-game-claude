/** Conservative cross-browser canvas ceilings (Chrome/Firefox: 16384px per side, ~268M px area). */
export const MAX_DIM_PX = 16384;
export const MAX_AREA_PX = 268_435_456;

export interface PngPlan {
  dpi: number;
  widthPx: number;
  heightPx: number;
  /** true when dpi < the requested target (oversized poster; UI should tell the user). */
  reduced: boolean;
}

/**
 * Pick the highest integer DPI (≤ target) whose raster fits browser canvas
 * limits. A stitched full-size canvas is impossible past these limits, so
 * oversized posters export at reduced DPI; the PDF is the true-resolution
 * artifact.
 */
export function planPngScale(wIn: number, hIn: number, targetDpi: number): PngPlan {
  const fits = (d: number) => {
    const w = Math.round(wIn * d);
    const h = Math.round(hIn * d);
    return w <= MAX_DIM_PX && h <= MAX_DIM_PX && w * h <= MAX_AREA_PX;
  };
  let dpi = targetDpi;
  while (dpi > 1 && !fits(dpi)) dpi--;
  return { dpi, widthPx: Math.round(wIn * dpi), heightPx: Math.round(hIn * dpi), reduced: dpi < targetDpi };
}

/**
 * Browser-only: rasterize a font-embedded SVG string to a PNG Blob at the
 * planned size. The SVG MUST have been rendered with embedFonts — an <img>
 * loaded from a blob URL cannot see document fonts. Not unit-tested (DOM);
 * exercised by the Plan-3 UI. Node-side visual verification uses resvg.
 */
export async function rasterizePng(svg: string, plan: PngPlan): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = plan.widthPx;
    canvas.height = plan.heightPx;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(img, 0, 0, plan.widthPx, plan.heightPx);
    // Safari exceeds-canvas-limit failures are SILENT (blank canvas, no throw).
    // Probe a small central region: an all-transparent readback on a poster
    // that always paints a white background means the canvas was invalidated.
    const probe = ctx.getImageData(Math.floor(plan.widthPx / 2), Math.floor(plan.heightPx / 2), 4, 4).data;
    if (!probe.some((channel) => channel !== 0)) {
      throw new Error('PNG rasterization failed: the canvas exceeded this browser\'s size limits. Try a smaller poster size, or use the PDF export (unlimited).');
    }
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png');
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
