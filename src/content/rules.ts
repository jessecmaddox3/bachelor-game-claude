export interface ParsedRuleBlock {
  heading?: string;
  text: string;
  lines?: ParsedRuleLine[];
}

export interface RulesSpan {
  text: string;
  bold: boolean;
}

export interface ParsedRuleLine {
  bullet: boolean;
  spans: RulesSpan[];
}

export function parseRulesSpans(value: string): RulesSpan[] {
  const spans: RulesSpan[] = [];
  const pattern = /\*\*([^*\n]+)\*\*/g;
  let cursor = 0;
  for (const match of value.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) spans.push({ text: value.slice(cursor, index), bold: false });
    spans.push({ text: match[1]!, bold: true });
    cursor = index + match[0].length;
  }
  if (cursor < value.length) spans.push({ text: value.slice(cursor), bold: false });
  if (spans.length === 0 && value) spans.push({ text: value, bold: false });
  return spans;
}

export function bodyLines(rule: ParsedRuleBlock): ParsedRuleLine[] {
  if (rule.lines) return rule.lines;
  return rule.text.split('\n').filter((line) => line.trim()).map((line) => {
    const trimmed = line.trim();
    const bullet = trimmed.startsWith('• ') || trimmed.startsWith('- ');
    return {
      bullet,
      spans: [{ text: bullet ? trimmed.slice(2) : trimmed, bold: false }],
    };
  });
}

/**
 * Parse the editor's deliberately small rich-text format into measured rule
 * blocks. Typed HTML stays plain text and is never interpreted as markup.
 */
export function parseRulesContent(source: string): ParsedRuleBlock[] {
  return source
    .trim()
    .split(/\n\s*\n+/)
    .map((sourceBlock) => {
      const lines = sourceBlock.split('\n').map((line) => line.trim()).filter(Boolean);
      const headingMatch = lines[0]?.match(/^\*\*([^*]+)\*\*$/);
      const bodyLines = headingMatch ? lines.slice(1) : lines;
      const parsedLines = bodyLines
        .map((line) => {
          const bullet = line.startsWith('- ');
          const source = bullet ? line.slice(2).trim() : line;
          return { bullet, spans: parseRulesSpans(source) };
        });
      const text = parsedLines.map((line) => {
        const value = line.spans.map((span) => span.text).join('');
        return line.bullet ? `• ${value}` : value;
      }).join('\n');
      return {
        ...(headingMatch ? { heading: headingMatch[1]!.trim() } : {}),
        text,
        lines: parsedLines,
      };
    })
    .filter((block) => Boolean(block.heading || block.text));
}

export function effectiveRules(source: { rulesContent: string; rules: ParsedRuleBlock[] }): ParsedRuleBlock[] {
  return source.rulesContent.trim() ? parseRulesContent(source.rulesContent) : source.rules;
}
