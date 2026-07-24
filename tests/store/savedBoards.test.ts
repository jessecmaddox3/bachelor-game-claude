// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultDraft } from '../../src/store/toBoardSpec';
import {
  SAVED_BOARDS_KEY,
  draftFingerprint,
  listSavedBoards,
  loadSavedBoard,
  saveBoard,
  savedBoardMatchesDraft,
  workingDraftHasChanges,
} from '../../src/store/savedBoards';

describe('saved boards', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('uses the stable named-save key without altering the disposable live draft', () => {
    localStorage.setItem('game-board-v5', 'current working draft');

    saveBoard('Kids Weekend', defaultDraft());

    expect(SAVED_BOARDS_KEY).toBe('game-board-saves-v1');
    expect(localStorage.getItem(SAVED_BOARDS_KEY)).not.toBeNull();
    expect(localStorage.getItem('game-board-v5')).toBe('current working draft');
  });

  it('lists saved boards newest-first', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-22T14:00:00.000Z'));
    saveBoard('First board', defaultDraft());
    vi.setSystemTime(new Date('2026-07-22T15:00:00.000Z'));
    saveBoard('Second board', defaultDraft());

    expect(listSavedBoards().map((snapshot) => snapshot.name)).toEqual(['Second board', 'First board']);
  });

  it('overwrites a same-name save instead of creating a duplicate', () => {
    const first = defaultDraft();
    first.title = 'Original title';
    saveBoard('Weekend board', first);
    const replacement = defaultDraft();
    replacement.title = 'Updated title';

    const saved = saveBoard('Weekend board', replacement);

    expect(saved.name).toBe('Weekend board');
    expect(listSavedBoards()).toHaveLength(1);
    expect(loadSavedBoard('Weekend board')?.title).toBe('Updated title');
  });

  it('normalizes older snapshots with missing fields and activity UIDs on load', () => {
    const legacy = structuredClone(defaultDraft()) as Record<string, unknown>;
    delete legacy.pointsRangeFormat;
    delete legacy.rulesTitle;
    delete legacy.rulesContent;
    legacy.activities = [{ name: 'Legacy activity', points: 2, bonus: false }];
    legacy.template = 'landscapeBrackets';
    legacy.posterSize = '24x36';
    localStorage.setItem(SAVED_BOARDS_KEY, JSON.stringify([{
      name: 'Legacy board',
      savedAt: '2017-06-10T12:00:00.000Z',
      schemaVersion: 0,
      draft: legacy,
    }]));

    const loaded = loadSavedBoard('Legacy board');

    expect(loaded?.pointsRangeFormat).toBe('words');
    expect(loaded?.rulesTitle).toBe('GAME RULES:');
    expect(loaded?.rulesContent).toMatch(/HONOR SYSTEM/);
    expect(loaded?.activities[0]?.uid).toEqual(expect.any(String));
    expect(loaded?.posterSize).toBe('60x48');
  });

  it('treats malformed saved JSON as an empty list', () => {
    localStorage.setItem(SAVED_BOARDS_KEY, '{not valid JSON');

    expect(listSavedBoards()).toEqual([]);
    expect(loadSavedBoard('Missing')).toBeUndefined();
  });

  it('discards saved entries without a usable name, timestamp, version, or draft', () => {
    localStorage.setItem(SAVED_BOARDS_KEY, JSON.stringify([
      null,
      { name: '', savedAt: '2026-07-22T14:00:00.000Z', schemaVersion: 1, draft: {} },
      { name: 'No date', schemaVersion: 1, draft: {} },
      { name: 'No version', savedAt: '2026-07-22T14:00:00.000Z', draft: {} },
      { name: 'No draft', savedAt: '2026-07-22T14:00:00.000Z', schemaVersion: 1 },
      { name: 'Usable', savedAt: '2026-07-22T14:00:00.000Z', schemaVersion: 1, draft: {} },
    ]));

    expect(listSavedBoards().map((snapshot) => snapshot.name)).toEqual(['Usable']);
  });

  it('ignores editor-only activity uids when comparing a named save', () => {
    const saved = defaultDraft();
    saved.activities = [{
      uid: 'first-uid',
      catalogId: 'blind-snack-rank',
      name: 'Rank Three Snacks Blind',
      points: 2,
      bonus: false,
    }];
    saveBoard('Weekend', saved);
    const current = structuredClone(saved);
    current.activities[0]!.uid = 'replacement-uid';

    expect(draftFingerprint(current)).toBe(draftFingerprint(saved));
    expect(savedBoardMatchesDraft('Weekend', current)).toBe(true);

    current.activities[0]!.points = 7;
    expect(savedBoardMatchesDraft('Weekend', current)).toBe(false);
  });

  it('detects changes in an unnamed working draft', () => {
    expect(workingDraftHasChanges(defaultDraft())).toBe(false);
    const changed = defaultDraft();
    changed.subtitle = 'Friday through Sunday';
    expect(workingDraftHasChanges(changed)).toBe(true);
  });

  it('does not crash when saved-board storage reads fail', () => {
    const original = localStorage.getItem;
    localStorage.getItem = () => {
      throw new DOMException('Blocked', 'SecurityError');
    };

    try {
      expect(listSavedBoards()).toEqual([]);
    } finally {
      localStorage.getItem = original;
    }
  });

  it('surfaces saved-board storage write failures to the caller', () => {
    const original = localStorage.setItem;
    localStorage.setItem = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    };

    try {
      expect(() => saveBoard('Weekend', defaultDraft())).toThrow(/quota/i);
    } finally {
      localStorage.setItem = original;
    }
  });
});
