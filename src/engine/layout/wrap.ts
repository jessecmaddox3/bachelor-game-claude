import type { FontMetrics, FontId } from '../fonts/metrics';

export interface WrapResult {
  lines: string[];
  ellipsized: boolean;
}

/** Truncate with a trailing ellipsis until the text fits maxW. */
export function hardEllipsize(
  text: string,
  maxW: number,
  fontId: FontId,
  sizePt: number,
  m: FontMetrics,
): { text: string; ellipsized: boolean } {
  if (m.widthIn(text, fontId, sizePt) <= maxW) return { text, ellipsized: false };
  const ellipsis = '…';
  if (m.widthIn(ellipsis, fontId, sizePt) > maxW) return { text: '', ellipsized: true };
  let t = text;
  while (t.length > 0 && m.widthIn(t + ellipsis, fontId, sizePt) > maxW) {
    t = t.slice(0, -1).trimEnd();
  }
  return { text: t + ellipsis, ellipsized: true };
}

/**
 * Greedy word-wrap to maxW. If the result exceeds maxLines, the overflow is
 * folded into the last line and ellipsized. Any single word wider than maxW
 * is hard-ellipsized. Every returned line is guaranteed to fit maxW.
 */
export function wrapToWidth(
  text: string,
  maxW: number,
  fontId: FontId,
  sizePt: number,
  m: FontMetrics,
  maxLines: number,
): WrapResult {
  const words = text.split(/\s+/).filter(Boolean);
  const rawLines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || m.widthIn(candidate, fontId, sizePt) <= maxW) {
      current = candidate;
    } else {
      rawLines.push(current);
      current = word;
    }
  }
  if (current) rawLines.push(current);

  let ellipsized = false;
  let lines = rawLines;
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = [kept[maxLines - 1], ...lines.slice(maxLines)].join(' ');
    lines = kept;
    ellipsized = true;
  }

  lines = lines.map((line) => {
    const r = hardEllipsize(line, maxW, fontId, sizePt, m);
    if (r.ellipsized) ellipsized = true;
    return r.text;
  });

  return { lines, ellipsized };
}

/**
 * Largest point size (stepping down by 0.5) at which the text's width fits
 * maxW and its line height fits maxH. Null if minPt still doesn't fit.
 */
export function fitSizePt(
  text: string,
  maxW: number,
  maxH: number,
  fontId: FontId,
  m: FontMetrics,
  maxPt: number,
  minPt: number,
): number | null {
  for (let pt = maxPt; pt >= minPt; pt -= 0.5) {
    if (m.widthIn(text, fontId, pt) <= maxW && m.lineHeightIn(fontId, pt) <= maxH) return pt;
  }
  return null;
}

/**
 * Split a single unbreakable value at character boundaries into chunks that each
 * fit maxW. Every completed chunk is handed to onChunk in order; the trailing
 * partial chunk is returned so the caller can keep accumulating from it. Returns
 * null when even one character cannot fit maxW (unrenderable at this size).
 *
 * Shared by fitWrappedText and rules/richText so grapheme handling lives once.
 */
export function splitOverlongWord(
  value: string,
  maxW: number,
  measure: (text: string) => number,
  onChunk: (chunk: string) => void,
): string | null {
  let chunk = '';
  for (const character of Array.from(value)) {
    const next = chunk + character;
    if (chunk && measure(next) > maxW) {
      onChunk(chunk);
      chunk = character;
    } else {
      chunk = next;
    }
    if (measure(chunk) > maxW) return null;
  }
  return chunk;
}

/**
 * Fit a complete text block without ellipsizing. Long unspaced values are
 * split at character boundaries so user-entered labels are never clipped or
 * silently shortened.
 */
export function fitWrappedText(
  text: string,
  maxW: number,
  maxH: number,
  fontId: FontId,
  m: FontMetrics,
  options: { minPt: number; maxPt: number; maxLines: number },
): { pt: number; lines: string[] } | null {
  const wrapComplete = (sizePt: number): string[] | null => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];
    const lines: string[] = [];
    let current = '';
    const push = () => {
      if (current) lines.push(current);
      current = '';
    };

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (m.widthIn(candidate, fontId, sizePt) <= maxW) {
        current = candidate;
        continue;
      }
      push();
      if (m.widthIn(word, fontId, sizePt) <= maxW) {
        current = word;
        continue;
      }

      const finalChunk = splitOverlongWord(
        word,
        maxW,
        (t) => m.widthIn(t, fontId, sizePt),
        (chunk) => lines.push(chunk),
      );
      if (finalChunk === null) return null;
      current = finalChunk;
    }
    push();
    return lines.length <= options.maxLines ? lines : null;
  };

  for (let pt = options.maxPt; pt >= options.minPt; pt -= 0.5) {
    const lines = wrapComplete(pt);
    if (!lines) continue;
    if (lines.length * m.lineHeightIn(fontId, pt) <= maxH) return { pt, lines };
  }
  return null;
}
