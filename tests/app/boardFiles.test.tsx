// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App';
import { testMetrics } from '../helpers/loadFonts';
import { defaultDraft } from '../../src/store/toBoardSpec';
import {
  loadSavedBoard,
  saveBoard,
  SAVED_BOARDS_KEY,
} from '../../src/store/savedBoards';
import { useWizardStore } from '../../src/store/wizardStore';

beforeEach(() => {
  localStorage.removeItem(SAVED_BOARDS_KEY);
  useWizardStore.getState().reset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('named board controls', () => {
  it('saves an unnamed board from the header and then updates it in one click', async () => {
    render(<App metrics={testMetrics()} buffers={null} />);
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(screen.getByRole('dialog', { name: /saved boards/i })).toBeDefined();

    const name = screen.getByLabelText(/save name/i);
    await userEvent.clear(name);
    await userEvent.type(name, 'Camp SheiShei');
    await userEvent.click(screen.getByRole('button', { name: /^save as$/i }));

    expect(useWizardStore.getState().activeSavedBoardName).toBe('Camp SheiShei');
    expect(screen.getByText(/^saved$/i)).toBeDefined();

    await userEvent.type(screen.getByLabelText(/^subtitle$/i), 'Updated weekend');
    expect(await screen.findByText(/unsaved changes/i)).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(loadSavedBoard('Camp SheiShei')?.subtitle).toBe('Updated weekend');
  });

  it('opens a named board from Activities without returning to Setup', async () => {
    const saved = defaultDraft();
    saved.title = 'Loaded title';
    saveBoard('Loaded board', saved);
    useWizardStore.getState().setStep(1);
    render(<App metrics={testMetrics()} buffers={null} />);

    await userEvent.click(screen.getByRole('button', { name: /^boards$/i }));
    await userEvent.click(screen.getByRole('button', { name: /open loaded board/i }));

    expect(useWizardStore.getState().step).toBe(1);
    expect(useWizardStore.getState().draft.title).toBe('Loaded title');
    expect(useWizardStore.getState().activeSavedBoardName).toBe('Loaded board');
  });

  it('requires confirmation before replacing unsaved changes', async () => {
    saveBoard('Other board', defaultDraft());
    useWizardStore.getState().patch({ subtitle: 'Unsaved work' });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<App metrics={testMetrics()} buffers={null} />);

    await userEvent.click(screen.getByRole('button', { name: /^boards$/i }));
    await userEvent.click(screen.getByRole('button', { name: /open other board/i }));

    expect(confirm).toHaveBeenCalledWith('Open this saved board? Unsaved changes will be replaced.');
    expect(useWizardStore.getState().draft.subtitle).toBe('Unsaved work');
  });

  it('uses Cmd+S without the browser save action', async () => {
    saveBoard('Shortcut board', defaultDraft());
    useWizardStore.getState().replaceDraft(defaultDraft(), 'Shortcut board');
    useWizardStore.getState().patch({ title: 'Shortcut update' });
    render(<App metrics={testMetrics()} buffers={null} />);

    const macSave = new KeyboardEvent('keydown', {
      key: 's',
      metaKey: true,
      cancelable: true,
    });
    window.dispatchEvent(macSave);

    expect(macSave.defaultPrevented).toBe(true);
    await waitFor(() => {
      expect(loadSavedBoard('Shortcut board')?.title).toBe('Shortcut update');
    });
  });

  it('reports a storage failure without claiming the board was saved', async () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });
    render(<App metrics={testMetrics()} buffers={null} />);
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    const name = screen.getByLabelText(/save name/i);
    await userEvent.clear(name);
    await userEvent.type(name, 'Broken save');
    await userEvent.click(screen.getByRole('button', { name: /^save as$/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/could not save/i);
    expect(useWizardStore.getState().activeSavedBoardName).toBeNull();
  });
});
