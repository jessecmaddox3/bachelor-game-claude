import type { BoardState } from './useBoard';

const GRADE_COLORS: Record<string, string> = { good: '#27763d', tight: '#e67e22', poor: '#c0392b' };

export function Preview({ board }: { board: BoardState }) {
  return (
    <div className="preview-pane">
      {board.status === 'ready' && (
        <div className="quality" data-testid="quality-badge" style={{ background: GRADE_COLORS[board.quality.grade] }}>
          {board.quality.grade.toUpperCase()} · {board.quality.bodyPt}pt
          <div className="advice">{board.quality.advice.join(' ')}</div>
        </div>
      )}
      {board.status === 'invalid' && (
        <div className="problems" data-testid="quality-badge">
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
        <div className="preview preview-empty">{board.status === 'loading' ? 'Rendering…' : 'Fix the items above to see the preview.'}</div>
      )}
    </div>
  );
}
