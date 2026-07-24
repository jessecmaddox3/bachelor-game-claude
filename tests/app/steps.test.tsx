// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetupStep } from '../../src/app/steps/SetupStep';
import { ActivitiesStep } from '../../src/app/steps/ActivitiesStep';
import { DesignStep } from '../../src/app/steps/DesignStep';
import { useWizardStore } from '../../src/store/wizardStore';
import { SAVED_BOARDS_KEY } from '../../src/store/savedBoards';
import { THEME_PRESETS } from '../../src/content/themes';
import { testMetrics } from '../helpers/loadFonts';

beforeEach(() => {
  localStorage.removeItem(SAVED_BOARDS_KEY);
  useWizardStore.getState().reset();
});
// vitest runs without globals:true, so RTL's auto-cleanup never registers;
// without this, each test's render stays mounted and queries go ambiguous.
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const designProps = { board: { status: 'loading' } as const, metrics: testMetrics(), buffers: null };

describe('SetupStep', () => {
  it('loads the Jesse 2017 occasion pack', async () => {
    render(<SetupStep />);
    await userEvent.click(screen.getByRole('button', { name: /load preset/i }));
    const draft = useWizardStore.getState().draft;
    expect(draft.honoree).toBe('JESSE CORDELL MADDOX, III');
    expect(draft.players).toHaveLength(30);
    expect(draft.activities).toHaveLength(37);
    expect(draft.totalsTarget).toBe(100);
  });

  it('stores the occasion once on setup and edits event fields', async () => {
    render(<SetupStep />);
    const beach = screen.getByRole('radio', { name: /Beach Trip/ });
    await userEvent.click(beach);
    expect(beach).toBeChecked();
    expect(useWizardStore.getState().draft.libraryOccasion).toBe('beach-trip');

    const title = screen.getByLabelText(/^title$/i);
    await userEvent.clear(title);
    await userEvent.type(title, 'The Bachelor Weekend of Jesse Cordell Maddox III');
    expect(useWizardStore.getState().draft.title).toBe('The Bachelor Weekend of Jesse Cordell Maddox III');
  });

  it('keeps board naming to title and subtitle with occasion-appropriate placeholders', () => {
    useWizardStore.getState().patch({ title: '', subtitle: '', libraryOccasion: 'kids-weekend' });
    const { container } = render(<SetupStep />);
    // Placeholders are obviously-example and match the occasion, not a specific person.
    expect(screen.getByLabelText(/^title$/i)).toHaveAttribute('placeholder', 'Cousins Camp Weekend');
    expect(screen.getByLabelText(/^subtitle$/i)).toHaveAttribute('placeholder', 'June 12–14 · Lake Cabin');
    expect(screen.queryByLabelText(/honoree/i)).toBeNull();
    expect(screen.queryByLabelText(/poster size/i)).toBeNull();
    expect(container.querySelector('.section-number')).toBeNull();
  });

  it('swaps the title placeholder to fit the chosen occasion', async () => {
    useWizardStore.getState().patch({ title: '' });
    render(<SetupStep />);
    await userEvent.click(screen.getByRole('radio', { name: /Bachelor Weekend/ }));
    expect(screen.getByLabelText(/^title$/i)).toHaveAttribute('placeholder', 'The Lake House Bachelor Weekend');
  });

  it('confirms before a preset replaces any customized board setting', async () => {
    useWizardStore.getState().patch({ libraryOccasion: 'beach-trip' });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<SetupStep />);

    await userEvent.click(screen.getByRole('button', { name: /load preset/i }));

    expect(confirm).toHaveBeenCalledOnce();
    expect(useWizardStore.getState().draft.libraryOccasion).toBe('beach-trip');
  });

  it('explains that a named board stays saved before loading a preset', async () => {
    useWizardStore.getState().setActiveSavedBoardName('Camp board');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<SetupStep />);

    await userEvent.click(screen.getByRole('button', { name: /load preset/i }));

    expect(confirm).toHaveBeenCalledWith(expect.stringMatching(/Camp board.*stay saved/i));
    expect(useWizardStore.getState().activeSavedBoardName).toBe('Camp board');
  });

  it('shows properly capitalized occasion choices with a little flair', () => {
    render(<SetupStep />);
    expect(screen.getByRole('radio', { name: '🧸 Kids Weekend' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '🌳 Family Reunion' })).toBeDefined();
    expect(screen.getByRole('radio', { name: '🏡 Friends Weekend' })).toBeDefined();
  });

  it('keeps preset loading in Setup without duplicating document controls', () => {
    render(<SetupStep />);
    expect(screen.getByRole('button', { name: /load preset/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /^save$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^boards$/i })).toBeNull();
    expect(screen.queryByLabelText(/^saved board$/i)).toBeNull();
  });

  it('adds players as removable chips with Enter and keeps the input ready', async () => {
    useWizardStore.getState().patch({ players: [] });
    render(<SetupStep />);
    const input = screen.getByLabelText(/add participants/i) as HTMLInputElement;
    await userEvent.type(input, 'Zara{enter}');
    await userEvent.type(input, 'Alex{enter}');
    expect(useWizardStore.getState().draft.players).toEqual(['Alex', 'Zara']);
    expect(input.value).toBe('');
    expect(document.activeElement).toBe(input);
    expect(screen.getByRole('button', { name: 'Edit Alex' })).toBeDefined();

    await userEvent.click(screen.getByRole('button', { name: 'Remove Alex' }));
    expect(useWizardStore.getState().draft.players).toEqual(['Zara']);
  });

  it('splits pasted comma and multiline player lists into chips', () => {
    useWizardStore.getState().patch({ players: [] });
    render(<SetupStep />);
    const input = screen.getByLabelText(/add participants/i);
    fireEvent.paste(input, { clipboardData: { getData: () => 'Dana, Beth\nChris' } });
    expect(useWizardStore.getState().draft.players).toEqual(['Beth', 'Chris', 'Dana']);
  });

  it('edits a player inline from its chip', async () => {
    useWizardStore.getState().patch({ players: ['Zara', 'Alex'] });
    render(<SetupStep />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit Zara' }));
    const input = screen.getByLabelText('Edit Zara') as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, 'Aaron');
    expect(document.activeElement).toBe(input);
    await userEvent.keyboard('{Enter}');
    expect(useWizardStore.getState().draft.players).toEqual(['Aaron', 'Alex']);
  });
});

describe('ActivitiesStep', () => {
  it('shows Letter fit guidance beside the selected count when available', () => {
    useWizardStore.getState().patch({
      posterSize: '8.5x11',
      activities: Array.from({ length: 10 }, (_, i) => ({
        uid: crypto.randomUUID(),
        name: `Activity ${i + 1}`,
        points: 1,
        bonus: false,
      })),
    });
    render(<ActivitiesStep fit={{
      selectedActivities: 10,
      estimatedMaxActivities: 16,
      estimatedAdditionalActivities: 6,
      overBy: 0,
    }} />);
    expect(screen.getByText(/about 6 more fit/i)).toBeDefined();
  });

  it('adds from the library and edits points', async () => {
    useWizardStore.getState().patch({ activities: [], libraryOccasion: 'general' });
    render(<ActivitiesStep />);
    const before = useWizardStore.getState().draft.activities.length;
    await userEvent.click(screen.getByRole('checkbox', { name: /add give a specific toast/i }));
    expect(useWizardStore.getState().draft.activities.length).toBe(before + 1);
    expect(useWizardStore.getState().draft.activities[0]?.catalogId).toBe('specific-toast');
  });

  it('hides the legacy honoree bonus option on boards without an honoree', () => {
    render(<ActivitiesStep />);
    expect(screen.queryByLabelText(/honoree bonus row/i)).toBeNull();
  });

  it('keeps the honoree bonus option available for legacy presets', async () => {
    useWizardStore.getState().patch({ honoree: 'Jesse' });
    render(<ActivitiesStep />);
    await userEvent.click(screen.getByLabelText(/honoree bonus row/i));
    expect(useWizardStore.getState().draft.honoreeBonusRow).toBe(true);
  });

  it('changes the range display format', async () => {
    render(<ActivitiesStep />);
    await userEvent.selectOptions(screen.getByLabelText(/range display/i), 'dash');
    expect(useWizardStore.getState().draft.pointsRangeFormat).toBe('dash');
  });

  it('sets and clears the optional total-points target', async () => {
    render(<ActivitiesStep />);
    const input = screen.getByLabelText(/total-points target/i);
    await userEvent.type(input, '100');
    expect(useWizardStore.getState().draft.totalsTarget).toBe(100);
    await userEvent.clear(input);
    expect(useWizardStore.getState().draft.totalsTarget).toBeUndefined();
  });

  it('searches the safe full catalog without exposing adult drinks to kids', async () => {
    useWizardStore.getState().patch({ libraryOccasion: 'kids-weekend' });
    render(<ActivitiesStep />);
    expect(screen.queryByLabelText(/what are you planning/i)).toBeNull();
    expect(screen.getByText(/kids weekend ideas/i)).toBeDefined();
    expect(screen.queryByRole('button', { name: /adult drinks/i })).toBeNull();
    await userEvent.type(screen.getByLabelText(/search ideas/i), 'paper airplanes');
    expect(screen.getByRole('checkbox', { name: /add test three paper airplanes/i })).toBeDefined();
    expect(screen.queryByRole('checkbox', { name: /give a specific toast/i })).toBeNull();
  });

  it('orders Bachelor categories by occasion relevance', () => {
    useWizardStore.getState().patch({ libraryOccasion: 'bachelor', activities: [] });
    const { container } = render(<ActivitiesStep />);
    const headings = [...container.querySelectorAll('.activity-group h3')]
      .map((node) => node.textContent?.replace(/\s+\d+ selected.*$/, '').trim());
    expect(headings.slice(0, 5)).toEqual([
      'Adult drinks', 'Physical challenges', 'Sports', 'Games & competition', 'Social & performance',
    ]);
  });

  it('puts Family reunion kid-friendly ideas in one Kids group', () => {
    useWizardStore.getState().patch({ libraryOccasion: 'family-reunion', activities: [] });
    const { container } = render(<ActivitiesStep />);
    const first = container.querySelector('.activity-group');
    expect(first?.querySelector('h3')?.textContent).toMatch(/^Kids/);
    expect(within(first as HTMLElement).getByRole('checkbox', { name: /add let a kid teach the game/i })).toBeDefined();
    const ids = [...container.querySelectorAll('[data-activity-id]')].map((node) => node.getAttribute('data-activity-id'));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('finds safe ideas from another occasion', async () => {
    useWizardStore.getState().patch({ libraryOccasion: 'bachelor', activities: [] });
    render(<ActivitiesStep />);
    await userEvent.type(screen.getByLabelText(/search ideas/i), 'Let a Kid Teach the Game');
    expect(screen.getByRole('checkbox', { name: /add let a kid teach the game/i })).toBeDefined();
  });

  it('expands a catalog description without selecting the activity', async () => {
    useWizardStore.getState().patch({ libraryOccasion: 'general', activities: [] });
    render(<ActivitiesStep />);
    await userEvent.type(screen.getByLabelText(/search ideas/i), 'Give a Specific Toast');

    const checkbox = screen.getByRole('checkbox', { name: /add give a specific toast/i });
    const details = screen.getByRole('button', { name: /show details for give a specific toast/i });
    const row = details.closest('.activity-row');
    expect(details).toHaveAttribute('aria-expanded', 'false');
    expect(row).not.toHaveClass('expanded');

    await userEvent.click(details);

    expect(details).toHaveAttribute('aria-expanded', 'true');
    expect(details).toHaveAccessibleName(/hide details for give a specific toast/i);
    expect(row).toHaveClass('expanded');
    expect(useWizardStore.getState().draft.activities).toEqual([]);
    const descriptionId = details.getAttribute('aria-controls');
    expect(descriptionId).toBeTruthy();
    expect(document.getElementById(descriptionId!)).toHaveTextContent(/toast/i);
    expect(checkbox).not.toBeChecked();
  });

  it('keeps the points and difficulty columns inside the activity selection target', async () => {
    useWizardStore.getState().patch({ libraryOccasion: 'general', activities: [] });
    const { container } = render(<ActivitiesStep />);
    await userEvent.type(screen.getByLabelText(/search ideas/i), 'Give a Specific Toast');
    const row = container.querySelector('[data-activity-id="specific-toast"]') as HTMLElement;

    await userEvent.click(row.querySelector('.activity-row-points') as HTMLElement);
    expect(useWizardStore.getState().draft.activities[0]?.catalogId).toBe('specific-toast');
  });

  it('shows eight ideas per category before explicit expansion', async () => {
    useWizardStore.getState().patch({ libraryOccasion: 'bachelor', activities: [] });
    const { container } = render(<ActivitiesStep />);
    const first = container.querySelector('.activity-group') as HTMLElement;
    expect(first.querySelectorAll('.activity-row')).toHaveLength(8);
    await userEvent.click(within(first).getByRole('button', { name: /show \d+ more/i }));
    expect(first.querySelectorAll('.activity-row').length).toBeGreaterThan(8);
  });

  it('removes a selected catalog activity with the same checkbox', async () => {
    useWizardStore.getState().patch({ libraryOccasion: 'general', activities: [{ uid: crypto.randomUUID(), catalogId: 'specific-toast', name: 'Give a Specific Toast', points: 1, bonus: false }] });
    render(<ActivitiesStep />);
    const checkbox = screen.getByRole('checkbox', { name: /remove give a specific toast/i });
    expect(checkbox).toBeChecked();
    await userEvent.click(checkbox);
    expect(useWizardStore.getState().draft.activities.some((row) => row.catalogId === 'specific-toast')).toBe(false);
  });

  it('adds the curated recommended set for the inherited occasion', async () => {
    useWizardStore.getState().patch({ libraryOccasion: 'beach-trip', activities: [] });
    render(<ActivitiesStep />);
    await userEvent.click(screen.getByRole('button', { name: /add recommended set/i }));
    const selected = useWizardStore.getState().draft.activities;
    expect(selected).toHaveLength(16);
    expect(selected.some((row) => row.catalogId?.startsWith('sea-'))).toBe(true);
    expect(selected.some((row) => row.catalogId === 'team-trick-shot')).toBe(true);
  });

  it('clears all selected activities from the picker after confirming', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    useWizardStore.getState().patch({ activities: [
      { uid: crypto.randomUUID(), name: 'First activity', points: 1, bonus: false },
      { uid: crypto.randomUUID(), name: 'Second activity', points: 2, bonus: false },
    ] });
    render(<ActivitiesStep />);
    await userEvent.click(screen.getByRole('button', { name: /clear all/i }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(useWizardStore.getState().draft.activities).toEqual([]);
  });

  it('keeps every selection when Clear all is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    useWizardStore.getState().patch({ activities: [
      { uid: crypto.randomUUID(), name: 'First activity', points: 1, bonus: false },
    ] });
    render(<ActivitiesStep />);
    await userEvent.click(screen.getByRole('button', { name: /clear all/i }));
    expect(useWizardStore.getState().draft.activities).toHaveLength(1);
  });

  it('surfaces a selection hidden by an occasion change so it can be removed', async () => {
    // house-drink is adult-only, so it disappears from the kids-weekend browse
    // list — but must stay visible and removable instead of riding along unseen.
    useWizardStore.getState().patch({
      libraryOccasion: 'kids-weekend',
      activities: [{ uid: crypto.randomUUID(), catalogId: 'house-drink', name: 'Create a House Drink', points: 2, bonus: false }],
    });
    render(<ActivitiesStep />);

    // A notice near the count flags the hidden selection.
    expect(screen.getByText(/aren’t shown for this occasion|isn’t shown for this occasion/i)).toBeDefined();
    // It is not in the normal browse list yet.
    expect(screen.queryByRole('checkbox', { name: /remove create a house drink/i })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /^selected only$/i }));
    const remove = screen.getByRole('checkbox', { name: /remove create a house drink/i });
    expect(remove).toBeChecked();
    expect(screen.getByText(/not shown for this occasion/i)).toBeDefined();

    await userEvent.click(remove);
    expect(useWizardStore.getState().draft.activities).toEqual([]);
  });

  it('defers activity wording and points to Design', () => {
    render(<ActivitiesStep />);
    expect(screen.getByText('You can customize points and text for each activity later.')).toBeDefined();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('button', { name: /customize wording and points/i })).toBeNull();
  });

  it('adds a local custom idea with one default point', async () => {
    useWizardStore.getState().patch({ activities: [] });
    render(<ActivitiesStep />);
    await userEvent.click(screen.getByRole('button', { name: /add a new activity/i }));
    await userEvent.type(screen.getByLabelText(/activity name/i), 'Find the best porch story');
    expect(screen.queryByLabelText(/^points$/i)).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /^add idea$/i }));
    const added = useWizardStore.getState().draft.activities.at(-1);
    expect(added).toMatchObject({ name: 'Find the best porch story', points: 1, bonus: false });
    expect(added?.catalogId).toBeUndefined();
    expect(screen.getByText('Find the best porch story')).toBeDefined();
    expect(screen.getByText('Your idea')).toBeDefined();
  });
});

describe('stable row identity', () => {
  it('keeps focus and commits full strings while typing in existing rows', async () => {
    useWizardStore.getState().patch({ players: ['Player 1'] });
    const rosterView = render(<SetupStep />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit Player 1' }));
    const roster = screen.getByLabelText('Edit Player 1') as HTMLInputElement;
    await userEvent.type(roster, ' Jones');
    expect(document.activeElement).toBe(roster);
    await userEvent.keyboard('{Enter}');
    expect(useWizardStore.getState().draft.players[0]).toBe('Player 1 Jones');
    rosterView.unmount();

    useWizardStore.getState().patch({ activities: [{ uid: crypto.randomUUID(), name: 'First activity', points: 1, bonus: false }] });
    const firstName = useWizardStore.getState().draft.activities[0]!.name;
    render(<DesignStep {...designProps} />);
    const nameInput = screen.getByDisplayValue(firstName) as HTMLInputElement;
    await userEvent.type(nameInput, ' XYZ');
    expect(useWizardStore.getState().draft.activities[0]!.name).toBe(`${firstName} XYZ`);
    expect(document.activeElement).toBe(nameInput);
  });

  it('retains committed points after removing a duplicate-named row above', async () => {
    useWizardStore.getState().patch({ activities: [
      { uid: crypto.randomUUID(), name: 'Same activity', points: 1, bonus: false },
      { uid: crypto.randomUUID(), name: 'Same activity', points: 1, bonus: false },
    ] });
    render(<DesignStep {...designProps} />);

    const pointsInputs = screen.getAllByTitle(/a number, a range/i) as HTMLInputElement[];
    await userEvent.clear(pointsInputs[1]!);
    await userEvent.type(pointsInputs[1]!, '42');
    fireEvent.blur(pointsInputs[1]!);
    expect(useWizardStore.getState().draft.activities[1]!.points).toBe(42);

    await userEvent.click(screen.getAllByLabelText('Remove Same activity')[0]!);
    const activities = useWizardStore.getState().draft.activities;
    expect(activities).toHaveLength(1);
    expect(activities[0]!.points).toBe(42);
    const remaining = screen.getAllByTitle(/a number, a range/i) as HTMLInputElement[];
    expect(remaining).toHaveLength(1);
    expect(remaining[0]!.value).toBe('42');
  });
});

describe('DesignStep', () => {
  const props = designProps;

  it('offers clear buttons only on the two clearable tint fields', () => {
    render(<DesignStep {...props} />);
    // '' is only a valid theme value for pointsColTint/maxPointsColTint;
    // clearing any other color field would crash the pdf renderer.
    expect(screen.getAllByRole('button', { name: /^clear$/i })).toHaveLength(2);
    expect(screen.getByRole('button', { name: /download svg/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /download png/i })).toHaveTextContent(/preview only/i);
  });

  it('replaces (not merges) the theme when a preset chip is clicked', async () => {
    useWizardStore.getState().patch({ theme: structuredClone(THEME_PRESETS[0]!.theme) });
    render(<DesignStep {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'Ink' }));
    // Ink is `theme: {}` — a merge would leave Classic Teal intact; a replace
    // clears titleColor so the zod default applies downstream.
    expect(useWizardStore.getState().draft.theme.titleColor).toBeUndefined();
  });

  it('changes poster size in Design instead of Setup', async () => {
    render(<DesignStep {...props} />);
    await userEvent.selectOptions(screen.getByLabelText(/poster size/i), '36x48');
    expect(useWizardStore.getState().draft.posterSize).toBe('36x48');
  });

  it('offers Large and Compact header choices only for portrait Letter', async () => {
    const { rerender } = render(<DesignStep {...props} />);
    expect(screen.queryByRole('radio', { name: /large header/i })).toBeNull();

    useWizardStore.getState().patch({ posterSize: '8.5x11' });
    rerender(<DesignStep {...props} />);
    expect(screen.getByRole('radio', { name: /large header/i })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: /compact header/i }));
    expect(useWizardStore.getState().draft.letterHeaderStyle).toBe('compact');
  });

  it('hides printed rules without deleting their editor content', async () => {
    useWizardStore.getState().patch({
      posterSize: '8.5x11',
      rulesContent: 'Keep this exact rule.',
    });
    render(<DesignStep {...props} />);
    const toggle = screen.getByRole('checkbox', { name: /include rules on printout/i });
    expect(toggle).toBeChecked();
    await userEvent.click(toggle);
    expect(useWizardStore.getState().draft.includeRules).toBe(false);
    expect(useWizardStore.getState().draft.rulesContent).toBe('Keep this exact rule.');
    expect(screen.getByText(/saved, not included on the printout/i)).toBeDefined();
    expect(screen.getByLabelText(/^rules content$/i)).toHaveValue('Keep this exact rule.');
  });

  it('keeps Compact Header and corner boxes from creating an illegible combination', async () => {
    useWizardStore.getState().patch({
      posterSize: '8.5x11',
      cornerBoxes: ['WINNER'],
    });
    const { rerender } = render(<DesignStep {...props} />);
    const compactHeader = screen.getByRole('radio', { name: /compact header/i });
    expect(compactHeader).toBeDisabled();
    expect(compactHeader).toHaveAttribute('aria-describedby', 'compact-header-disabled-note');

    useWizardStore.getState().patch({ cornerBoxes: [], letterHeaderStyle: 'compact' });
    rerender(<DesignStep {...props} />);
    const addCornerBox = screen.getByRole('button', { name: /corner box/i });
    expect(addCornerBox).toBeDisabled();
    expect(addCornerBox).toHaveAttribute('aria-describedby', 'corner-box-disabled-note');
    expect(screen.getByText(/choose large header to add corner boxes/i)).toBeDefined();
  });

  it('hides only the separate max-points tint control on Letter', () => {
    useWizardStore.getState().patch({ posterSize: '8.5x11' });
    const { rerender } = render(<DesignStep {...props} />);
    expect(screen.queryByLabelText(/^max points column tint$/i)).toBeNull();
    expect(screen.getByLabelText(/^points column tint$/i)).toBeDefined();

    useWizardStore.getState().patch({ posterSize: '24x36' });
    rerender(<DesignStep {...props} />);
    expect(screen.getByLabelText(/^max points column tint$/i)).toBeDefined();
  });

  it('locks the poster size to a fixed note for the landscape-brackets layout', () => {
    useWizardStore.getState().patch({ template: 'landscapeBrackets' });
    render(<DesignStep {...props} />);
    expect(screen.queryByRole('combobox', { name: /poster size/i })).toBeNull();
    expect(screen.getByText(/60 × 48 in \(fixed for this layout\)/i)).toBeDefined();
  });

  it('makes Bold a safe no-op with no selection instead of inserting ****', async () => {
    useWizardStore.getState().patch({ rulesContent: 'Honor system' });
    render(<DesignStep {...props} />);
    const bold = screen.getByRole('button', { name: /^bold$/i });
    expect(bold).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(bold);
    expect(useWizardStore.getState().draft.rulesContent).toBe('Honor system');
  });

  it('edits selected activity wording and points in Activity details', async () => {
    useWizardStore.getState().patch({ activities: [{ uid: crypto.randomUUID(), name: 'Original wording', points: 1, bonus: false }] });
    render(<DesignStep {...props} />);
    expect(screen.getByRole('region', { name: /activity details/i })).toBeDefined();
    await userEvent.clear(screen.getByDisplayValue('Original wording'));
    await userEvent.type(screen.getByLabelText(/activity 1 name/i), 'Better wording');
    const points = screen.getByTitle(/a number, a range/i);
    await userEvent.clear(points);
    await userEvent.type(points, '4');
    fireEvent.blur(points);
    expect(useWizardStore.getState().draft.activities[0]).toMatchObject({ name: 'Better wording', points: 4 });
  });

  it('uses one rules title and one safe rich-text-lite content box', async () => {
    useWizardStore.getState().patch({ rulesTitle: 'Rules', rulesContent: 'Honor system\nBe kind.' });
    render(<DesignStep {...props} />);
    expect(screen.getByLabelText(/^rules title$/i)).toHaveValue('Rules');
    const content = screen.getByLabelText(/^rules content$/i) as HTMLTextAreaElement;
    expect(content).toHaveValue('Honor system\nBe kind.');
    expect(screen.queryByLabelText(/rule 1 heading/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /add rule/i })).toBeNull();

    content.setSelectionRange(0, 12);
    await userEvent.click(screen.getByRole('button', { name: /^bold$/i }));
    expect(useWizardStore.getState().draft.rulesContent).toBe('**Honor system**\nBe kind.');
  });

  it('turns selected rules lines into a bulleted list', async () => {
    useWizardStore.getState().patch({ rulesContent: 'First\nSecond' });
    render(<DesignStep {...props} />);
    const content = screen.getByLabelText(/^rules content$/i) as HTMLTextAreaElement;
    content.setSelectionRange(0, content.value.length);
    await userEvent.click(screen.getByRole('button', { name: /bulleted list/i }));
    expect(useWizardStore.getState().draft.rulesContent).toBe('- First\n- Second');
  });

  it('keeps blank paragraph separators when applying bullets', async () => {
    useWizardStore.getState().patch({ rulesContent: 'First\n\nSecond' });
    render(<DesignStep {...props} />);
    await userEvent.click(screen.getByRole('button', { name: /bulleted list/i }));
    expect(useWizardStore.getState().draft.rulesContent).toBe('- First\n\n- Second');
  });
});
