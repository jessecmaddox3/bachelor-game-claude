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

  return (
    <div className="shell">
      <header>
        <h1>Game Board Poster Builder</h1>
        <nav>
          {STEPS.map((label, i) => (
            <button key={label} className={step === i ? 'tab active' : 'tab'} onClick={() => setStep(i as 0 | 1 | 2)}>
              {i + 1}. {label}
            </button>
          ))}
        </nav>
        <button className="ghost" onClick={() => window.confirm('Start over? This clears the current board.') && reset()}>
          Start over
        </button>
      </header>
      <main>
        <section className="panel">
          {step === 0 && <SetupStep />}
          {step === 1 && <ActivitiesStep />}
          {step === 2 && <DesignStep board={board} metrics={metrics} buffers={buffers} />}
        </section>
        <Preview board={board} />
      </main>
    </div>
  );
}
