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
  let t = text;
  while (t.length > 1 && m.widthIn(t + '…', fontId, sizePt) > maxW) {
    t = t.slice(0, -1).trimEnd();
  }
  return { text: t + '…', ellipsized: true };
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
