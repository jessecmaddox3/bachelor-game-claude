// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetupStep } from '../../src/app/steps/SetupStep';
import { ActivitiesStep } from '../../src/app/steps/ActivitiesStep';
import { useWizardStore } from '../../src/store/wizardStore';

beforeEach(() => useWizardStore.getState().reset());

describe('SetupStep', () => {
  it('edits event fields and roster', async () => {
    render(<SetupStep />);
    const honoree = screen.getByLabelText(/honoree/i);
    await userEvent.clear(honoree);
    await userEvent.type(honoree, 'Kyle');
    expect(useWizardStore.getState().draft.honoree).toBe('Kyle');

    await userEvent.type(screen.getByPlaceholderText(/add player/i), 'Newguy{enter}');
    expect(useWizardStore.getState().draft.players).toContain('Newguy');
  });

  it('changes poster size', async () => {
    render(<SetupStep />);
    await userEvent.selectOptions(screen.getByLabelText(/poster size/i), '36x48');
    expect(useWizardStore.getState().draft.posterSize).toBe('36x48');
  });
});

describe('ActivitiesStep', () => {
  it('adds from the library and edits points', async () => {
    const store = useWizardStore.getState();
    store.patch({ activities: store.draft.activities.slice(0, 6) });
    render(<ActivitiesStep />);
    const before = useWizardStore.getState().draft.activities.length;
    const addButtons = screen.getAllByRole('button', { name: /^add .+/i }); // library buttons are aria-labeled "Add <name>"
    await userEvent.click(addButtons[0]!);
    expect(useWizardStore.getState().draft.activities.length).toBe(before + 1);
  });

  it('toggles write-in rows and honoree bonus', async () => {
    render(<ActivitiesStep />);
    await userEvent.click(screen.getByLabelText(/honoree bonus row/i));
    expect(useWizardStore.getState().draft.honoreeBonusRow).toBe(false);
  });
});
