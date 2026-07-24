// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  it('places board actions in a document toolbar above the workspace', () => {
    const { container } = render(<App metrics={testMetrics()} buffers={null} />);
    const header = container.querySelector('.app-header');
    const layout = container.querySelector('.builder-layout');
    const toolbar = container.querySelector('.board-document-bar');
    const panel = container.querySelector('.panel');
    const preview = container.querySelector('.preview-pane');
    const save = screen.getByRole('button', { name: /^save board/i });
    const boards = screen.getByRole('button', { name: /^boards$/i });
    const startOver = screen.getByRole('button', { name: /^start over$/i });

    expect(toolbar).not.toBeNull();
    expect(header).not.toContainElement(save);
    expect(toolbar).toContainElement(save);
    expect(toolbar).toContainElement(boards);
    expect(toolbar).toContainElement(startOver);
    expect(startOver.closest('.board-reset-group')).not.toBeNull();
    expect(layout?.firstElementChild).toBe(toolbar);
    expect(toolbar?.nextElementSibling).toBe(panel);
    expect(panel?.nextElementSibling).toBe(preview);
  });

  it('saves an unnamed board from the toolbar and then updates it in one click', async () => {
    render(<App metrics={testMetrics()} buffers={null} />);
    await userEvent.click(screen.getByRole('button', { name: /^save (?!as)/i }));
    expect(screen.getByRole('dialog', { name: /^boards$/i })).toBeDefined();

    const name = screen.getByLabelText(/save name/i);
    await userEvent.clear(name);
    await userEvent.type(name, 'Camp SheiShei');
    await userEvent.click(screen.getByRole('button', { name: /^save as$/i }));

    expect(useWizardStore.getState().activeSavedBoardName).toBe('Camp SheiShei');
    expect(screen.getByText(/^saved$/i)).toBeDefined();

    await userEvent.type(screen.getByLabelText(/^subtitle$/i), 'Updated weekend');
    expect(await screen.findByText(/unsaved changes/i)).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: /^save (?!as)/i }));
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

  it('opens the historical bachelor board as an unsaved built-in copy', async () => {
    useWizardStore.getState().setStep(2);
    render(<App metrics={testMetrics()} buffers={null} />);

    await userEvent.click(screen.getByRole('button', { name: /^boards$/i }));
    await userEvent.click(screen.getByRole('button', {
      name: /open built-in board jesse maddox bachelor 2017/i,
    }));

    const state = useWizardStore.getState();
    expect(state.step).toBe(2);
    expect(state.activeSavedBoardName).toBeNull();
    expect(state.draft.title).toBe('THE BACHELOR WEEKEND OF');
    expect(state.draft.honoree).toBe('JESSE CORDELL MADDOX, III');
    expect(state.draft.players).toHaveLength(30);
    expect(state.draft.activities).toHaveLength(37);
    expect(state.draft.rulesContent).toContain('SECTION 6. TERM');
  });

  it('keeps unsaved work when built-in replacement is canceled', async () => {
    useWizardStore.getState().patch({ subtitle: 'Keep this work' });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<App metrics={testMetrics()} buffers={null} />);

    await userEvent.click(screen.getByRole('button', { name: /^boards$/i }));
    await userEvent.click(screen.getByRole('button', {
      name: /open built-in board jesse maddox bachelor 2017/i,
    }));

    expect(confirm).toHaveBeenCalledWith(
      'Open this built-in board? Unsaved changes will be replaced.',
    );
    expect(useWizardStore.getState().draft.subtitle).toBe('Keep this work');
    expect(screen.getByRole('dialog', { name: /^boards$/i })).toBeDefined();
  });

  it('focuses the current browser save while keeping built-in boards visually first', async () => {
    saveBoard('Beach 2026', defaultDraft());
    useWizardStore.getState().replaceDraft(defaultDraft(), 'Beach 2026');
    render(<App metrics={testMetrics()} buffers={null} />);

    await userEvent.click(screen.getByRole('button', { name: /^boards$/i }));
    const builtIn = screen.getByRole('button', {
      name: /open built-in board jesse maddox bachelor 2017/i,
    });
    const saved = screen.getByRole('button', { name: /open beach 2026/i });

    expect(builtIn.compareDocumentPosition(saved) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy();
    expect(document.activeElement).toBe(saved);
  });

  it('opens Save as after loading a built-in without creating a named save', async () => {
    render(<App metrics={testMetrics()} buffers={null} />);

    await userEvent.click(screen.getByRole('button', { name: /^boards$/i }));
    await userEvent.click(screen.getByRole('button', {
      name: /open built-in board jesse maddox bachelor 2017/i,
    }));

    expect(useWizardStore.getState().activeSavedBoardName).toBeNull();
    expect(localStorage.getItem(SAVED_BOARDS_KEY)).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /^save board/i }));

    expect(screen.getByRole('dialog', { name: /^boards$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^save as$/i })).toBeDefined();
    expect(localStorage.getItem(SAVED_BOARDS_KEY)).toBeNull();
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

  it('leaves Cmd+Shift+S and repeated shortcuts to the browser', () => {
    saveBoard('Shortcut board', defaultDraft());
    useWizardStore.getState().replaceDraft(defaultDraft(), 'Shortcut board');
    render(<App metrics={testMetrics()} buffers={null} />);

    const shiftedSave = new KeyboardEvent('keydown', {
      key: 's',
      metaKey: true,
      shiftKey: true,
      cancelable: true,
    });
    const repeatedSave = new KeyboardEvent('keydown', {
      key: 's',
      metaKey: true,
      repeat: true,
      cancelable: true,
    });
    window.dispatchEvent(shiftedSave);
    window.dispatchEvent(repeatedSave);

    expect(shiftedSave.defaultPrevented).toBe(false);
    expect(repeatedSave.defaultPrevented).toBe(false);
  });

  it('does not reread every saved board while the user types', async () => {
    saveBoard('Typing board', defaultDraft());
    useWizardStore.getState().replaceDraft(defaultDraft(), 'Typing board');
    const storageRead = vi.spyOn(localStorage, 'getItem');
    render(<App metrics={testMetrics()} buffers={null} />);
    storageRead.mockClear();

    await userEvent.type(screen.getByLabelText(/^subtitle$/i), 'Typing');

    expect(storageRead.mock.calls.filter(([key]) => key === SAVED_BOARDS_KEY)).toHaveLength(0);
  });

  it('confirms before overwriting a board created after the dialog opened', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<App metrics={testMetrics()} buffers={null} />);
    await userEvent.click(screen.getByRole('button', { name: /^save (?!as)/i }));

    const external = defaultDraft();
    external.title = 'External version';
    saveBoard('Race board', external);
    const name = screen.getByLabelText(/save name/i);
    await userEvent.clear(name);
    await userEvent.type(name, 'Race board');
    await userEvent.click(screen.getByRole('button', { name: /^save as$/i }));

    expect(confirm).toHaveBeenCalledWith('Overwrite this saved board?');
    expect(loadSavedBoard('Race board')?.title).toBe('External version');
    expect(screen.getByRole('dialog', { name: /^boards$/i })).toBeDefined();
  });

  it('closes from the modal backdrop and restores focus to Boards', async () => {
    render(<App metrics={testMetrics()} buffers={null} />);
    const boards = screen.getByRole('button', { name: /^boards$/i });
    await userEvent.click(boards);
    const dialog = screen.getByRole('dialog', { name: /^boards$/i });
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      right: 500,
      top: 100,
      bottom: 500,
      width: 400,
      height: 400,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    });

    fireEvent.click(dialog, { clientX: 50, clientY: 50 });

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(boards);
  });

  it('reports a storage failure without claiming the board was saved', async () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });
    render(<App metrics={testMetrics()} buffers={null} />);
    await userEvent.click(screen.getByRole('button', { name: /^save (?!as)/i }));
    const name = screen.getByLabelText(/save name/i);
    await userEvent.clear(name);
    await userEvent.type(name, 'Broken save');
    await userEvent.click(screen.getByRole('button', { name: /^save as$/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/could not save/i);
    expect(useWizardStore.getState().activeSavedBoardName).toBeNull();
  });

  it('lets the user dismiss a one-click save error', async () => {
    saveBoard('Active board', defaultDraft());
    useWizardStore.getState().replaceDraft(defaultDraft(), 'Active board');
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });
    render(<App metrics={testMetrics()} buffers={null} />);

    await userEvent.click(screen.getByRole('button', { name: /^save (?!as)/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/could not save/i);
    await userEvent.click(screen.getByRole('button', { name: /dismiss save error/i }));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
