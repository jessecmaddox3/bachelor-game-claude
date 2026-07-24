import { useEffect, useState } from 'react';
import {
  buildBoard,
  estimateLetterCapacity,
  renderSvg,
  type FontMetrics,
  type LetterFit,
  type QualityReport,
} from '../engine';
import { toBoardSpec, type Draft, type FieldError } from '../store/toBoardSpec';

type WithLetterFit = { fit?: LetterFit };

export type BoardState =
  | { status: 'loading' }
  | { status: 'invalid'; errors: FieldError[] }
  | ({ status: 'infeasible'; reason: string } & WithLetterFit)
  | ({ status: 'ready'; svg: string; quality: QualityReport } & WithLetterFit);

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
      const fit = estimateLetterCapacity(validated.spec, metrics);
      const built = buildBoard(validated.spec, metrics);
      if (!built.ok) {
        setState({
          status: 'infeasible',
          reason: built.reason,
          ...(fit ? { fit } : {}),
        });
        return;
      }
      setState({
        status: 'ready',
        svg: renderSvg(built.scene, metrics),
        quality: built.quality,
        ...(fit ? { fit } : {}),
      });
    }, debounceMs);
    return () => clearTimeout(t);
  }, [draft, metrics, debounceMs]);

  return state;
}
