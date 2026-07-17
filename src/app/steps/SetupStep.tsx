import { useState } from 'react';
import { useWizardStore } from '../../store/wizardStore';
import { POSTER_SIZES, type PosterSizeId } from '../../engine';

export function SetupStep() {
  const { draft, patch } = useWizardStore();
  const [newPlayer, setNewPlayer] = useState('');

  const addPlayer = () => {
    const name = newPlayer.trim();
    if (!name || draft.players.length >= 35) return;
    patch({ players: [...draft.players, name] });
    setNewPlayer('');
  };

  return (
    <div>
      <h2>Event</h2>
      <div className="field">
        <label htmlFor="title">Title line</label>
        <input id="title" value={draft.title} onChange={(e) => patch({ title: e.target.value })} maxLength={60} />
      </div>
      <div className="field">
        <label htmlFor="honoree">Honoree</label>
        <input id="honoree" value={draft.honoree} onChange={(e) => patch({ honoree: e.target.value })} maxLength={30} />
      </div>
      <div className="field">
        <label htmlFor="subtitle">Subtitle / date line (optional)</label>
        <input id="subtitle" value={draft.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} maxLength={80} />
      </div>
      <div className="field">
        <label htmlFor="size">Poster size</label>
        <select id="size" value={draft.posterSize} onChange={(e) => patch({ posterSize: e.target.value as PosterSizeId })}>
          {Object.keys(POSTER_SIZES).map((s) => (
            <option key={s} value={s}>{s.replace('x', '" x ')}"</option>
          ))}
        </select>
      </div>

      <h2>Players ({draft.players.length}/35)</h2>
      <ul className="roster">
        {/* Index-only keys: these inputs are controlled, so an index key keeps
            focus while typing (a name-based key would change every keystroke
            and remount the row) and never goes stale on removal. */}
        {draft.players.map((p, i) => (
          <li key={i} className="row">
            <input
              value={p}
              maxLength={24}
              onChange={(e) => patch({ players: draft.players.map((x, j) => (j === i ? e.target.value : x)) })}
            />
            <button className="ghost" aria-label={`Remove ${p}`} onClick={() => patch({ players: draft.players.filter((_, j) => j !== i) })}>×</button>
          </li>
        ))}
      </ul>
      <div className="row">
        <input
          placeholder="Add player…"
          value={newPlayer}
          maxLength={24}
          onChange={(e) => setNewPlayer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
        />
        <button className="ghost" onClick={addPlayer}>Add</button>
      </div>
    </div>
  );
}
