import { useState } from 'react';
import type { PresetActivity } from '../content/activities';
import { pointsLabel } from '../models/boardSpec';

interface ActivityPickerRowProps {
  item: PresetActivity;
  checked: boolean;
  disabled: boolean;
  relevance: number;
  onToggle: () => void;
}

export function ActivityPickerRow({
  item,
  checked,
  disabled,
  relevance,
  onToggle,
}: ActivityPickerRowProps) {
  const [expanded, setExpanded] = useState(false);
  const descriptionId = `activity-description-${item.id}`;

  return (
    <div
      className={`${checked ? 'activity-row selected' : 'activity-row'}${expanded ? ' expanded' : ''}`}
      data-activity-id={item.id}
    >
      <label className="activity-row-select">
        <input
          type="checkbox"
          aria-label={`${checked ? 'Remove' : 'Add'} ${item.name}`}
          checked={checked}
          disabled={disabled}
          onChange={onToggle}
        />
        <span className="activity-row-copy">
          <strong>{item.name}</strong>
          <span id={descriptionId}>{item.instruction}</span>
        </span>
      </label>
      <span className="activity-row-points">
        {pointsLabel(item.points)} {typeof item.points === 'number' && item.points === 1 ? 'pt' : 'pts'}
      </span>
      <span className={`activity-row-level relevance-${relevance}`}>
        {relevance === 0 ? 'Top match' : item.difficulty}
      </span>
      <button
        className="activity-row-details"
        type="button"
        aria-expanded={expanded}
        aria-controls={descriptionId}
        aria-label={`${expanded ? 'Hide' : 'Show'} details for ${item.name}`}
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? 'Hide' : 'Details'}
      </button>
    </div>
  );
}
