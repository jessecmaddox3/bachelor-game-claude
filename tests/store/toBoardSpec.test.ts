import { describe, it, expect } from 'vitest';
import { toBoardSpec, parsePointsInput, defaultDraft } from '../../src/store/toBoardSpec';
import { pointsLabel } from '../../src/models/boardSpec';

describe('parsePointsInput', () => {
  it('parses integers, TBD, and ranges in both notations', () => {
    expect(parsePointsInput('3')).toBe(3);
    expect(parsePointsInput('-3')).toBe(-3);
    expect(parsePointsInput('tbd')).toBe('TBD');
    expect(parsePointsInput('TBD')).toBe('TBD');
    expect(parsePointsInput('1 to 6')).toEqual({ min: 1, max: 6 });
    expect(parsePointsInput('-5 - 5')).toEqual({ min: -5, max: 5 });
    expect(parsePointsInput('nonsense')).toBeNull();
    expect(parsePointsInput('6 to 1')).toBeNull();
  });

  it('round-trips through pointsLabel', () => {
    for (const s of ['3', 'TBD', '1 to 6']) {
      const v = parsePointsInput(s);
      expect(v).not.toBeNull();
      expect(parsePointsInput(pointsLabel(v!))).toEqual(v);
    }
  });
});

describe('toBoardSpec', () => {
  it('accepts a complete draft', () => {
    const r = toBoardSpec(defaultDraft());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.spec.players.length).toBeGreaterThanOrEqual(8);
      // Editor-only row identity must not leak into the BoardSpec (zod strips it).
      for (const a of r.spec.activities) expect('uid' in a).toBe(false);
    }
  });

  it('reports friendly field errors, not raw zod unions', () => {
    const d = defaultDraft();
    d.players = ['OnlyOne'];
    const r = toBoardSpec(d);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.field === 'players' && /at least 8/i.test(e.message))).toBe(true);
  });

  it('maps an empty required string to a fill-this-in message', () => {
    const d = defaultDraft();
    d.title = '';
    const r = toBoardSpec(d);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.find((e) => e.field === 'title')?.message).toMatch(/fill this in/i);
  });

  it('maps an over-length string to a keep-under message', () => {
    const d = defaultDraft();
    d.honoree = 'X'.repeat(40);
    const r = toBoardSpec(d);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.find((e) => e.field === 'honoree')?.message).toMatch(/under 30/i);
  });

  it('flattens the points union error to a friendly message', () => {
    const d = defaultDraft();
    (d.activities[0] as { points: unknown }).points = 'garbage';
    const r = toBoardSpec(d);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const err = r.errors.find((e) => e.field.startsWith('activities.0'));
    expect(err?.message).toMatch(/whole number.*range.*TBD/i);
  });
});
