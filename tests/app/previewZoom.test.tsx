// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { App } from '../../src/app/App';
import { testMetrics } from '../helpers/loadFonts';
import { useWizardStore } from '../../src/store/wizardStore';
import { createJesse2017Draft } from '../../src/content/occasions';

afterEach(() => {
  cleanup();
  document.body.style.overflow = '';
  vi.restoreAllMocks();
});

describe('Preview zoom', () => {
  it('shows a zoom affordance and opens a full-size proof overlay with the same SVG', async () => {
    useWizardStore.getState().replaceDraft(createJesse2017Draft());
    render(<App metrics={testMetrics()} buffers={null} />);

    // Affordance only appears once a real scene has rendered.
    await waitFor(() => expect(document.querySelector('.preview svg')).not.toBeNull(), { timeout: 5000 });
    const zoomButton = screen.getByRole('button', { name: /enlarge preview/i });

    // Opening the overlay exposes an accessible dialog rendering the SAME markup.
    fireEvent.click(zoomButton);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', expect.stringMatching(/proof/i));
    expect(dialog.querySelector('svg')).not.toBeNull();
    // Fit / 100% / 200% zoom controls are present.
    expect(screen.getByRole('button', { name: '100%' })).toBeDefined();

    // Escape closes it and returns focus to the opener.
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /enlarge preview/i }));
  });

  it('offers no zoom affordance while the board is in an error state', async () => {
    // Default draft has no activities, so the board resolves to the invalid
    // checklist state — there is no scene to proof.
    useWizardStore.getState().reset();
    render(<App metrics={testMetrics()} buffers={null} />);

    await waitFor(() => expect(screen.getByText(/preview checklist/i)).toBeDefined(), { timeout: 5000 });
    expect(document.querySelector('.preview svg')).toBeNull();
    expect(screen.queryByRole('button', { name: /enlarge preview/i })).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
