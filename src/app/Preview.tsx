import { useEffect, useRef, useState } from 'react';
import type { BoardState } from './useBoard';
import { PreviewZoom } from './PreviewZoom';
import { letterFitMessage } from './letterFit';

export function Preview({ board }: { board: BoardState }) {
  const [zoomOpen, setZoomOpen] = useState(false);
  const zoomButtonRef = useRef<HTMLButtonElement>(null);
  const ready = board.status === 'ready';

  // Only a rendered scene is zoomable; drop out of the overlay if edits push
  // the board back into a loading/invalid/infeasible state.
  useEffect(() => {
    if (!ready) setZoomOpen(false);
  }, [ready]);

  const closeZoom = () => {
    setZoomOpen(false);
    zoomButtonRef.current?.focus();
  };

  return (
    <div className="preview-pane">
      {board.status === 'ready' && (
        <div className={`quality quality-${board.quality.grade}`} data-testid="quality-badge">
          {board.quality.grade.toUpperCase()} · {board.quality.bodyPt}pt
          <div className="advice">{board.quality.advice.join(' ')}</div>
          {board.fit && (
            <div className="letter-fit-guidance" data-testid="letter-fit-guidance">
              {letterFitMessage(board.fit)}
            </div>
          )}
        </div>
      )}
      {board.status === 'invalid' && (
        <div className="preview-checklist" data-testid="quality-badge">
          <strong>Preview checklist</strong>
          {board.errors.map((e) => (
            <div key={e.field}>{e.message}</div>
          ))}
        </div>
      )}
      {board.status === 'infeasible' && (
        <div className="problems" data-testid="quality-badge">
          {board.reason}
          {board.fit && (
            <div className="letter-fit-guidance" data-testid="letter-fit-guidance">
              {letterFitMessage(board.fit)}
            </div>
          )}
        </div>
      )}
      {board.status === 'ready' ? (
        <div className="preview">
          <button
            ref={zoomButtonRef}
            type="button"
            className="preview-zoom-button"
            aria-haspopup="dialog"
            aria-label="Enlarge preview to proof at full size"
            onClick={() => setZoomOpen(true)}
          >
            <span aria-hidden="true" className="preview-zoom-icon">⤢</span>
            Zoom
          </button>
          {/* Clicking the poster is a mouse convenience; the corner button above
              is the accessible, keyboard-reachable affordance (no duplicate AT
              stop here). The engine SVG is self-generated markup: renderSvg
              XML-escapes all user text and color attributes (verified in Plan 2). */}
          <div
            className="preview-surface"
            title="Click to enlarge"
            onClick={() => setZoomOpen(true)}
            dangerouslySetInnerHTML={{ __html: board.svg }}
          />
        </div>
      ) : (
        <div className="preview preview-empty">
          {board.status === 'loading' ? 'Rendering…' : (
            <div>
              <span>Live poster preview</span>
              <strong>Your board will take shape here.</strong>
              <p>Complete the checklist to generate the first layout.</p>
            </div>
          )}
        </div>
      )}
      {ready && zoomOpen && <PreviewZoom svg={board.svg} onClose={closeZoom} />}
    </div>
  );
}
