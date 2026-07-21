import { boardSpecSchema, type BoardSpec } from '../models/boardSpec';
import { partitionRegions } from './layout/regions';
import { solveGrid } from './layout/gridSolver';
import { gradeLayout, type QualityReport } from './layout/quality';
import { composeScene, planRules, type RulesPlan } from './scene/compose';
import type { FontMetrics } from './fonts/metrics';
import type { Scene } from './scene/types';
import { composeLandscapeBrackets } from './scene/composeLandscapeBrackets';

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
  if (spec.template === 'landscapeBrackets') {
    const scene = composeLandscapeBrackets(spec, m);
    if (!scene) return { ok: false, reason: 'Some landscape content cannot fit legibly. Shorten long titles, names, activities, or rules.' };
    return {
      ok: true,
      scene,
      quality: { grade: 'good', advice: ['Landscape / Brackets template loaded.'], bodyPt: 7.2 },
    };
  }
  const regions = partitionRegions(spec);
  let rulesPlan: RulesPlan | undefined;
  if (regions.rules) {
    const planned = planRules(spec, regions.rules, m);
    if (!planned) {
      return {
        ok: false,
        reason: `The rules do not fit legibly on a ${spec.posterSize} poster. Choose a larger size or shorten the rules.`,
      };
    }
    rulesPlan = planned;
  }
  const solved = solveGrid(regions.grid, spec, m);
  if (!solved.feasible) return { ok: false, reason: solved.reason };
  return {
    ok: true,
    scene: composeScene(spec, regions, solved, m, rulesPlan),
    quality: gradeLayout(solved, spec),
  };
}
