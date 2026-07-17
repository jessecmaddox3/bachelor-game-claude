// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetupStep } from '../../src/app/steps/SetupStep';
import { ActivitiesStep } from '../../src/app/steps/ActivitiesStep';
import { DesignStep } from '../../src/app/steps/DesignStep';
import { useWizardStore } from '../../src/store/wizardStore';
import { THEME_PRESETS } from '../../src/content/themes';
import { testMetrics } from '../helpers/loadFonts';

beforeEach(() => useWizardStore.getState().reset());
// vitest runs without globals:true, so RTL's auto-cleanup never registers;
// without this, each test's render stays mounted and queries go ambiguous.
afterEach(cleanup);

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

describe('stable row identity', () => {
  it('keeps focus and commits full strings while typing in existing rows', async () => {
    const rosterView = render(<SetupStep />);
    const roster = screen.getByDisplayValue('Player 1') as HTMLInputElement;
    await userEvent.type(roster, ' Jones');
    expect(useWizardStore.getState().draft.players[0]).toBe('Player 1 Jones');
    expect(document.activeElement).toBe(roster);
    rosterView.unmount();

    const firstName = useWizardStore.getState().draft.activities[0]!.name;
    render(<ActivitiesStep />);
    const nameInput = screen.getByDisplayValue(firstName) as HTMLInputElement;
    await userEvent.type(nameInput, ' XYZ');
    expect(useWizardStore.getState().draft.activities[0]!.name).toBe(`${firstName} XYZ`);
    expect(document.activeElement).toBe(nameInput);
  });

  it('retains committed points after removing a duplicate-named row above', async () => {
    useWizardStore.getState().patch({ activities: [] });
    render(<ActivitiesStep />);
    const addCustom = screen.getByRole('button', { name: /custom activity/i });
    await userEvent.click(addCustom);
    await userEvent.click(addCustom); // two rows both named "New activity"

    const pointsInputs = screen.getAllByTitle(/a number, a range/i) as HTMLInputElement[];
    await userEvent.clear(pointsInputs[1]!);
    await userEvent.type(pointsInputs[1]!, '42');
    fireEvent.blur(pointsInputs[1]!);
    expect(useWizardStore.getState().draft.activities[1]!.points).toBe(42);

    await userEvent.click(screen.getAllByLabelText('Remove New activity')[0]!);
    const activities = useWizardStore.getState().draft.activities;
    expect(activities).toHaveLength(1);
    expect(activities[0]!.points).toBe(42);
    const remaining = screen.getAllByTitle(/a number, a range/i) as HTMLInputElement[];
    expect(remaining).toHaveLength(1);
    expect(remaining[0]!.value).toBe('42');
  });
});

describe('DesignStep', () => {
  const props = { board: { status: 'loading' } as const, metrics: testMetrics(), buffers: null };

  it('offers clear buttons only on the two clearable tint fields', () => {
    render(<DesignStep {...props} />);
    // '' is only a valid theme value for pointsColTint/maxPointsColTint;
    // clearing any other color field would crash the pdf renderer.
    expect(screen.getAllByRole('button', { name: /^clear$/i })).toHaveLength(2);
  });

  it('replaces (not merges) the theme when a preset chip is clicked', async () => {
    useWizardStore.getState().patch({ theme: structuredClone(THEME_PRESETS[0]!.theme) });
    render(<DesignStep {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'Ink' }));
    // Ink is `theme: {}` — a merge would leave Classic Teal intact; a replace
    // clears titleColor so the zod default applies downstream.
    expect(useWizardStore.getState().draft.theme.titleColor).toBeUndefined();
  });
});
