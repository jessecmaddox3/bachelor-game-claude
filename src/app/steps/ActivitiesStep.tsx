import { useState } from 'react';
import { useWizardStore } from '../../store/wizardStore';
import type { Draft } from '../../store/toBoardSpec';
import { ACTIVITY_LIBRARY, ACTIVITY_CATEGORIES, type ActivityCategory } from '../../content/activities';
import { pointsLabel } from '../../models/boardSpec';
import { parsePointsInput } from '../../store/toBoardSpec';

export function ActivitiesStep() {
  const { draft, patch } = useWizardStore();
  const [category, setCategory] = useState<ActivityCategory | 'all'>('all');

  const inBoard = new Set(draft.activities.map((a) => a.name));
  const library = ACTIVITY_LIBRARY.filter((a) => (category === 'all' || a.category === category) && !inBoard.has(a.name));

  const setActivity = (i: number, p: Partial<Draft['activities'][number]>) =>
    patch({ activities: draft.activities.map((a, j) => (j === i ? { ...a, ...p } : a)) });

  return (
    <div>
      <h2>On the board ({draft.activities.length}/80)</h2>
      <table className="activities">
        <thead>
          <tr><th>Activity</th><th>Points</th><th>Max</th><th>Bonus</th><th /></tr>
        </thead>
        <tbody>
          {draft.activities.map((a, i) => (
            <tr key={`${a.name}-${i}`}>
              <td><input value={a.name} maxLength={90} onChange={(e) => setActivity(i, { name: e.target.value })} /></td>
              <td>
                <input
                  className="points"
                  defaultValue={pointsLabel(a.points)}
                  onBlur={(e) => {
                    const v = parsePointsInput(e.target.value);
                    if (v !== null) setActivity(i, { points: v });
                    else e.target.value = pointsLabel(a.points);
                  }}
                  title='A number, a range like "1 to 6", or TBD'
                />
              </td>
              <td>
                <input
                  className="points"
                  value={a.maxPoints ?? ''}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setActivity(i, { maxPoints: e.target.value === '' || !Number.isInteger(n) || n < 1 ? undefined : Math.min(n, 99) });
                  }}
                  placeholder="—"
                  title="Cumulative cap for repeatable activities; blank = once only"
                />
              </td>
              <td>
                <input type="checkbox" checked={a.bonus} aria-label={`Bonus: ${a.name}`} onChange={(e) => setActivity(i, { bonus: e.target.checked })} />
              </td>
              <td>
                <button className="ghost" aria-label={`Remove ${a.name}`} onClick={() => patch({ activities: draft.activities.filter((_, j) => j !== i) })}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        className="ghost"
        onClick={() => patch({ activities: [...draft.activities, { name: 'New activity', points: 1, bonus: false }] })}
      >
        + Custom activity
      </button>

      <h2>Options</h2>
      <div className="field row">
        <label htmlFor="writeins">Blank write-in rows</label>
        <input
          id="writeins"
          type="number"
          min={0}
          max={5}
          value={draft.writeInRows}
          onChange={(e) => patch({ writeInRows: Math.max(0, Math.min(5, Number(e.target.value) || 0)) })}
        />
      </div>
      <div className="field row">
        <input
          id="honoreeBonus"
          type="checkbox"
          checked={draft.honoreeBonusRow}
          onChange={(e) => patch({ honoreeBonusRow: e.target.checked })}
        />
        <label htmlFor="honoreeBonus">Honoree bonus row (−5 to 5, granted by the honoree)</label>
      </div>

      <h2>Library</h2>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        {(['all', ...ACTIVITY_CATEGORIES] as const).map((c) => (
          <button key={c} className={category === c ? 'chip on' : 'chip'} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>
      <table className="activities">
        <tbody>
          {library.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{pointsLabel(a.points)}{a.maxPoints ? ` (max ${a.maxPoints})` : ''}</td>
              <td>
                <button
                  className="ghost"
                  aria-label={`Add ${a.name}`}
                  disabled={draft.activities.length >= 80}
                  onClick={() => patch({ activities: [...draft.activities, { name: a.name, points: a.points, ...(a.maxPoints !== undefined ? { maxPoints: a.maxPoints } : {}), bonus: false }] })}
                >
                  Add
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
