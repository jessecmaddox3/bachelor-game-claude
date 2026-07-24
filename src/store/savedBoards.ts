import { defaultDraft, type Draft } from './toBoardSpec';
import { normalizeDraft } from './wizardStore';

export const SAVED_BOARDS_KEY = 'game-board-saves-v1';

const SAVED_BOARD_SCHEMA_VERSION = 1;

export interface SavedBoardSnapshot {
  name: string;
  savedAt: string;
  schemaVersion: number;
  draft: Draft;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSavedBoardSnapshot(value: unknown): value is SavedBoardSnapshot {
  return isRecord(value)
    && typeof value.name === 'string'
    && value.name.trim().length > 0
    && typeof value.savedAt === 'string'
    && typeof value.schemaVersion === 'number'
    && isRecord(value.draft);
}

export function listSavedBoards(): SavedBoardSnapshot[] {
  try {
    const raw = localStorage.getItem(SAVED_BOARDS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isSavedBoardSnapshot)
      .sort((left, right) => right.savedAt.localeCompare(left.savedAt));
  } catch {
    return [];
  }
}

export function saveBoard(name: string, draft: Draft): SavedBoardSnapshot {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('A saved board name is required.');

  const snapshot: SavedBoardSnapshot = {
    name: trimmedName,
    savedAt: new Date().toISOString(),
    schemaVersion: SAVED_BOARD_SCHEMA_VERSION,
    draft: structuredClone(normalizeDraft(draft)),
  };
  const next = listSavedBoards().filter((saved) => saved.name !== trimmedName);
  next.push(snapshot);
  next.sort((left, right) => right.savedAt.localeCompare(left.savedAt));
  localStorage.setItem(SAVED_BOARDS_KEY, JSON.stringify(next));
  return snapshot;
}

export function loadSavedBoard(name: string): Draft | undefined {
  const snapshot = listSavedBoards().find((saved) => saved.name === name);
  return snapshot ? normalizeDraft(snapshot.draft) : undefined;
}

function comparableDraft(draft: Draft) {
  const normalized = normalizeDraft({
    ...draft,
    activities: Array.isArray(draft.activities)
      ? draft.activities.map((activity, index) => ({
        ...activity,
        uid: typeof activity.uid === 'string' ? activity.uid : `fingerprint-row-${index}`,
      }))
      : [],
  });
  return {
    ...normalized,
    activities: normalized.activities.map(({ uid: _uid, ...activity }) => activity),
  };
}

export function draftFingerprint(draft: Draft): string {
  return JSON.stringify(comparableDraft(draft));
}

export function savedBoardMatchesDraft(name: string, draft: Draft): boolean {
  const saved = loadSavedBoard(name);
  return saved !== undefined && draftFingerprint(saved) === draftFingerprint(draft);
}

export function workingDraftHasChanges(draft: Draft): boolean {
  return draftFingerprint(draft) !== draftFingerprint(defaultDraft());
}
