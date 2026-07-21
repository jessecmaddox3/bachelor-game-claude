import { describe, expect, it } from 'vitest';
import { parseRulesContent } from '../../src/content/rules';

describe('parseRulesContent', () => {
  it('turns bold headings, paragraphs, and bullets into renderable blocks', () => {
    expect(parseRulesContent(`**HONOR SYSTEM**
Mark only what you complete.

**HOW TO PLAY**
- Pick an activity
- Mark the square`)).toEqual([
      {
        heading: 'HONOR SYSTEM',
        text: 'Mark only what you complete.',
        lines: [{ bullet: false, spans: [{ text: 'Mark only what you complete.', bold: false }] }],
      },
      {
        heading: 'HOW TO PLAY',
        text: '• Pick an activity\n• Mark the square',
        lines: [
          { bullet: true, spans: [{ text: 'Pick an activity', bold: false }] },
          { bullet: true, spans: [{ text: 'Mark the square', bold: false }] },
        ],
      },
    ]);
  });

  it('preserves paired inline bold spans without treating typed HTML as markup', () => {
    expect(parseRulesContent('A **very** good rule with <script>alert(1)</script>.')).toEqual([
      {
        text: 'A very good rule with <script>alert(1)</script>.',
        lines: [{
          bullet: false,
          spans: [
            { text: 'A ', bold: false },
            { text: 'very', bold: true },
            { text: ' good rule with <script>alert(1)</script>.', bold: false },
          ],
        }],
      },
    ]);
  });

  it('keeps unmatched bold markers literal', () => {
    expect(parseRulesContent('A **literal marker')).toEqual([
      {
        text: 'A **literal marker',
        lines: [{ bullet: false, spans: [{ text: 'A **literal marker', bold: false }] }],
      },
    ]);
  });

  it('ignores blank content', () => {
    expect(parseRulesContent(' \n\n ')).toEqual([]);
  });
});
