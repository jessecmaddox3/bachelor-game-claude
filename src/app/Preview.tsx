import type { BoardState } from './useBoard';

export function Preview({ board }: { board: BoardState }) {
  return (
    <div className="preview-pane">
      {board.status === 'ready' && (
        <div className={`quality quality-${board.quality.grade}`} data-testid="quality-badge">
          {board.quality.grade.toUpperCase()} · {board.quality.bodyPt}pt
          <div className="advice">{board.quality.advice.join(' ')}</div>
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
        <div className="problems" data-testid="quality-badge">{board.reason}</div>
      )}
      {board.status === 'ready' ? (
        // The engine SVG is self-generated markup: renderSvg XML-escapes all user
        // text content AND color attributes (fill/stroke, verified in Plan 2).
        <div className="preview" dangerouslySetInnerHTML={{ __html: board.svg }} />
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
    </div>
  );
}
