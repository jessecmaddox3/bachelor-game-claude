import { boardSpecSchema, type BoardSpec } from '../models/boardSpec';
import { partitionRegions } from './layout/regions';
import { solveGrid } from './layout/gridSolver';
import { gradeLayout, type QualityReport } from './layout/quality';
import { composeScene } from './scene/compose';
import type { FontMetrics } from './fonts/metrics';
import type { Scene } from './scene/types';

export type BuildResult =
  | { ok: true; scene: Scene; quality: QualityReport }
  | { ok: false; reason: string };

/**
 * The engine's single entry point: validated spec in, solved scene out.
 * Input must satisfy boardSpecSchema; throws ZodError otherwise (the wizard
 * owns validation). Infeasibility is returned as {ok:false}, never thrown.
 */
export function buildBoard(input: unknown, m: FontMetrics): BuildResult {
  const parsed = boardSpecSchema.parse(input);
  // Display-string preprocessing happens BEFORE solving so measurement equals
  // rendering: the solver wraps/measures exactly the strings compose renders.
  const spec: BoardSpec = parsed.theme.allCaps
    ? { ...parsed, activities: parsed.activities.map((a) => ({ ...a, name: a.name.toUpperCase() })) }
    : parsed;
  const regions = partitionRegions(spec);
  const solved = solveGrid(regions.grid, spec, m);
  if (!solved.feasible) return { ok: false, reason: solved.reason };
  return {
    ok: true,
    scene: composeScene(spec, regions, solved, m),
    quality: gradeLayout(solved, spec),
  };
}
