export { buildBoard, type BuildResult } from './buildBoard';
export { FontMetrics, type FontId, type FontBuffers } from './fonts/metrics';
export type { Scene, Primitive, TextRun, RectPrim, LinePrim } from './scene/types';
export type { QualityReport, Grade } from './layout/quality';
export type { Box } from './geometry';
export { PT_PER_IN } from './geometry';
export { boardSpecSchema, POSTER_SIZES, type BoardSpec, type PosterSizeId } from '../models/boardSpec';
export { renderSvg, type SvgOptions } from './render/svg';
// renderPdf is deliberately NOT re-exported here: pdf-lib/@pdf-lib/fontkit lack
// `sideEffects` annotations, so a static re-export pins ~1.1MB into the main
// chunk even when unused. Import from './render/pdf' directly (the app loads it
// lazily in src/app/export.ts so vite splits it into its own chunk).
export { planPngScale, rasterizePng, MAX_DIM_PX, MAX_AREA_PX, type PngPlan } from './render/png';
export { placeText, type Placement } from './render/place';
