import {
  pointsLabel,
  type Activity,
  type BoardSpec,
} from '../../models/boardSpec';
import type { FontMetrics } from '../fonts/metrics';
import { LETTER_MAX_POINTS_RATIO } from './scoring';
import { solveGrid } from './gridSolver';
import { planPortrait } from './portraitPlan';

export interface LetterFit {
  selectedActivities: number;
  estimatedMaxActivities: number;
  estimatedAdditionalActivities: number;
  overBy: number;
}

function widest<T>(values: readonly T[], width: (value: T) => number): T {
  return values.reduce((best, value) => width(value) > width(best) ? value : best);
}

function representativeActivity(spec: BoardSpec, metrics: FontMetrics): Activity {
  const activities = spec.activities;
  const widestName = widest(
    activities,
    (activity) => metrics.widthIn(activity.name, 'body', 9),
  );
  const widestPoints = widest(
    activities,
    (activity) => metrics.widthIn(
      pointsLabel(activity.points, spec.pointsRangeFormat),
      'bodyBold',
      9,
    ),
  );
  const capped = activities.filter(
    (activity): activity is Activity & { maxPoints: number } => activity.maxPoints !== undefined,
  );
  const widestMaximum = capped.length > 0
    ? widest(
        capped,
        (activity) => metrics.widthIn(
          `(${activity.maxPoints})`,
          'bodyBold',
          9 * LETTER_MAX_POINTS_RATIO,
        ),
      )
    : undefined;

  return {
    name: widestName.name,
    points: widestPoints.points,
    ...(widestMaximum ? { maxPoints: widestMaximum.maxPoints } : {}),
    bonus: false,
  };
}

/**
 * Estimates future Letter rows with the real portrait geometry and grid
 * solver. The actual build remains authoritative because future wording may
 * be more demanding than the selected board's representative activity.
 */
export function estimateLetterCapacity(
  spec: BoardSpec,
  metrics: FontMetrics,
): LetterFit | undefined {
  if (spec.template !== 'portrait' || spec.posterSize !== '8.5x11') return undefined;

  const displaySpec: BoardSpec = spec.theme.allCaps
    ? {
        ...spec,
        activities: spec.activities.map((activity) => ({
          ...activity,
          name: activity.name.toUpperCase(),
        })),
      }
    : spec;
  const portrait = planPortrait(displaySpec, metrics);
  if (!portrait.ok) return undefined;

  const representative = representativeActivity(displaySpec, metrics);
  const fits = (count: number) => solveGrid(
    portrait.regions.grid,
    {
      ...displaySpec,
      activities: Array.from({ length: count }, () => representative),
    },
    metrics,
  ).feasible;

  let low = 5;
  let high = 80;
  let maximum = 0;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (fits(middle)) {
      maximum = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  // Defense-in-depth for any later solver change that breaks the constructed
  // probe's monotonic boundary. A full scan is used only when the boundary
  // itself disproves the binary-search assumption.
  if (
    (maximum >= 5 && !fits(maximum))
    || (maximum < 80 && fits(maximum + 1))
  ) {
    maximum = 0;
    for (let count = 5; count <= 80; count++) {
      if (!fits(count)) break;
      maximum = count;
    }
  }

  const selectedActivities = spec.activities.length;
  // The representative probe intentionally combines worst cases to estimate
  // future rows. If that composite is stricter than the real heterogeneous
  // board, the authoritative current-grid solve wins: a board that already
  // fits must never be told to remove activities.
  if (
    maximum < selectedActivities
    && solveGrid(portrait.regions.grid, displaySpec, metrics).feasible
  ) {
    maximum = selectedActivities;
  }
  return {
    selectedActivities,
    estimatedMaxActivities: maximum,
    estimatedAdditionalActivities: Math.max(0, maximum - selectedActivities),
    overBy: Math.max(0, selectedActivities - maximum),
  };
}
