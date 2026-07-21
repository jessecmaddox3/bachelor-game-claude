import type { ParsedRuleLine } from '../../content/rules';
import type { FontId, FontMetrics } from '../fonts/metrics';

export interface StyledRulesSegment {
  text: string;
  bold: boolean;
  x: number;
  w: number;
}

export interface StyledRulesLine {
  bullet: boolean;
  indentIn: number;
  segments: StyledRulesSegment[];
}

/** Wrap one parsed rules line while measuring each span in its actual font. */
export function wrapStyledRuleLine(
  line: ParsedRuleLine,
  maxW: number,
  normalFont: FontId,
  boldFont: FontId,
  pt: number,
  metrics: FontMetrics,
): StyledRulesLine[] | null {
  const bulletWidth = line.bullet ? metrics.widthIn('• ', normalFont, pt) : 0;
  const contentW = maxW - bulletWidth;
  if (contentW <= 0) return null;

  const tokens = line.spans.flatMap((span) =>
    Array.from(span.text.matchAll(/\S+/g), (match) => ({ text: match[0], bold: span.bold })),
  );
  if (tokens.length === 0) return [];

  const result: StyledRulesLine[] = [];
  let segments: StyledRulesSegment[] = [];
  let x = bulletWidth;
  const flush = () => {
    if (segments.length > 0) {
      result.push({ bullet: line.bullet && result.length === 0, indentIn: bulletWidth, segments });
    }
    segments = [];
    x = bulletWidth;
  };

  const add = (value: string, bold: boolean, withSpace: boolean) => {
    const font = bold ? boldFont : normalFont;
    const gap = withSpace ? metrics.widthIn(' ', normalFont, pt) : 0;
    const width = metrics.widthIn(value, font, pt);
    const previous = segments.at(-1);
    if (withSpace && previous?.bold === bold) {
      previous.text += ` ${value}`;
      previous.w += gap + width;
    } else {
      segments.push({ text: value, bold, x: x + gap, w: width });
    }
    x += gap + width;
  };

  for (const token of tokens) {
    const font = token.bold ? boldFont : normalFont;
    const wordW = metrics.widthIn(token.text, font, pt);
    const spaceW = segments.length > 0 ? metrics.widthIn(' ', normalFont, pt) : 0;
    if (wordW <= contentW) {
      if (segments.length > 0 && x + spaceW + wordW > maxW) flush();
      add(token.text, token.bold, segments.length > 0);
      continue;
    }

    // A single unspaced value can still be represented completely by
    // splitting it at character boundaries. It is never ellipsized.
    flush();
    let chunk = '';
    for (const character of Array.from(token.text)) {
      const next = chunk + character;
      if (chunk && metrics.widthIn(next, font, pt) > contentW) {
        add(chunk, token.bold, false);
        flush();
        chunk = character;
      } else {
        chunk = next;
      }
      if (metrics.widthIn(chunk, font, pt) > contentW) return null;
    }
    if (chunk) add(chunk, token.bold, false);
  }
  flush();
  return result;
}
