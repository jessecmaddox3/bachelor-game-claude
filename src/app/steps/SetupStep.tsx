import { useRef, useState } from 'react';
import { useWizardStore } from '../../store/wizardStore';
import { ACTIVITY_OCCASIONS, ACTIVITY_OCCASION_LABELS, type ActivityOccasion } from '../../content/activities';
import { OCCASION_PACKS, occasionById } from '../../content/occasions';
import { defaultDraft, sortParticipantNames } from '../../store/toBoardSpec';

// Obviously-example (never personal) titles so the placeholder matches the
// chosen occasion instead of assuming a specific person's bachelor weekend.
const TITLE_PLACEHOLDERS: Record<ActivityOccasion, string> = {
  bachelor: 'The Lake House Bachelor Weekend',
  bachelorette: 'The City Bachelorette Weekend',
  'kids-weekend': 'Cousins Camp Weekend',
  anniversary: 'Our Anniversary Weekend',
  'family-reunion': 'The Summer Family Reunion',
  'friends-weekend': 'The Annual Friends Weekend',
  'beach-trip': 'The Beach House Games',
  general: 'The Weekend Games',
};
const SUBTITLE_PLACEHOLDER = 'June 12–14 · Lake Cabin';

function playerNames(value: string): string[] {
  return value
    .split(/[,;\n]+/)
    .map((name) => name.trim().slice(0, 24))
    .filter(Boolean);
}

export function SetupStep() {
  const { draft, patch, replaceDraft, setStep } = useWizardStore();
  const [newPlayer, setNewPlayer] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [presetId, setPresetId] = useState(OCCASION_PACKS[0]?.id ?? '');
  const playerInput = useRef<HTMLInputElement>(null);

  const addPlayers = (value = newPlayer) => {
    const additions = playerNames(value).slice(0, Math.max(0, 35 - draft.players.length));
    if (additions.length > 0) patch({ players: sortParticipantNames([...draft.players, ...additions]) });
    setNewPlayer('');
    playerInput.current?.focus();
  };

  const beginEditing = (index: number) => {
    setEditingIndex(index);
    setEditingName(draft.players[index] ?? '');
  };

  const finishEditing = () => {
    if (editingIndex === null) return;
    const name = editingName.trim().slice(0, 24);
    patch({
      players: sortParticipantNames(name
        ? draft.players.map((player, index) => (index === editingIndex ? name : player))
        : draft.players.filter((_, index) => index !== editingIndex)),
    });
    setEditingIndex(null);
    setEditingName('');
  };

  const loadPreset = () => {
    const preset = occasionById(presetId);
    if (!preset) return;
    const hasWork = JSON.stringify(draft) !== JSON.stringify(defaultDraft());
    if (hasWork && !window.confirm('Load this preset? It replaces your current board.')) return;
    replaceDraft(preset.createDraft());
    setEditingIndex(null);
    setNewPlayer('');
  };

  return (
    <div className="setup-step">
      <div className="step-heading">
        <div>
          <span className="eyebrow">Step 1</span>
          <h2>Set up the weekend</h2>
          <p>Choose the occasion, name the board, and confirm who’s joining.</p>
        </div>
      </div>

      <section className="setup-section occasion-section" aria-labelledby="occasion-heading">
        <div className="section-heading">
          <div>
            <h3 id="occasion-heading">Choose an occasion</h3>
            <p>This tailors the activity ideas in the next step.</p>
          </div>
        </div>
        <div className="occasion-layout">
          <fieldset className="occasion-options">
            <legend className="sr-only">What’s the occasion?</legend>
            {ACTIVITY_OCCASIONS.map((occasion) => (
              <label className="occasion-card" key={occasion}>
                <input
                  type="radio"
                  name="occasion"
                  value={occasion}
                  checked={draft.libraryOccasion === occasion}
                  onChange={() => patch({ libraryOccasion: occasion })}
                />
                <span>{ACTIVITY_OCCASION_LABELS[occasion]}</span>
              </label>
            ))}
          </fieldset>
          <aside className="preset-panel" aria-labelledby="preset-heading">
            <span className="preset-kicker">Start quickly</span>
            <h4 id="preset-heading">Use an occasion preset</h4>
            <p>Start from a ready-made roster, activities, and design.</p>
            <div className="field">
              <label htmlFor="occasionPreset">Occasion preset</label>
              <select id="occasionPreset" value={presetId} onChange={(event) => setPresetId(event.target.value)}>
                {OCCASION_PACKS.map((pack) => <option key={pack.id} value={pack.id}>{pack.name}</option>)}
              </select>
            </div>
            <button className="secondary" onClick={loadPreset}>Load preset</button>
            <small>{occasionById(presetId)?.description}</small>
          </aside>
        </div>
      </section>

      <section className="setup-section" aria-labelledby="event-heading">
        <div className="section-heading">
          <div>
            <h3 id="event-heading">Name the board</h3>
            <p>Keep it short. These lines become the poster headline.</p>
          </div>
        </div>
        <div className="setup-grid">
          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" value={draft.title} onChange={(event) => patch({ title: event.target.value })} maxLength={60} placeholder={TITLE_PLACEHOLDERS[draft.libraryOccasion]} />
          </div>
          <div className="field">
            <label htmlFor="subtitle">Subtitle</label>
            <input id="subtitle" value={draft.subtitle} onChange={(event) => patch({ subtitle: event.target.value })} maxLength={80} placeholder={SUBTITLE_PLACEHOLDER} />
          </div>
        </div>
      </section>

      <section className="setup-section" aria-labelledby="players-heading">
        <div className="section-heading roster-heading">
          <div>
            <h3 id="players-heading">Participants</h3>
            <p>Enter one name at a time, or paste a comma-separated list.</p>
          </div>
          <span className="roster-count">{draft.players.length}/35</span>
        </div>

        <div className="field player-composer-field">
          <label htmlFor="playerComposer">Add participants</label>
          <div className="player-composer">
            <input
              ref={playerInput}
              id="playerComposer"
              value={newPlayer}
              placeholder="Type a name and press Enter"
              autoComplete="off"
              onChange={(event) => setNewPlayer(event.target.value.slice(0, 900))}
              onPaste={(event) => {
                const pasted = event.clipboardData.getData('text');
                if (!/[,;\n]/.test(pasted)) return;
                event.preventDefault();
                addPlayers(pasted);
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                addPlayers();
              }}
              disabled={draft.players.length >= 35}
            />
            <button className="secondary" onClick={() => addPlayers()} disabled={!newPlayer.trim() || draft.players.length >= 35}>Add participants</button>
          </div>
        </div>

        {draft.players.length === 0 ? (
          <div className="roster-empty">Add everyone who’s playing. You can paste a list here too.</div>
        ) : (
          <div className="roster-chips" role="list" aria-label="Participants">
            {draft.players.map((player, index) => (
              <span className="player-chip" role="listitem" key={`${index}-${player}`}>
                {editingIndex === index ? (
                  <input
                    className="player-chip-input"
                    aria-label={`Edit ${player}`}
                    value={editingName}
                    maxLength={24}
                    autoFocus
                    onChange={(event) => setEditingName(event.target.value)}
                    onBlur={finishEditing}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        finishEditing();
                      }
                      if (event.key === 'Escape') {
                        setEditingIndex(null);
                        setEditingName('');
                      }
                    }}
                  />
                ) : (
                  <button className="player-chip-name" aria-label={`Edit ${player}`} onClick={() => beginEditing(index)}>{player}</button>
                )}
                <button
                  className="player-chip-remove"
                  aria-label={`Remove ${player}`}
                  onClick={() => {
                    patch({ players: draft.players.filter((_, playerIndex) => playerIndex !== index) });
                    if (editingIndex === index) setEditingIndex(null);
                  }}
                >×</button>
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="step-footer"><span /><button className="primary" onClick={() => setStep(1)}>Continue to activities</button></div>
    </div>
  );
}
