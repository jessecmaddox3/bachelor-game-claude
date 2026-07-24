import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { SavedBoardSnapshot } from '../store/savedBoards';

interface BoardFileDialogProps {
  snapshots: SavedBoardSnapshot[];
  activeName: string | null;
  suggestedName: string;
  initialFocus: 'browse' | 'save';
  error: string;
  onClose: () => void;
  onOpen: (name: string) => void;
  onSaveAs: (name: string) => boolean;
}

function savedAtLabel(savedAt: string): string {
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return 'Saved recently';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function BoardFileDialog({
  snapshots,
  activeName,
  suggestedName,
  initialFocus,
  error,
  onClose,
  onOpen,
  onSaveAs,
}: BoardFileDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const saveNameInput = useRef<HTMLInputElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [saveName, setSaveName] = useState(activeName ?? suggestedName);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;

    if (typeof element.showModal === 'function') {
      if (!element.open) element.showModal();
    } else {
      element.setAttribute('open', '');
    }

    const initialControl = initialFocus === 'save'
      ? saveNameInput.current
      : element.querySelector<HTMLButtonElement>('[data-board-open]') ?? closeButton.current;
    initialControl?.focus();

    return () => {
      if (element.open && typeof element.close === 'function') element.close();
    };
  }, [initialFocus]);

  const submitSaveAs = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSaveAs(saveName);
  };

  return (
    <dialog
      ref={dialog}
      className="board-file-dialog"
      aria-modal="true"
      aria-labelledby="saved-boards-heading"
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const outsideDialog = event.clientX < bounds.left
          || event.clientX > bounds.right
          || event.clientY < bounds.top
          || event.clientY > bounds.bottom;
        if (outsideDialog) onClose();
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
        <div className="board-file-dialog-heading">
          <div>
            <span className="eyebrow">Your browser</span>
            <h2 id="saved-boards-heading">Saved boards</h2>
          </div>
          <button ref={closeButton} className="ghost" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="saved-board-list" aria-label="Named boards">
          {snapshots.length === 0 ? (
            <p className="saved-board-empty">
              No named boards yet. Save this board below so you can return to it later.
            </p>
          ) : (
            snapshots.map((snapshot) => (
              <div
                className={`saved-board-row${snapshot.name === activeName ? ' active' : ''}`}
                key={snapshot.name}
              >
                <div className="saved-board-copy">
                  <strong>{snapshot.name}</strong>
                  <span>
                    {snapshot.name === activeName ? 'Current board · ' : ''}
                    {savedAtLabel(snapshot.savedAt)}
                  </span>
                </div>
                <button
                  className="secondary"
                  type="button"
                  data-board-open
                  aria-label={`Open ${snapshot.name}`}
                  onClick={() => onOpen(snapshot.name)}
                >
                  Open
                </button>
              </div>
            ))
          )}
        </div>

        <form className="board-save-as" onSubmit={submitSaveAs}>
          <div className="field">
            <label htmlFor="boardSaveAsName">Save name</label>
            <input
              ref={saveNameInput}
              id="boardSaveAsName"
              value={saveName}
              maxLength={80}
              placeholder="Kids weekend draft"
              onChange={(event) => setSaveName(event.target.value)}
            />
          </div>
          <button className="primary" type="submit" disabled={!saveName.trim()}>
            Save as
          </button>
        </form>

        {error && <p className="board-file-error" role="alert">{error}</p>}
        <p className="board-file-storage-note">
          Named boards are stored only in this browser. Your current working draft is also recovered automatically.
        </p>
    </dialog>
  );
}
