// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { App } from '../../src/app/App';
import { testMetrics } from '../helpers/loadFonts';
import { useWizardStore } from '../../src/store/wizardStore';
import { createJesse2017Draft } from '../../src/content/occasions';
import { makeDraft } from '../helpers/fixtures';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('App', () => {
  it('renders the wizard shell, preview svg, and quality badge', async () => {
    useWizardStore.getState().replaceDraft(createJesse2017Draft());
    render(<App metrics={testMetrics()} buffers={null} />);
    expect(screen.getByText(/Setup/)).toBeDefined();
    expect(screen.getByText(/Activities/)).toBeDefined();
    expect(screen.getByText(/Design/)).toBeDefined();
    expect(screen.getByRole('button', { name: /1\. setup/i })).toHaveAttribute('aria-current', 'step');
    await waitFor(() => expect(document.querySelector('.preview svg')).not.toBeNull(), { timeout: 5000 });
    await waitFor(() => expect(screen.getByTestId('quality-badge').textContent).toMatch(/good|tight|poor/i));
  });

  it('Start over resets the draft to defaults after confirmation', () => {
    useWizardStore.getState().reset();
    useWizardStore.getState().setActiveSavedBoardName('Weekend board');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<App metrics={testMetrics()} buffers={null} />);
    useWizardStore.getState().patch({ honoree: 'CUSTOM GUY' });
    expect(useWizardStore.getState().draft.honoree).toBe('CUSTOM GUY');
    fireEvent.click(screen.getByText('Start over'));
    expect(window.confirm).toHaveBeenCalledOnce();
    expect(useWizardStore.getState().draft.honoree).toBe('');
    expect(useWizardStore.getState().activeSavedBoardName).toBeNull();
  });

  it('shows Letter fit guidance with the authoritative preview', async () => {
    useWizardStore.getState().replaceDraft(makeDraft({
      posterSize: '8.5x11',
      players: ['Jack', 'Bobbie', 'Shasha', 'Hunter', 'SG'],
      includeRules: false,
    }));
    render(<App metrics={testMetrics()} buffers={null} />);
    await waitFor(() => expect(screen.getByTestId('letter-fit-guidance')).toBeDefined(), { timeout: 5000 });
    expect(screen.getByTestId('letter-fit-guidance')).toHaveTextContent(/selected.*about/i);
  });
});
