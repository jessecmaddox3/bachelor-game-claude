// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from '../../src/app/App';
import { testMetrics } from '../helpers/loadFonts';
import { useWizardStore } from '../../src/store/wizardStore';

describe('App', () => {
  it('renders the wizard shell, preview svg, and quality badge', async () => {
    useWizardStore.getState().reset();
    render(<App metrics={testMetrics()} buffers={null} />);
    expect(screen.getByText(/Setup/)).toBeDefined();
    expect(screen.getByText(/Activities/)).toBeDefined();
    expect(screen.getByText(/Design/)).toBeDefined();
    await waitFor(() => expect(document.querySelector('.preview svg')).not.toBeNull(), { timeout: 5000 });
    await waitFor(() => expect(screen.getByTestId('quality-badge').textContent).toMatch(/good|tight|poor/i));
  });
});
