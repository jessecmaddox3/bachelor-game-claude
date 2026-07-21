import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PARTICIPANTS,
  defaultDraft,
  parsePointsInput,
  sortParticipantNames,
  toBoardSpec,
} from '../../src/store/toBoardSpec';
import { pointsLabel } from '../../src/models/boardSpec';
import { makeDraft } from '../helpers/fixtures';

describe('parsePointsInput', () => {
  it('parses integers, TBD, and ranges in both notations', () => {
    expect(parsePointsInput('3')).toBe(3);
    expect(parsePointsInput('-3')).toBe(-3);
    expect(parsePointsInput('tbd')).toBe('TBD');
    expect(parsePointsInput('TBD')).toBe('TBD');
    expect(parsePointsInput('1 to 6')).toEqual({ min: 1, max: 6 });
    expect(parsePointsInput('1-6')).toEqual({ min: 1, max: 6 });
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

  it('round-trips compact range labels', () => {
    const value = { min: -5, max: 5 } as const;
    expect(parsePointsInput(pointsLabel(value, 'dash'))).toEqual(value);
  });
});

describe('toBoardSpec', () => {
  it('starts a new board with the family roster sorted and no selected activities', () => {
    const draft = defaultDraft();
    expect(draft.title).toBe('Kids Weekend');
    expect(draft.subtitle).toBe('');
    expect(draft.honoree).toBe('');
    expect(draft.libraryOccasion).toBe('kids-weekend');
    expect(draft.players).toEqual(DEFAULT_PARTICIPANTS);
    expect(draft.players).toEqual([...draft.players].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
    expect(draft.activities).toEqual([]);
    expect(draft.writeInRows).toBe(0);
    expect(draft.honoreeBonusRow).toBe(false);
    expect(draft.cornerBoxes).toEqual([]);
  });

  it('sorts participant names case-insensitively without mutating the input', () => {
    const input = ['zoe', 'Amy', 'ben'];
    expect(sortParticipantNames(input)).toEqual(['Amy', 'ben', 'zoe']);
    expect(input).toEqual(['zoe', 'Amy', 'ben']);
  });

  it('accepts a complete draft', () => {
    const r = toBoardSpec(makeDraft());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.spec.players.length).toBeGreaterThanOrEqual(8);
      // Editor-only row identity must not leak into the BoardSpec (zod strips it).
      for (const a of r.spec.activities) expect('uid' in a).toBe(false);
    }
  });

  it('accepts a blank legacy honoree and carries rich rules content', () => {
    const draft = makeDraft({
      honoree: '',
      rulesContent: '**HONOR SYSTEM**\nMark only activities you complete.',
    });
    const result = toBoardSpec(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.spec.honoree).toBe('');
    expect(result.spec.rulesContent).toContain('**HONOR SYSTEM**');
  });

  it('reports friendly field errors, not raw zod unions', () => {
    const d = makeDraft();
    d.players = ['OnlyOne'];
    const r = toBoardSpec(d);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.field === 'players' && /at least 8/i.test(e.message))).toBe(true);
  });

  it('maps an empty required string to a fill-this-in message', () => {
    const d = makeDraft();
    d.title = '';
    const r = toBoardSpec(d);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.find((e) => e.field === 'title')?.message).toMatch(/fill this in/i);
  });

  it('maps an over-length string to a keep-under message', () => {
    const d = makeDraft();
    d.honoree = 'X'.repeat(40);
    const r = toBoardSpec(d);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.find((e) => e.field === 'honoree')?.message).toMatch(/under 30/i);
  });

  it('flattens the points union error to a friendly message', () => {
    const d = makeDraft();
    (d.activities[0] as { points: unknown }).points = 'garbage';
    const r = toBoardSpec(d);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const err = r.errors.find((e) => e.field.startsWith('activities.0'));
    expect(err?.message).toMatch(/whole number.*range.*TBD/i);
  });
});
