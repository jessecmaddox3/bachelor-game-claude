import { useWizardStore } from '../store/wizardStore';
import { useBoard } from './useBoard';
import { Preview } from './Preview';
import { SetupStep } from './steps/SetupStep';
import { ActivitiesStep } from './steps/ActivitiesStep';
import { DesignStep } from './steps/DesignStep';
import type { FontMetrics, FontBuffers } from '../engine';

const STEPS = ['Setup', 'Activities', 'Design'] as const;

export function App({ metrics, buffers }: { metrics: FontMetrics; buffers: FontBuffers | null }) {
  const { draft, step, setStep, reset } = useWizardStore();
  const board = useBoard(draft, metrics);
  const fit = board.status === 'ready' || board.status === 'infeasible'
    ? board.fit
    : undefined;

  return (
    <div className="shell">
      <header className="app-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">GB</span>
          <div>
            <span className="brand-kicker">Weekend scorecards</span>
            <h1>Game Board Builder</h1>
          </div>
        </div>
        <nav className="wizard-progress" aria-label="Builder progress">
          {STEPS.map((label, i) => (
            <button
              key={label}
              className={`${step === i ? 'tab active' : 'tab'}${i < step ? ' complete' : ''}`}
              aria-label={`${i + 1}. ${label}`}
              aria-current={step === i ? 'step' : undefined}
              onClick={() => setStep(i as 0 | 1 | 2)}
            >
              <span className="tab-step">{i < step ? '✓' : i + 1}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <button className="ghost header-action" onClick={() => window.confirm('Start over? This clears the current board.') && reset()}>
          Start over
        </button>
      </header>
      <main className="builder-layout">
        <section className="panel">
          {step === 0 && <SetupStep />}
          {step === 1 && <ActivitiesStep fit={fit} />}
          {step === 2 && <DesignStep board={board} metrics={metrics} buffers={buffers} />}
        </section>
        <Preview board={board} />
      </main>
    </div>
  );
}
