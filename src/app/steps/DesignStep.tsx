import { useState } from 'react';
import { useWizardStore } from '../../store/wizardStore';
import { THEME_PRESETS } from '../../content/themes';
import { toBoardSpec } from '../../store/toBoardSpec';
import { buildBoard, planPngScale, type FontMetrics, type FontBuffers } from '../../engine';
import { exportPdf, exportPng } from '../export';
import type { BoardState } from '../useBoard';

const HEX = /^#[0-9a-fA-F]{6}$/;

// `clearable` marks the fields where '' is a valid value (tint disabled); the
// other colors are required, so clearing them would crash the renderers.
const COLOR_FIELDS: Array<{ key: 'titleColor' | 'accentColor' | 'activityColor' | 'highlightColor' | 'rowTint' | 'pointsColTint' | 'maxPointsColTint'; label: string; clearable: boolean }> = [
  { key: 'titleColor', label: 'Title', clearable: false },
  { key: 'accentColor', label: 'Accents', clearable: false },
  { key: 'activityColor', label: 'Activities', clearable: false },
  { key: 'highlightColor', label: 'Highlights', clearable: false },
  { key: 'rowTint', label: 'Row tint', clearable: false },
  { key: 'pointsColTint', label: 'Points column tint', clearable: true },
  { key: 'maxPointsColTint', label: 'Max points column tint', clearable: true },
];

export function DesignStep({ board, metrics, buffers }: { board: BoardState; metrics: FontMetrics; buffers: FontBuffers | null }) {
  const { draft, patch } = useWizardStore();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const setTheme = (p: Partial<typeof draft.theme>) => patch({ theme: { ...draft.theme, ...p } });

  const doExport = async (kind: 'pdf' | 'png') => {
    if (!buffers) return;
    const validated = toBoardSpec(draft);
    if (!validated.ok) {
      setNote('Fix the issues shown in the preview panel first.');
      return;
    }
    const built = buildBoard(validated.spec, metrics);
    if (!built.ok) {
      setNote('Fix the issues shown in the preview panel first.');
      return;
    }
    setBusy(kind);
    setNote('');
    try {
      if (kind === 'pdf') {
        await exportPdf(built.scene, metrics, buffers, draft.honoree, draft.posterSize);
      } else {
        const dpi = await exportPng(built.scene, metrics, buffers, draft.honoree, draft.posterSize);
        if (dpi < 300) setNote(`PNG exported at ${dpi} DPI (browser canvas limit for this size). The PDF export is full quality at any size.`);
      }
    } catch (err) {
      setNote(String(err instanceof Error ? err.message : err));
    } finally {
      setBusy(null);
    }
  };

  const pngPlan = planPngScale(...(draft.posterSize.split('x').map(Number) as [number, number]), 300);

  return (
    <div>
      <h2>Theme</h2>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        {THEME_PRESETS.map((p) => (
          <button key={p.id} className="chip" title={p.description} onClick={() => patch({ theme: structuredClone(p.theme) })}>{p.name}</button>
        ))}
      </div>
      {COLOR_FIELDS.map(({ key, label, clearable }) => (
        <div className="field row" key={key}>
          <label htmlFor={`c-${key}`}>{label}</label>
          <input
            id={`c-${key}`}
            type="color"
            value={HEX.test(draft.theme[key] ?? '') ? (draft.theme[key] as string) : '#141414'}
            onChange={(e) => setTheme({ [key]: e.target.value })}
          />
          {clearable && (
            <button className="ghost" onClick={() => setTheme({ [key]: '' })} title="Clear tint">clear</button>
          )}
        </div>
      ))}
      <div className="field row">
        <input id="allcaps" type="checkbox" checked={draft.theme.allCaps ?? false} onChange={(e) => setTheme({ allCaps: e.target.checked })} />
        <label htmlFor="allcaps">ALL-CAPS activity names</label>
      </div>
      <div className="field">
        <label htmlFor="cornerLabel">Corner label</label>
        <input id="cornerLabel" value={draft.theme.cornerLabel ?? ''} maxLength={20} onChange={(e) => setTheme({ cornerLabel: e.target.value })} />
      </div>

      <h2>Corner boxes</h2>
      {draft.cornerBoxes.map((label, i) => (
        <div className="row" key={i}>
          <input value={label} maxLength={30} onChange={(e) => patch({ cornerBoxes: draft.cornerBoxes.map((x, j) => (j === i ? e.target.value : x)) })} />
          <button className="ghost" onClick={() => patch({ cornerBoxes: draft.cornerBoxes.filter((_, j) => j !== i) })}>×</button>
        </div>
      ))}
      {draft.cornerBoxes.length < 3 && (
        <button className="ghost" onClick={() => patch({ cornerBoxes: [...draft.cornerBoxes, 'NEW BOX'] })}>+ Corner box</button>
      )}

      <h2>Rules</h2>
      {draft.rules.map((r, i) => (
        <div className="field" key={i}>
          <div className="row">
            <input
              placeholder="HEADING (optional)"
              value={r.heading ?? ''}
              maxLength={40}
              onChange={(e) => patch({ rules: draft.rules.map((x, j) => (j === i ? { ...x, heading: e.target.value || undefined } : x)) })}
            />
            <button className="ghost" onClick={() => patch({ rules: draft.rules.filter((_, j) => j !== i) })}>×</button>
          </div>
          <textarea
            value={r.text}
            maxLength={300}
            onChange={(e) => patch({ rules: draft.rules.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })}
          />
        </div>
      ))}
      {draft.rules.length < 12 && (
        <button className="ghost" onClick={() => patch({ rules: [...draft.rules, { text: 'New rule' }] })}>+ Rule</button>
      )}
      <div className="field">
        <label htmlFor="footnote">Footnote (optional)</label>
        <input id="footnote" value={draft.footnote} maxLength={200} onChange={(e) => patch({ footnote: e.target.value })} />
      </div>

      <h2>Export</h2>
      <div className="row">
        <button className="primary" disabled={board.status !== 'ready' || busy !== null || !buffers} onClick={() => doExport('pdf')}>
          {busy === 'pdf' ? 'Rendering…' : 'Download PDF (print quality)'}
        </button>
        <button className="primary" disabled={board.status !== 'ready' || busy !== null || !buffers} onClick={() => doExport('png')}>
          {busy === 'png' ? 'Rendering…' : `Download PNG (${pngPlan.dpi} DPI)`}
        </button>
      </div>
      {note && <div className="problems">{note}</div>}
    </div>
  );
}
