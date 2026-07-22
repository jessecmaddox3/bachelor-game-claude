import { useRef, useState } from 'react';
import { useWizardStore } from '../../store/wizardStore';
import { THEME_PRESETS } from '../../content/themes';
import { parsePointsInput, toBoardSpec } from '../../store/toBoardSpec';
import { buildBoard, planPngScale, POSTER_SIZES, type FontMetrics, type FontBuffers, type PosterSizeId } from '../../engine';
import { pointsLabel, POSTER_SIZE_LABELS } from '../../models/boardSpec';
import { exportPdf, exportPng, exportSvg } from '../export';
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
  const { draft, patch, setStep } = useWizardStore();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState('');
  // Bold only makes sense with a selection; track it so the button can signal
  // when it's a no-op instead of inserting empty `****` markers into the rules.
  const [rulesSelectionEmpty, setRulesSelectionEmpty] = useState(true);
  const rulesEditor = useRef<HTMLTextAreaElement>(null);
  const syncRulesSelection = () => {
    const editor = rulesEditor.current;
    setRulesSelectionEmpty(!editor || editor.selectionStart === editor.selectionEnd);
  };
  const setTheme = (p: Partial<typeof draft.theme>) => patch({ theme: { ...draft.theme, ...p } });
  const setActivity = (i: number, changes: Partial<typeof draft.activities[number]>) =>
    patch({ activities: draft.activities.map((row, j) => (j === i ? { ...row, ...changes } : row)) });

  const formatRules = (kind: 'bold' | 'bullets') => {
    const editor = rulesEditor.current;
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    // Bold with no selection would inject a bare `****`; make it a safe no-op.
    if (kind === 'bold' && start === end) return;
    const selected = draft.rulesContent.slice(start, end);
    const replacement = kind === 'bold'
      ? `**${selected}**`
      : (selected || draft.rulesContent).split('\n').map((line) => !line.trim() || line.startsWith('- ') ? line : `- ${line}`).join('\n');
    const replaceStart = kind === 'bullets' && !selected ? 0 : start;
    const replaceEnd = kind === 'bullets' && !selected ? draft.rulesContent.length : end;
    const next = `${draft.rulesContent.slice(0, replaceStart)}${replacement}${draft.rulesContent.slice(replaceEnd)}`;
    patch({ rulesContent: next });
    queueMicrotask(() => {
      editor.focus();
      editor.setSelectionRange(replaceStart, replaceStart + replacement.length);
    });
  };

  const doExport = async (kind: 'svg' | 'pdf' | 'png') => {
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
      if (kind === 'svg') {
        exportSvg(built.scene, metrics, buffers, draft.honoree, draft.posterSize, draft.title);
      } else if (kind === 'pdf') {
        await exportPdf(built.scene, metrics, buffers, draft.honoree, draft.posterSize, draft.title);
      } else {
        const dpi = await exportPng(built.scene, metrics, buffers, draft.honoree, draft.posterSize, draft.title);
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
    <div className="design-step">
      <div className="step-heading">
        <div>
          <span className="eyebrow">Step 3</span>
          <h2>Finish the poster</h2>
          <p>Choose the visual style, check the rules, then export a print-ready file.</p>
        </div>
      </div>

      <section className="design-section" aria-labelledby="theme-heading">
        <div className="section-heading compact">
          <div><h3 id="theme-heading">Theme</h3><p>Start with a preset, then tune only what matters.</p></div>
        </div>
        <div className="field poster-size-field">
          <label htmlFor={draft.template === 'landscapeBrackets' ? undefined : 'size'}>Poster size</label>
          {draft.template === 'landscapeBrackets' ? (
            <p className="poster-size-fixed">60 × 48 in (fixed for this layout)</p>
          ) : (
            <select id="size" value={draft.posterSize} onChange={(event) => patch({ posterSize: event.target.value as PosterSizeId })}>
              {(Object.keys(POSTER_SIZES) as PosterSizeId[]).map((size) => (
                <option key={size} value={size}>{POSTER_SIZE_LABELS[size]}</option>
              ))}
            </select>
          )}
        </div>
        <div className="theme-presets">
          {THEME_PRESETS.map((p) => (
            <button key={p.id} className="chip" title={p.description} onClick={() => patch({ theme: structuredClone(p.theme) })}>{p.name}</button>
          ))}
        </div>
        <div className="color-grid">
          {COLOR_FIELDS.map(({ key, label, clearable }) => (
            <div className="field color-field" key={key}>
              <label htmlFor={`c-${key}`}>{label}</label>
              <div className="color-control">
                <input
                  id={`c-${key}`}
                  type="color"
                  value={HEX.test(draft.theme[key] ?? '') ? (draft.theme[key] as string) : '#141414'}
                  onChange={(e) => setTheme({ [key]: e.target.value })}
                />
                {clearable && <button className="ghost compact-button" onClick={() => setTheme({ [key]: '' })} title="Clear tint">clear</button>}
              </div>
            </div>
          ))}
        </div>
        <div className="options-grid design-options">
          <div className="field checkbox-field">
            <input id="allcaps" type="checkbox" checked={draft.theme.allCaps ?? false} onChange={(e) => setTheme({ allCaps: e.target.checked })} />
            <label htmlFor="allcaps">ALL-CAPS activity names</label>
          </div>
          <div className="field">
            <label htmlFor="cornerLabel">Corner label</label>
            <input id="cornerLabel" value={draft.theme.cornerLabel ?? ''} maxLength={20} onChange={(e) => setTheme({ cornerLabel: e.target.value })} />
          </div>
        </div>
      </section>

      <section className="design-section" aria-labelledby="activity-details-heading">
        <div className="section-heading compact">
          <div><h3 id="activity-details-heading">Activity details</h3><p>Customize wording and scoring after you finish choosing activities.</p></div>
        </div>
        {draft.activities.length === 0 ? (
          <div className="empty-state">No activities selected yet. Go back to Activities and choose at least five.</div>
        ) : (
          <div className="table-scroll">
            <table className="activities">
              <thead><tr><th>Activity</th><th>Points</th><th>Max</th><th>Bonus</th><th /></tr></thead>
              <tbody>
                {draft.activities.map((row, i) => (
                  <tr key={row.uid}>
                    <td><input aria-label={`Activity ${i + 1} name`} value={row.name} maxLength={90} onChange={(e) => setActivity(i, { name: e.target.value })} /></td>
                    <td><input key={`${row.uid}-${draft.pointsRangeFormat}`} className="points" defaultValue={pointsLabel(row.points, draft.pointsRangeFormat)} onBlur={(e) => {
                      const value = parsePointsInput(e.target.value);
                      if (value !== null) setActivity(i, { points: value });
                      else e.target.value = pointsLabel(row.points, draft.pointsRangeFormat);
                    }} title='A number, a range like "1 to 6", or TBD' /></td>
                    <td><input className="points" value={row.maxPoints ?? ''} onChange={(e) => {
                      const value = Number(e.target.value);
                      setActivity(i, { maxPoints: e.target.value === '' || !Number.isInteger(value) || value < 1 ? undefined : Math.min(value, 99) });
                    }} placeholder="None" title="Cumulative cap; blank means once only" /></td>
                    <td><input type="checkbox" checked={row.bonus} aria-label={`Bonus: ${row.name}`} onChange={(e) => setActivity(i, { bonus: e.target.checked })} /></td>
                    <td><button className="icon-button" aria-label={`Remove ${row.name}`} onClick={() => patch({ activities: draft.activities.filter((_, j) => j !== i) })}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="design-section" aria-labelledby="corners-heading">
        <div className="section-heading compact"><div><h3 id="corners-heading">Corner boxes</h3><p>Optional awards or results boxes around the board.</p></div></div>
        <div className="stacked-fields">
          {draft.cornerBoxes.map((label, i) => (
            <div className="row" key={i}>
              <input value={label} aria-label={`Corner box ${i + 1}`} maxLength={40} onChange={(e) => patch({ cornerBoxes: draft.cornerBoxes.map((x, j) => (j === i ? e.target.value : x)) })} />
              <button className="icon-button" aria-label={`Remove corner box ${i + 1}`} onClick={() => patch({ cornerBoxes: draft.cornerBoxes.filter((_, j) => j !== i) })}>×</button>
            </div>
          ))}
        </div>
        {draft.cornerBoxes.length < 4 && <button className="secondary" onClick={() => patch({ cornerBoxes: [...draft.cornerBoxes, 'NEW BOX'] })}>+ Corner box</button>}
      </section>

      <section className="design-section" aria-labelledby="rules-heading">
        <div className="section-heading compact"><div><h3 id="rules-heading">Rules</h3><p>Keep the honor-system framing or add instructions for your group.</p></div></div>
        <div className="field rules-title-field">
          <label htmlFor="rulesTitle">Rules title</label>
          <input id="rulesTitle" value={draft.rulesTitle} maxLength={80} onChange={(e) => patch({ rulesTitle: e.target.value })} placeholder="GAME RULES:" />
        </div>
        <div className="rules-content-shell">
          <div className="rules-toolbar" aria-label="Rules formatting">
            <button
              className="ghost compact-button"
              type="button"
              aria-label="Bold"
              aria-disabled={rulesSelectionEmpty}
              title={rulesSelectionEmpty ? 'Select text to bold' : 'Bold selected text'}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => formatRules('bold')}
            ><strong>B</strong></button>
            <button className="ghost compact-button" type="button" aria-label="Bulleted list" onMouseDown={(event) => event.preventDefault()} onClick={() => formatRules('bullets')}>• List</button>
            <span>Supports bold headings and simple lists.</span>
          </div>
          <label className="sr-only" htmlFor="rulesContent">Rules content</label>
          <textarea
            ref={rulesEditor}
            id="rulesContent"
            value={draft.rulesContent}
            maxLength={50000}
            onChange={(event) => patch({ rulesContent: event.target.value })}
            onSelect={syncRulesSelection}
            onKeyUp={syncRulesSelection}
            onMouseUp={syncRulesSelection}
            onBlur={syncRulesSelection}
            placeholder="Add the rules, notes, or agreement for this board."
          />
        </div>
      </section>

      <section className="design-section export-section" aria-labelledby="export-heading">
        <div className="section-heading compact"><div><h3 id="export-heading">Export</h3><p>SVG and PDF stay sharp at any poster size. PNG is best for a quick preview.</p></div></div>
        <div className="export-options">
          <button className="export-card recommended" disabled={board.status !== 'ready' || busy !== null || !buffers} onClick={() => doExport('svg')}>
            <span className="export-kicker">Recommended</span>
            <strong>{busy === 'svg' ? 'Preparing…' : 'Download SVG'}</strong>
            <span>Vector artwork for the sharpest large-format output.</span>
          </button>
          <button className="export-card" disabled={board.status !== 'ready' || busy !== null || !buffers} onClick={() => doExport('pdf')}>
            <span className="export-kicker">Print shop ready</span>
            <strong>{busy === 'pdf' ? 'Rendering…' : 'Download PDF'}</strong>
            <span>Vector-quality document for professional printing.</span>
          </button>
          <button className="export-card preview-export" disabled={board.status !== 'ready' || busy !== null || !buffers} onClick={() => doExport('png')}>
            <span className="export-kicker">Preview only</span>
            <strong>{busy === 'png' ? 'Rendering…' : `Download PNG (${pngPlan.dpi} DPI)`}</strong>
            <span>Raster image limited by your browser and likely to pixelate at full poster size.</span>
          </button>
        </div>
        {note && <div className="problems">{note}</div>}
      </section>

      <div className="step-footer"><button className="ghost" onClick={() => setStep(1)}>Back to activities</button><span /></div>
    </div>
  );
}
