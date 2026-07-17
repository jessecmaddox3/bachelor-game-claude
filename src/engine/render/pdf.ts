import { PDFDocument, PDFFont, PDFPage, degrees, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { Scene, Primitive } from '../scene/types';
import type { FontMetrics, FontBuffers, FontId } from '../fonts/metrics';
import { PT_PER_IN } from '../geometry';
import { placeText } from './place';

function color(hex: string) {
  return rgb(
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  );
}

/**
 * Render a Scene to a vector PDF with the three fonts embedded (subset).
 * pdf-lib draws plain advance widths (no kerning), which is exactly what
 * FontMetrics measures — so the PDF can never disagree with the layout.
 */
export async function renderPdf(scene: Scene, m: FontMetrics, buffers: FontBuffers): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fonts: Record<FontId, PDFFont> = {
    display: await doc.embedFont(buffers.display, { subset: true }),
    body: await doc.embedFont(buffers.body, { subset: true }),
    bodyBold: await doc.embedFont(buffers.bodyBold, { subset: true }),
  };
  const page = doc.addPage([scene.widthIn * PT_PER_IN, scene.heightIn * PT_PER_IN]);
  const X = (x: number) => x * PT_PER_IN;
  const Y = (y: number) => (scene.heightIn - y) * PT_PER_IN; // PDF origin is bottom-left

  for (const p of scene.primitives) drawPrim(p, page, fonts, m);

  function drawPrim(p: Primitive, pg: PDFPage, f: Record<FontId, PDFFont>, metrics: FontMetrics) {
    if (p.kind === 'rect') {
      // pdf-lib defaults to a black FILL when neither color nor borderColor is
      // given (verified in PDFPage.drawRectangle), but every rect the composer
      // emits has fill or stroke, so the conditional spreads never leave both out.
      // Strokes are centered on the path (standard PDF), matching the RectPrim
      // contract — no inset adjustment here.
      pg.drawRectangle({
        x: X(p.box.x),
        y: Y(p.box.y + p.box.h),
        width: p.box.w * PT_PER_IN,
        height: p.box.h * PT_PER_IN,
        ...(p.fill ? { color: color(p.fill) } : {}),
        ...(p.stroke
          ? { borderColor: color(p.stroke), borderWidth: (p.strokeWidthIn ?? 0.01) * PT_PER_IN }
          : {}),
      });
    } else if (p.kind === 'line') {
      pg.drawLine({
        start: { x: X(p.x1), y: Y(p.y1) },
        end: { x: X(p.x2), y: Y(p.y2) },
        thickness: p.widthIn * PT_PER_IN,
        color: color(p.color),
      });
    } else {
      const pl = placeText(p, metrics);
      pg.drawText(p.text, {
        x: X(pl.x),
        y: Y(pl.y),
        size: p.sizePt,
        font: f[p.fontId],
        color: color(p.color),
        // Scene -90 (clockwise, y-down page) = PDF +90 (counterclockwise, y-up)
        rotate: degrees(pl.rotate === -90 ? 90 : 0),
      });
    }
  }

  return doc.save();
}
