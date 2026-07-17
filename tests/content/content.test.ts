import { describe, it, expect } from 'vitest';
import { ACTIVITY_LIBRARY, ACTIVITY_CATEGORIES, STARTER_RULES, STARTER_FOOTNOTE } from '../../src/content/activities';
import { THEME_PRESETS } from '../../src/content/themes';
import { boardSpecSchema, pointsValueSchema } from '../../src/models/boardSpec';
import { makeSpec } from '../helpers/fixtures';

describe('activity library', () => {
  it('has at least 40 activities, all schema-valid', () => {
    expect(ACTIVITY_LIBRARY.length).toBeGreaterThanOrEqual(40);
    for (const a of ACTIVITY_LIBRARY) {
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.name.length).toBeLessThanOrEqual(90);
      expect(pointsValueSchema.safeParse(a.points).success).toBe(true);
      expect(ACTIVITY_CATEGORIES).toContain(a.category);
      if (a.maxPoints !== undefined) {
        expect(a.maxPoints).toBeGreaterThanOrEqual(1);
        expect(a.maxPoints).toBeLessThanOrEqual(99);
      }
    }
  });

  it('tournament entries carry ranges', () => {
    const bp = ACTIVITY_LIBRARY.find((a) => a.name === 'Beer Pong Tournament');
    expect(bp?.points).toEqual({ min: 1, max: 6 });
  });

  it('starter rules and footnote satisfy the schema inside a spec', () => {
    const spec = makeSpec({ rules: STARTER_RULES, footnote: STARTER_FOOTNOTE });
    expect(spec.rules.length).toBeGreaterThanOrEqual(4);
  });
});

describe('theme presets', () => {
  it('every preset merges into a valid spec theme', () => {
    expect(THEME_PRESETS.length).toBeGreaterThanOrEqual(4);
    for (const p of THEME_PRESETS) {
      const spec = boardSpecSchema.parse({ ...makeSpec(), theme: p.theme });
      expect(spec.theme).toBeDefined();
      expect(p.id.length).toBeGreaterThan(0);
      expect(p.name.length).toBeGreaterThan(0);
    }
  });

  it('includes the steven look with the fidelity fields on', () => {
    const steven = THEME_PRESETS.find((p) => p.id === 'steven');
    expect(steven?.theme.allCaps).toBe(true);
    expect(steven?.theme.cornerLabel).toBe('THE GAME');
  });
});
