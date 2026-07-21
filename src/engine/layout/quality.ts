import type { BoardSpec, PosterSizeId } from '../../models/boardSpec';
import { FLOOR_PT, type GridLayout } from './gridSolver';

export type Grade = 'good' | 'tight' | 'poor';

export interface QualityReport {
  grade: Grade;
  bodyPt: number;
  advice: string[];
}

const NEXT_SIZE: Record<PosterSizeId, PosterSizeId | null> = {
  '18x24': '24x36',
  '24x36': '36x48',
  '36x48': '48x72',
  '48x72': null,
  '60x48': null,
};

export function gradeLayout(layout: GridLayout, spec: BoardSpec): QualityReport {
  const bigger = NEXT_SIZE[spec.posterSize];
  const suggest = bigger
    ? `Consider a ${bigger.replace('x', '"x')}" poster`
    : 'Consider fewer activities or players';

  let grade: Grade;
  if (layout.degradations.ellipsized > 0 || layout.bodyPt <= 9.5 || layout.rowH < 0.32) {
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
  if (layout.bodyPt <= 9.5) {
    advice.push(
      layout.bodyPt <= FLOOR_PT
        ? `Body text is at the ${layout.bodyPt}pt minimum and may be hard to read from a distance. ${suggest}.`
        : `Body text is small (${layout.bodyPt}pt) and may be hard to read from a distance. ${suggest}.`,
    );
  }
  if (grade === 'tight') advice.push(`Everything fits but the board is dense. ${suggest} for more breathing room.`);
  if (grade === 'poor' && advice.length === 0) advice.push(`Rows are near the minimum height. ${suggest}.`);
  if (grade === 'good') advice.push('Readable at a comfortable distance. Good to print.');
  return { grade, bodyPt: layout.bodyPt, advice };
}
