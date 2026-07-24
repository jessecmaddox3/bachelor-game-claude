import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { SavedBoardSnapshot } from '../store/savedBoards';

export interface BuiltInBoardOption {
  id: string;
  name: string;
  description: string;
}

interface BoardFileDialogProps {
  builtInBoards: BuiltInBoardOption[];
  snapshots: SavedBoardSnapshot[];
  activeName: string | null;
  suggestedName: string;
  initialFocus: 'browse' | 'save';
  error: string;
  onClose: () => void;
  onOpenBuiltIn: (id: string) => void;
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
  builtInBoards,
  snapshots,
  activeName,
  suggestedName,
  initialFocus,
  error,
  onClose,
  onOpenBuiltIn,
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
      : element.querySelector<HTMLButtonElement>('.browser-board-list [data-board-open]')
        ?? element.querySelector<HTMLButtonElement>('[data-board-open]')
        ?? closeButton.current;
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
      aria-labelledby="boards-heading"
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
            <span className="eyebrow">Board library</span>
            <h2 id="boards-heading">Boards</h2>
          </div>
          <button ref={closeButton} className="ghost" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <section className="board-library-section" aria-labelledby="built-in-boards-heading">
          <div className="board-library-heading">
            <h3 id="built-in-boards-heading">Built-in boards</h3>
            <span>Ready to customize</span>
          </div>
          <div className="saved-board-list built-in-board-list">
            {builtInBoards.map((board) => (
              <div className="saved-board-row built-in" key={board.id}>
                <div className="saved-board-copy">
                  <strong>{board.name}</strong>
                  <span>{board.description}</span>
                </div>
                <button
                  className="secondary"
                  type="button"
                  data-board-open
                  aria-label={`Open built-in board ${board.name}`}
                  onClick={() => onOpenBuiltIn(board.id)}
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="board-library-section" aria-labelledby="browser-boards-heading">
          <div className="board-library-heading">
            <h3 id="browser-boards-heading">Saved in this browser</h3>
          </div>
          <div className="saved-board-list browser-board-list">
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
        </section>

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
