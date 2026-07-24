import type { LetterFit } from '../engine';

export function letterFitMessage(fit: LetterFit): string {
  if (fit.overBy > 0) {
    return `${fit.selectedActivities} activities selected. About ${fit.estimatedMaxActivities} fit with the current Letter layout. Remove about ${fit.overBy}, choose Compact Header, or hide the rules.`;
  }
  if (fit.estimatedAdditionalActivities === 0) {
    return `${fit.selectedActivities} selected. This Letter layout is approximately full.`;
  }
  return `${fit.selectedActivities} selected. About ${fit.estimatedAdditionalActivities} more activities fit with the current Letter layout.`;
}

export function shortLetterFitMessage(fit: LetterFit): string {
  if (fit.overBy > 0) return `About ${fit.estimatedMaxActivities} fit`;
  if (fit.estimatedAdditionalActivities === 0) return 'Approximately full';
  return `About ${fit.estimatedAdditionalActivities} more fit`;
}
