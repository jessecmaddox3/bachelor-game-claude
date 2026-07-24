import { useCallback, useEffect, useRef, useState } from 'react';
import {
  listSavedBoards,
  loadSavedBoard,
  saveBoard,
  savedBoardMatchesDraft,
  workingDraftHasChanges,
  type SavedBoardSnapshot,
} from '../store/savedBoards';
import { useWizardStore } from '../store/wizardStore';
import { BoardFileDialog } from './BoardFileDialog';

type DialogFocus = 'browse' | 'save';

const SAVE_ERROR = 'Could not save this board in your browser. Your current work is still here.';

export function BoardFileControls() {
  const {
    draft,
    activeSavedBoardName,
    replaceDraft,
    setActiveSavedBoardName,
  } = useWizardStore();
  const [snapshots, setSnapshots] = useState<SavedBoardSnapshot[]>(listSavedBoards);
  const [dialogFocus, setDialogFocus] = useState<DialogFocus | null>(null);
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const saveButton = useRef<HTMLButtonElement>(null);
  const boardsButton = useRef<HTMLButtonElement>(null);
  const dialogOpener = useRef<HTMLButtonElement | null>(null);

  const refreshSnapshots = useCallback(() => {
    const next = listSavedBoards();
    setSnapshots(next);
    return next;
  }, []);

  const activeSnapshotExists = activeSavedBoardName !== null
    && snapshots.some((snapshot) => snapshot.name === activeSavedBoardName);
  const isSaved = activeSnapshotExists
    && activeSavedBoardName !== null
    && savedBoardMatchesDraft(activeSavedBoardName, draft);
  const status = !activeSnapshotExists
    ? 'Not saved yet'
    : isSaved
      ? 'Saved'
      : 'Unsaved changes';

  const openDialog = useCallback((focus: DialogFocus, opener: HTMLButtonElement | null) => {
    refreshSnapshots();
    setError('');
    dialogOpener.current = opener;
    setDialogFocus(focus);
  }, [refreshSnapshots]);

  const closeDialog = useCallback(() => {
    setDialogFocus(null);
    setError('');
    queueMicrotask(() => dialogOpener.current?.focus());
  }, []);

  const saveAs = useCallback((requestedName: string): boolean => {
    const name = requestedName.trim().slice(0, 80);
    if (!name) {
      setError('Enter a name for this board.');
      return false;
    }

    const wouldReplaceAnother = snapshots.some((snapshot) => snapshot.name === name)
      && name !== activeSavedBoardName;
    if (wouldReplaceAnother && !window.confirm('Overwrite this saved board?')) return false;

    try {
      saveBoard(name, draft);
      setActiveSavedBoardName(name);
      refreshSnapshots();
      setAnnouncement(`Saved ${name}.`);
      setError('');
      setDialogFocus(null);
      queueMicrotask(() => dialogOpener.current?.focus());
      return true;
    } catch {
      setError(SAVE_ERROR);
      return false;
    }
  }, [
    activeSavedBoardName,
    draft,
    refreshSnapshots,
    setActiveSavedBoardName,
    snapshots,
  ]);

  const saveActive = useCallback(() => {
    const savedNames = refreshSnapshots();
    const canUpdateActive = activeSavedBoardName !== null
      && savedNames.some((snapshot) => snapshot.name === activeSavedBoardName);

    if (!canUpdateActive || activeSavedBoardName === null) {
      openDialog('save', saveButton.current);
      return;
    }

    try {
      saveBoard(activeSavedBoardName, draft);
      refreshSnapshots();
      setActiveSavedBoardName(activeSavedBoardName);
      setAnnouncement(`Saved ${activeSavedBoardName}.`);
      setError('');
    } catch {
      setError(SAVE_ERROR);
    }
  }, [
    activeSavedBoardName,
    draft,
    openDialog,
    refreshSnapshots,
    setActiveSavedBoardName,
  ]);

  const openBoard = useCallback((name: string) => {
    const hasUnsavedChanges = activeSavedBoardName === null
      ? workingDraftHasChanges(draft)
      : !savedBoardMatchesDraft(activeSavedBoardName, draft);
    if (
      hasUnsavedChanges
      && !window.confirm('Open this saved board? Unsaved changes will be replaced.')
    ) return;

    const savedDraft = loadSavedBoard(name);
    if (!savedDraft) {
      setError('That saved board is no longer available.');
      refreshSnapshots();
      return;
    }

    replaceDraft(savedDraft, name);
    refreshSnapshots();
    setAnnouncement(`Opened ${name}.`);
    setDialogFocus(null);
    setError('');
    queueMicrotask(() => dialogOpener.current?.focus());
  }, [activeSavedBoardName, draft, refreshSnapshots, replaceDraft]);

  useEffect(() => {
    const handleKeyboardSave = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== 's'
        || (!event.metaKey && !event.ctrlKey)
        || event.altKey
      ) return;

      event.preventDefault();
      saveActive();
    };

    window.addEventListener('keydown', handleKeyboardSave);
    return () => window.removeEventListener('keydown', handleKeyboardSave);
  }, [saveActive]);

  return (
    <div className="board-file-controls">
      <span className="board-file-status" aria-live="polite">
        {activeSnapshotExists && <strong title={activeSavedBoardName ?? undefined}>{activeSavedBoardName}</strong>}
        <span className={status === 'Unsaved changes' ? 'unsaved' : undefined}>{status}</span>
      </span>
      <button ref={saveButton} className="primary header-file-button" type="button" onClick={saveActive}>
        Save
      </button>
      <button
        ref={boardsButton}
        className="secondary header-file-button"
        type="button"
        onClick={() => openDialog('browse', boardsButton.current)}
      >
        Boards
      </button>
      {error && dialogFocus === null && <span className="header-save-error" role="alert">{error}</span>}
      <span className="sr-only" aria-live="polite">{announcement}</span>

      {dialogFocus !== null && (
        <BoardFileDialog
          snapshots={snapshots}
          activeName={activeSavedBoardName}
          suggestedName={draft.title.trim() || 'My game board'}
          initialFocus={dialogFocus}
          error={error}
          onClose={closeDialog}
          onOpen={openBoard}
          onSaveAs={saveAs}
        />
      )}
    </div>
  );
}
