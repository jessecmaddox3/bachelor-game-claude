import { useEffect, useState } from 'react';
import { buildBoard, renderSvg, type FontMetrics, type QualityReport } from '../engine';
import { toBoardSpec, type Draft, type FieldError } from '../store/toBoardSpec';

export type BoardState =
  | { status: 'loading' }
  | { status: 'invalid'; errors: FieldError[] }
  | { status: 'infeasible'; reason: string }
  | { status: 'ready'; svg: string; quality: QualityReport };

/**
 * Debounced draft -> rendered preview. The solver's worst case is ~205ms, so
 * the default 300ms debounce keeps typing responsive; tests pass a short one.
 */
export function useBoard(draft: Draft, metrics: FontMetrics | null, debounceMs = 300): BoardState {
  const [state, setState] = useState<BoardState>({ status: 'loading' });

  useEffect(() => {
    if (!metrics) return;
    const t = setTimeout(() => {
      const validated = toBoardSpec(draft);
      if (!validated.ok) {
        setState({ status: 'invalid', errors: validated.errors });
        return;
      }
      const built = buildBoard(validated.spec, metrics);
      if (!built.ok) {
        setState({ status: 'infeasible', reason: built.reason });
        return;
      }
      setState({ status: 'ready', svg: renderSvg(built.scene, metrics), quality: built.quality });
    }, debounceMs);
    return () => clearTimeout(t);
  }, [draft, metrics, debounceMs]);

  return state;
}
