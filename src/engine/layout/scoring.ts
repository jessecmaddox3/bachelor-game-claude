import { pointsLabel, type Activity, type BoardSpec } from '../../models/boardSpec';
import type { FontMetrics } from '../fonts/metrics';

export const LETTER_POINTS_HEADER = 'POINTS';
export const LETTER_MAX_POINTS_SUBHEADER = '(MAX)';
export const LETTER_MAX_POINTS_RATIO = 0.65;
export const LETTER_SCORE_GAP_IN = 0.04;

export interface CombinedScoreMetrics {
  primaryText: string;
  maximumText?: string;
  primaryPt: number;
  maximumPt?: number;
  primaryW: number;
  maximumW: number;
  gapW: number;
  totalW: number;
}

export function usesCombinedLetterScoring(spec: BoardSpec): boolean {
  return spec.template === 'portrait' && spec.posterSize === '8.5x11';
}

export function measureCombinedScore(
  activity: Pick<Activity, 'points' | 'maxPoints'>,
  rangeFormat: BoardSpec['pointsRangeFormat'],
  primaryPt: number,
  metrics: FontMetrics,
): CombinedScoreMetrics {
  const primaryText = pointsLabel(activity.points, rangeFormat);
  const maximumText = activity.maxPoints === undefined ? undefined : `(${activity.maxPoints})`;
  const maximumPt = maximumText ? primaryPt * LETTER_MAX_POINTS_RATIO : undefined;
  const primaryW = metrics.widthIn(primaryText, 'bodyBold', primaryPt);
  const maximumW = maximumText && maximumPt
    ? metrics.widthIn(maximumText, 'bodyBold', maximumPt)
    : 0;
  const gapW = maximumText ? LETTER_SCORE_GAP_IN : 0;
  return {
    primaryText,
    maximumText,
    primaryPt,
    maximumPt,
    primaryW,
    maximumW,
    gapW,
    totalW: primaryW + gapW + maximumW,
  };
}
