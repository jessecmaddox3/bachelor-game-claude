import { boardSpecSchema, type BoardSpec } from '../models/boardSpec';
import { solveGrid } from './layout/gridSolver';
import { planPortrait } from './layout/portraitPlan';
import { gradeLandscapeRules, gradeLayout, type QualityReport } from './layout/quality';
import { composeScene } from './scene/compose';
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
    // The landscape layout is dimensioned for a single 60x48 page; any other
    // size would silently render at the wrong scale, so refuse it honestly.
    if (spec.posterSize !== '60x48') {
      return {
        ok: false,
        reason: `The Landscape / Brackets template only fits a 60"x48" poster; the selected ${spec.posterSize} size cannot render it. Switch to 60x48.`,
      };
    }
    const landscapeSpec: BoardSpec = spec.includeRules
      ? spec
      : { ...spec, rulesContent: '', rules: [], footnote: undefined };
    const composed = composeLandscapeBrackets(landscapeSpec, m);
    if (!composed) return { ok: false, reason: 'Some landscape content cannot fit legibly. Shorten long titles, names, activities, or rules.' };
    return {
      ok: true,
      scene: composed.scene,
      quality: gradeLandscapeRules(composed.rulesPt),
    };
  }
  const portrait = planPortrait(spec, m);
  if (!portrait.ok) return { ok: false, reason: portrait.reason };
  const solved = solveGrid(portrait.regions.grid, spec, m);
  if (!solved.feasible) return { ok: false, reason: solved.reason };
  return {
    ok: true,
    scene: composeScene(spec, portrait.regions, solved, m, portrait.rulesPlan, portrait.compactHeader),
    quality: gradeLayout(solved, spec),
  };
}
