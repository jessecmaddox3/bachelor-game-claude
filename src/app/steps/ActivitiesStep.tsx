import { useMemo, useState } from 'react';
import { useWizardStore } from '../../store/wizardStore';
import type { Draft } from '../../store/toBoardSpec';
import {
  ACTIVITY_LIBRARY,
  ACTIVITY_OCCASION_LABELS,
  RECOMMENDED_ACTIVITY_IDS,
  type ActivityBrowseCategory,
  type PresetActivity,
} from '../../content/activities';
import { activityRelevance, groupActivitiesForOccasion } from '../../content/activityBrowse';
import type { LetterFit } from '../../engine';
import { pointsLabel } from '../../models/boardSpec';
import { shortLetterFitMessage } from '../letterFit';

function activityRow(a: PresetActivity): Draft['activities'][number] {
  return {
    uid: crypto.randomUUID(), catalogId: a.id, name: a.name, points: a.points,
    ...(a.maxPoints !== undefined ? { maxPoints: a.maxPoints } : {}), bonus: false,
  };
}

export function ActivitiesStep({ fit }: { fit?: LetterFit } = {}) {
  const { draft, patch, setStep } = useWizardStore();
  const [query, setQuery] = useState('');
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<ActivityBrowseCategory>>(() => new Set());
  const [customIdeaOpen, setCustomIdeaOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const occasionLabel = ACTIVITY_OCCASION_LABELS[draft.libraryOccasion];

  const selectedIndex = (item: PresetActivity) => draft.activities.findIndex((row) =>
    row.catalogId === item.id || (!row.catalogId && row.name === item.name),
  );
  const isSelected = (item: PresetActivity) => selectedIndex(item) >= 0;

  const q = query.trim().toLowerCase();
  const groups = useMemo(() => {
    const matches = ACTIVITY_LIBRARY.filter((item) =>
      (!q || `${item.name} ${item.instruction}`.toLowerCase().includes(q))
      && (!selectedOnly || isSelected(item)),
    );
    return groupActivitiesForOccasion(matches, draft.libraryOccasion);
  }, [draft.activities, draft.libraryOccasion, q, selectedOnly]);
  const customActivities = draft.activities.filter((row) => {
    if (row.catalogId) return false;
    return !q || row.name.toLowerCase().includes(q);
  });

  // A selected idea can become unavailable when the occasion changes (e.g. an
  // adult activity after switching to a kids weekend). It then drops out of every
  // browse group, so an item stays counted while invisible — track those here so
  // they can be seen and removed instead of riding along onto the wrong poster.
  const hiddenSelections = useMemo(() => draft.activities.flatMap((row) => {
    if (!row.catalogId) return [];
    const item = ACTIVITY_LIBRARY.find((entry) => entry.id === row.catalogId);
    if (!item || groupActivitiesForOccasion([item], draft.libraryOccasion).length > 0) return [];
    return [{ row, item }];
  }), [draft.activities, draft.libraryOccasion]);
  const hiddenSelectionsShown = selectedOnly
    ? hiddenSelections.filter(({ item }) => !q || `${item.name} ${item.instruction}`.toLowerCase().includes(q))
    : [];

  const toggle = (item: PresetActivity) => {
    const index = selectedIndex(item);
    if (index >= 0) {
      patch({ activities: draft.activities.filter((_, i) => i !== index) });
    } else if (draft.activities.length < 80) {
      patch({ activities: [...draft.activities, activityRow(item)] });
    }
  };

  const addRecommended = () => {
    const selectedIds = new Set(draft.activities.map((row) => row.catalogId).filter(Boolean));
    const selectedNames = new Set(draft.activities.map((row) => row.name));
    const additions = RECOMMENDED_ACTIVITY_IDS[draft.libraryOccasion]
      .filter((id) => !selectedIds.has(id))
      .map((id) => ACTIVITY_LIBRARY.find((item) => item.id === id))
      .filter((item): item is PresetActivity => Boolean(item))
      .filter((item) => !selectedNames.has(item.name))
      .slice(0, Math.max(0, 80 - draft.activities.length))
      .map(activityRow);
    patch({ activities: [...draft.activities, ...additions] });
  };

  const addCustomIdea = () => {
    const name = customName.trim().slice(0, 90);
    if (!name || draft.activities.length >= 80) return;
    patch({ activities: [...draft.activities, { uid: crypto.randomUUID(), name, points: 1, bonus: false }] });
    setCustomName('');
    setCustomIdeaOpen(false);
  };

  const clearAll = () => {
    if (draft.activities.length === 0) return;
    if (!window.confirm('Clear all selected activities? This removes every idea on the board, including custom ones.')) return;
    patch({ activities: [] });
  };

  return (
    <div className="activity-step">
      <div className="step-heading">
        <div>
          <span className="eyebrow">{occasionLabel} ideas</span>
          <h2>Build the challenge list</h2>
          <p>Start with the occasion-ranked ideas, then search the complete catalog.</p>
        </div>
        <div className="selection-count" role="status" aria-live="polite">
          <strong>{draft.activities.length}</strong><span>selected</span>
          {fit && <span className="selection-fit">{shortLetterFitMessage(fit)}</span>}
        </div>
      </div>

      {hiddenSelections.length > 0 && (
        <p className="selection-hidden-notice" role="status">
          {hiddenSelections.length} selected {hiddenSelections.length === 1 ? 'idea isn’t' : 'ideas aren’t'} shown for this occasion.{' '}
          <button type="button" className="text-button" onClick={() => setSelectedOnly(true)}>See them under Selected only</button>
        </p>
      )}

      <p className="activity-customization-note">You can customize points and text for each activity later.</p>
      <div className="picker-toolbar picker-toolbar-single">
        <div className="field search-field">
          <label htmlFor="activitySearch">Search ideas</label>
          <input id="activitySearch" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try karaoke, outdoors, story…" />
        </div>
      </div>

      <div className="picker-actions">
        <button className="primary" onClick={addRecommended}>Add recommended set</button>
        <button className="secondary" onClick={() => setCustomIdeaOpen((open) => !open)} disabled={draft.activities.length >= 80}>Add a new activity</button>
        <button className={selectedOnly ? 'chip on' : 'chip'} aria-pressed={selectedOnly} onClick={() => setSelectedOnly((value) => !value)}>Selected only</button>
        <button className="ghost clear-all-button" onClick={clearAll} disabled={draft.activities.length === 0}>Clear all</button>
      </div>

      {customIdeaOpen && (
        <form className="custom-idea-form" onSubmit={(event) => { event.preventDefault(); addCustomIdea(); }}>
          <div className="custom-idea-heading">
            <strong>Add an idea to this board</strong>
            <span>Saved on this device.</span>
          </div>
          <div className="field custom-name-field">
            <label htmlFor="customActivityName">Activity name</label>
            <input id="customActivityName" value={customName} maxLength={90} autoFocus onChange={(event) => setCustomName(event.target.value)} placeholder="What should someone do?" />
          </div>
          <button className="primary" type="submit" disabled={!customName.trim()}>Add idea</button>
          <button className="ghost" type="button" onClick={() => { setCustomIdeaOpen(false); setCustomName(''); }}>Cancel</button>
        </form>
      )}

      {(groups.length > 0 || customActivities.length > 0) && (
        <nav className="category-jumps" aria-label="Jump to category">
          {customActivities.length > 0 && (
            <button className="chip" onClick={() => document.getElementById('activity-group-custom')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Your board</button>
          )}
          {groups.map((group) => (
            <button
              className="chip"
              key={group.category}
              onClick={() => document.getElementById(`activity-group-${group.category}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              {group.label}
            </button>
          ))}
        </nav>
      )}

      {draft.activities.length < 5 && <div className="problems">Choose at least five activities to build a board.</div>}
      <div className="activity-groups" aria-label="Activity ideas">
        {customActivities.length > 0 && (
          <section className="activity-group custom-activity-group" id="activity-group-custom" aria-labelledby="activity-heading-custom">
            <div className="activity-group-heading">
              <h3 id="activity-heading-custom">Your board</h3>
              <span>{customActivities.length} selected</span>
            </div>
            <div className="activity-row-list">
              {customActivities.map((row) => (
                <label className="activity-row selected" data-activity-id={`custom-${row.uid}`} key={row.uid}>
                  <input
                    type="checkbox"
                    aria-label={`Remove ${row.name}`}
                    checked
                    onChange={() => patch({ activities: draft.activities.filter((activity) => activity.uid !== row.uid) })}
                  />
                  <span className="activity-row-copy">
                    <strong>{row.name}</strong>
                    <span>Custom idea for this board</span>
                  </span>
                  <span className="activity-row-points">{pointsLabel(row.points)} {typeof row.points === 'number' && row.points === 1 ? 'pt' : 'pts'}</span>
                  <span className="activity-row-level relevance-0">Your idea</span>
                </label>
              ))}
            </div>
          </section>
        )}
        {groups.map((group) => {
          const showAll = Boolean(query.trim()) || selectedOnly || expandedCategories.has(group.category);
          const visible = showAll ? group.activities : group.activities.slice(0, 8);
          const remaining = group.activities.length - visible.length;
          const selectedCount = group.activities.filter(isSelected).length;
          return (
            <section className="activity-group" id={`activity-group-${group.category}`} key={group.category} aria-labelledby={`activity-heading-${group.category}`}>
              <div className="activity-group-heading">
                <h3 id={`activity-heading-${group.category}`}>{group.label}</h3>
                <span>{selectedCount} selected · {group.activities.length} ideas</span>
              </div>
              <div className="activity-row-list">
                {visible.map((item) => {
                  const checked = isSelected(item);
                  const relevance = activityRelevance(item, draft.libraryOccasion);
                  return (
                    <label className={checked ? 'activity-row selected' : 'activity-row'} data-activity-id={item.id} key={item.id}>
                      <input
                        type="checkbox"
                        aria-label={`${checked ? 'Remove' : 'Add'} ${item.name}`}
                        checked={checked}
                        disabled={!checked && draft.activities.length >= 80}
                        onChange={() => toggle(item)}
                      />
                      <span className="activity-row-copy">
                        <strong>{item.name}</strong>
                        <span>{item.instruction}</span>
                      </span>
                      <span className="activity-row-points">{pointsLabel(item.points)} {typeof item.points === 'number' && item.points === 1 ? 'pt' : 'pts'}</span>
                      <span className={`activity-row-level relevance-${relevance}`}>{relevance === 0 ? 'Top match' : item.difficulty}</span>
                    </label>
                  );
                })}
              </div>
              {remaining > 0 && (
                <button className="show-more" onClick={() => setExpandedCategories((current) => new Set(current).add(group.category))}>Show {remaining} more</button>
              )}
            </section>
          );
        })}
        {hiddenSelectionsShown.length > 0 && (
          <section className="activity-group" id="activity-group-hidden" aria-labelledby="activity-heading-hidden">
            <div className="activity-group-heading">
              <h3 id="activity-heading-hidden">Selected but not shown here</h3>
              <span>{hiddenSelectionsShown.length} selected</span>
            </div>
            <div className="activity-row-list">
              {hiddenSelectionsShown.map(({ row, item }) => (
                <label className="activity-row selected" data-activity-id={item.id} key={row.uid}>
                  <input
                    type="checkbox"
                    aria-label={`Remove ${item.name}`}
                    checked
                    onChange={() => patch({ activities: draft.activities.filter((activity) => activity.uid !== row.uid) })}
                  />
                  <span className="activity-row-copy">
                    <strong>{item.name}</strong>
                    <span>Not shown for this occasion</span>
                  </span>
                  <span className="activity-row-points">{pointsLabel(row.points)} {typeof row.points === 'number' && row.points === 1 ? 'pt' : 'pts'}</span>
                  <span className="activity-row-level">{item.difficulty}</span>
                </label>
              ))}
            </div>
          </section>
        )}
      </div>
      {groups.length === 0 && customActivities.length === 0 && hiddenSelectionsShown.length === 0 && (
        <div className="empty-state">
          No ideas match “{query.trim()}”. <button className="text-button" onClick={() => { setQuery(''); setSelectedOnly(false); }}>Clear search</button>
        </div>
      )}

      <details className="advanced-section">
        <summary>Board scoring options <span>Optional</span></summary>
        <div className="options-grid">
          <div className="field"><label htmlFor="rangeFormat">Range display</label><select id="rangeFormat" value={draft.pointsRangeFormat} onChange={(e) => patch({ pointsRangeFormat: e.target.value as Draft['pointsRangeFormat'] })}><option value="words">1 to 5</option><option value="dash">1-5</option></select></div>
          <div className="field"><label htmlFor="totalsTarget">Total-points target</label><input id="totalsTarget" type="number" min={0} max={9999} value={draft.totalsTarget ?? ''} onChange={(e) => {
            if (e.target.value === '') return patch({ totalsTarget: undefined });
            const value = Number(e.target.value);
            if (Number.isInteger(value)) patch({ totalsTarget: Math.max(0, Math.min(9999, value)) });
          }} /></div>
          <div className="field"><label htmlFor="writeins">Blank write-in rows</label><input id="writeins" type="number" min={0} max={5} value={draft.writeInRows} onChange={(e) => patch({ writeInRows: Math.max(0, Math.min(5, Number(e.target.value) || 0)) })} /></div>
          {draft.honoree && (
            <div className="field checkbox-field"><input id="honoreeBonus" type="checkbox" checked={draft.honoreeBonusRow} onChange={(e) => patch({ honoreeBonusRow: e.target.checked })} /><label htmlFor="honoreeBonus">Honoree bonus row</label></div>
          )}
        </div>
      </details>

      <div className="step-footer"><button className="ghost" onClick={() => setStep(0)}>Back to setup</button><button className="primary" onClick={() => setStep(2)}>Continue to design</button></div>
    </div>
  );
}
