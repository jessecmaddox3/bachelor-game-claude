import { FontMetrics, type FontBuffers } from '../engine';
import archivoUrl from '../assets/fonts/ArchivoBlack-Regular.ttf?url';
import latoUrl from '../assets/fonts/Lato-Regular.ttf?url';
import latoBoldUrl from '../assets/fonts/Lato-Bold.ttf?url';

export interface AppFonts {
  metrics: FontMetrics;
  buffers: FontBuffers;
}

/**
 * Fetch the bundled TTFs once: register them as document fonts (families MUST
 * match svg.ts's FAMILY/WEIGHT maps exactly — 'Archivo Black' 400, 'Lato'
 * 400/700 — or the in-DOM preview silently falls back while textLength still
 * pins measured widths) and build the shared FontMetrics from the same bytes.
 */
export async function loadAppFonts(): Promise<AppFonts> {
  const [display, body, bodyBold] = await Promise.all(
    [archivoUrl, latoUrl, latoBoldUrl].map(async (u) => (await fetch(u)).arrayBuffer()),
  );
  const buffers: FontBuffers = { display: display!, body: body!, bodyBold: bodyBold! };
  const faces = [
    new FontFace('Archivo Black', buffers.display, { weight: '400' }),
    new FontFace('Lato', buffers.body, { weight: '400' }),
    new FontFace('Lato', buffers.bodyBold, { weight: '700' }),
  ];
  await Promise.all(faces.map((f) => f.load()));
  for (const f of faces) document.fonts.add(f);
  return { metrics: new FontMetrics(buffers), buffers };
}
