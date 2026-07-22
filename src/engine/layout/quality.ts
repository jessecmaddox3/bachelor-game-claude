import type { BoardSpec, PosterSizeId } from '../../models/boardSpec';
import { POSTER_SIZES } from '../../models/boardSpec';
import { FLOOR_PT, type GridLayout } from './gridSolver';

export type Grade = 'good' | 'tight' | 'poor';

export interface QualityReport {
  grade: Grade;
  bodyPt: number;
  advice: string[];
}

const NEXT_SIZE: Record<PosterSizeId, PosterSizeId | null> = {
  // A home-printer sheet has no "next size up" that still prints at home, so it
  // maps to null (advice becomes "fewer activities or players"), not a poster.
  '8.5x11': null,
  '18x24': '24x36',
  '24x36': '36x48',
  '36x48': '48x72',
  '48x72': null,
  '60x48': null,
};

/**
 * A home-printer sheet (Letter and any future small size) is proofed and read
 * at arm's length, not from across a room. Its longest side is well under a
 * poster's (posters start at 18x24). Grading and advice shift accordingly:
 * 9-10pt is ordinary, comfortably-legible body copy up close, so it must not be
 * flagged as a distance-legibility failure the way it would on a wall poster.
 */
function isCloseRead(size: PosterSizeId): boolean {
  const { w, h } = POSTER_SIZES[size];
  return Math.max(w, h) <= 17;
}

export function gradeLayout(layout: GridLayout, spec: BoardSpec): QualityReport {
  const closeRead = isCloseRead(spec.posterSize);
  const bigger = NEXT_SIZE[spec.posterSize];
  const suggest = bigger
    ? `Consider a ${bigger.replace('x', '"x')}" poster`
    : 'Consider fewer activities or players';

  let grade: Grade;
  if (closeRead) {
    // Read up close: only ellipsized labels or genuinely cramped rows are poor.
    // The 9pt floor is fine at arm's length, so body size alone never demotes.
    if (layout.degradations.ellipsized > 0 || layout.rowH < 0.24) {
      grade = 'poor';
    } else if (layout.degradations.wrappedTasks === 0 && layout.rowH >= 0.3) {
      grade = 'good';
    } else {
      grade = 'tight';
    }
  } else if (layout.degradations.ellipsized > 0 || layout.bodyPt <= 9.5 || layout.rowH < 0.32) {
    grade = 'poor';
  } else if (layout.bodyPt >= 12 && layout.degradations.wrappedTasks === 0 && layout.rowH >= 0.4) {
    grade = 'good';
  } else {
    grade = 'tight';
  }

  const advice: string[] = [];
  if (layout.degradations.ellipsized > 0) {
    advice.push(`${layout.degradations.ellipsized} item(s) were shortened with "…". ${suggest}.`);
  }
  // Distance-legibility only matters for wall posters. On a home-printer sheet
  // read at arm's length, 9-10pt is normal body copy and needs no warning.
  if (!closeRead && layout.bodyPt <= 9.5) {
    advice.push(
      layout.bodyPt <= FLOOR_PT
        ? `Body text is at the ${layout.bodyPt}pt minimum and may be hard to read from a distance. ${suggest}.`
        : `Body text is small (${layout.bodyPt}pt) and may be hard to read from a distance. ${suggest}.`,
    );
  }
  if (grade === 'tight') advice.push(`Everything fits but the board is dense. ${suggest} for more breathing room.`);
  if (grade === 'poor' && advice.length === 0) advice.push(`Rows are near the minimum height. ${suggest}.`);
  if (grade === 'good') {
    advice.push(closeRead ? 'Readable at arm\'s length. Good to print at home.' : 'Readable at a comfortable distance. Good to print.');
  }
  return { grade, bodyPt: layout.bodyPt, advice };
}

/**
 * The landscape/brackets rail squeezes its rules between a 4.5pt ceiling and a
 * 3.5pt floor. Report the size actually used and grade it honestly against that
 * range (mirroring the portrait grader's spirit), rather than a fixed placeholder.
 */
export const LANDSCAPE_RULES_MAX_PT = 4.5;
export const LANDSCAPE_RULES_FLOOR_PT = 3.5;

export function gradeLandscapeRules(rulesPt: number): QualityReport {
  let grade: Grade;
  if (rulesPt <= LANDSCAPE_RULES_FLOOR_PT) grade = 'poor';
  else if (rulesPt >= LANDSCAPE_RULES_MAX_PT) grade = 'good';
  else grade = 'tight';

  const advice: string[] = [];
  if (grade === 'poor') {
    advice.push(`Rules are at the ${rulesPt}pt minimum and may be hard to read up close. Shorten the rules.`);
  } else if (grade === 'tight') {
    advice.push(`Everything fits but the rules are dense (${rulesPt}pt). Shorten the rules for more breathing room.`);
  } else {
    advice.push('Landscape / Brackets layout rendered comfortably. Good to print.');
  }
  return { grade, bodyPt: rulesPt, advice };
}
