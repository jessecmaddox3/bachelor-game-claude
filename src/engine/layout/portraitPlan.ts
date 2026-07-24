import type { BoardSpec } from '../../models/boardSpec';
import type { Box } from '../geometry';
import type { FontMetrics } from '../fonts/metrics';
import { planRules, type RulesPlan } from '../scene/compose';
import { partitionRegions, type Regions } from './regions';

export const COMPACT_HEADER_H = 0.65;
export const LETTER_RULES_MIN_H = 0.75;
export const LETTER_RULES_MAX_H = 2.5;
export const LETTER_RULES_STEP_H = 0.05;
export const LETTER_RULES_TARGET_PT = 8;
export const COMPACT_TITLE_MAX_PT = 28;
export const COMPACT_TITLE_MIN_PT = 12;
export const COMPACT_SECONDARY_MAX_PT = 14;
export const COMPACT_SECONDARY_MIN_PT = 8;
export const COMPACT_HEADLINE_GAP = 0.18;

export interface CompactHeaderPlan {
  titlePt: number;
  secondaryPt?: number;
  secondary: string;
  titleW: number;
  secondaryW: number;
  gapW: number;
}

export type PortraitPlan =
  | {
      ok: true;
      regions: Regions;
      rulesPlan?: RulesPlan;
      compactHeader?: CompactHeaderPlan;
    }
  | {
      ok: false;
      reason: string;
      kind: 'compact-header' | 'rules';
    };

function hasPrintedRules(spec: BoardSpec): boolean {
  return spec.includeRules
    && Boolean(spec.rulesContent.trim() || spec.rules.length > 0 || spec.footnote);
}

function planCompactHeader(
  spec: BoardSpec,
  header: Box,
  metrics: FontMetrics,
): CompactHeaderPlan | undefined {
  const secondary = [spec.honoree, spec.subtitle].filter(Boolean).join(' · ');
  const innerW = header.w * 0.9;
  const innerH = header.h * 0.9;

  for (let titlePt = COMPACT_TITLE_MAX_PT; titlePt >= COMPACT_TITLE_MIN_PT; titlePt -= 0.5) {
    const progress = (titlePt - COMPACT_TITLE_MIN_PT)
      / (COMPACT_TITLE_MAX_PT - COMPACT_TITLE_MIN_PT);
    const secondaryPt = secondary
      ? COMPACT_SECONDARY_MIN_PT
        + progress * (COMPACT_SECONDARY_MAX_PT - COMPACT_SECONDARY_MIN_PT)
      : undefined;
    const titleW = metrics.widthIn(spec.title, 'display', titlePt);
    const secondaryW = secondary && secondaryPt
      ? metrics.widthIn(secondary, 'bodyBold', secondaryPt)
      : 0;
    const gapW = secondary ? COMPACT_HEADLINE_GAP : 0;
    const titleH = metrics.lineHeightIn('display', titlePt);
    const secondaryH = secondaryPt ? metrics.lineHeightIn('bodyBold', secondaryPt) : 0;
    if (
      titleW + gapW + secondaryW <= innerW
      && Math.max(titleH, secondaryH) <= innerH
    ) {
      return { titlePt, secondaryPt, secondary, titleW, secondaryW, gapW };
    }
  }
  return undefined;
}

/**
 * Produces the measured page regions and rules plan consumed by portrait scene
 * composition. Letter rules use only the height required to retain 8pt text.
 */
export function planPortrait(spec: BoardSpec, metrics: FontMetrics): PortraitPlan {
  const usesCompactHeader = spec.posterSize === '8.5x11'
    && spec.letterHeaderStyle === 'compact';
  const headerH = usesCompactHeader
    ? COMPACT_HEADER_H
    : undefined;
  let compactHeader: CompactHeaderPlan | undefined;

  if (usesCompactHeader) {
    if (spec.cornerBoxes.length > 0) {
      return {
        ok: false,
        kind: 'compact-header',
        reason: 'Compact Header cannot be used with corner boxes. Remove the boxes or select Large Header.',
      };
    }
    const measuredRegions = partitionRegions(spec, { headerH, rulesH: 0 });
    compactHeader = planCompactHeader(spec, measuredRegions.header, metrics);
    if (!compactHeader) {
      return {
        ok: false,
        kind: 'compact-header',
        reason: 'The compact headline does not fit. Shorten the title or subtitle, or select Large Header.',
      };
    }
  }

  if (!hasPrintedRules(spec)) {
    return {
      ok: true,
      regions: partitionRegions(spec, { headerH, rulesH: 0 }),
      compactHeader,
    };
  }

  if (spec.posterSize !== '8.5x11') {
    const regions = partitionRegions(spec, { headerH });
    const rulesPlan = regions.rules ? planRules(spec, regions.rules, metrics) : undefined;
    return rulesPlan
      ? { ok: true, regions, rulesPlan, compactHeader }
      : {
          ok: false,
          kind: 'rules',
          reason: `The rules do not fit legibly on a ${spec.posterSize} poster. Choose a larger size or shorten the rules.`,
        };
  }

  const stepCount = Math.round((LETTER_RULES_MAX_H - LETTER_RULES_MIN_H) / LETTER_RULES_STEP_H);
  const planAt = (step: number) => {
    const rulesH = Number((LETTER_RULES_MIN_H + step * LETTER_RULES_STEP_H).toFixed(2));
    const regions = partitionRegions(spec, { headerH, rulesH });
    const rulesPlan = regions.rules ? planRules(spec, regions.rules, metrics) : undefined;
    return rulesPlan && rulesPlan.pt >= LETTER_RULES_TARGET_PT
      ? { regions, rulesPlan }
      : undefined;
  };

  // Rules fit is monotonic with band height. Reject from the maximum first,
  // then binary-search the smallest 0.05in rung that keeps at least 8pt type.
  const maximum = planAt(stepCount);
  if (maximum) {
    let best = maximum;
    let low = 0;
    let high = stepCount - 1;
    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      const candidate = planAt(middle);
      if (candidate) {
        best = candidate;
        high = middle - 1;
      } else {
        low = middle + 1;
      }
    }
    return { ok: true, ...best, compactHeader };
  }

  return {
    ok: false,
    kind: 'rules',
    reason: 'The rules do not fit at a readable size on this Letter sheet. Shorten them or turn off Include rules on printout.',
  };
}
