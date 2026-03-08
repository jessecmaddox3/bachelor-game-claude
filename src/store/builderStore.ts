import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Board, Player, Task, DesignConfig, RuleEntry, CategoryId } from '@/models/board';
import { createDefaultDesign } from '@/models/board';

interface BuilderStore {
  boardId: string | null;
  name: string;
  eventTitle: string;
  honorName: string;
  subtitle: string;
  players: Player[];
  tasks: Task[];
  design: DesignConfig;

  loadBoard: (board: Board) => void;
  reset: () => void;
  toBoard: () => Board | null;

  // Info
  setName: (name: string) => void;
  setEventTitle: (title: string) => void;
  setHonorName: (name: string) => void;
  setSubtitle: (subtitle: string) => void;

  // Roster
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  updatePlayerName: (id: string, name: string) => void;
  reorderPlayers: (fromIndex: number, toIndex: number) => void;

  // Tasks
  addTask: (task: Omit<Task, 'id' | 'order'>) => void;
  removeTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void;
  reorderTasks: (fromIndex: number, toIndex: number) => void;
  addPresetTasks: (tasks: Array<{ title: string; category: CategoryId; pointValue: number; maxCompletions: number; pointsDisplay?: string }>) => void;

  // Design
  setPosterSize: (sizeId: string) => void;
  setShowRules: (show: boolean) => void;
  setFooterNote: (note: string) => void;
  setRulesEntries: (entries: RuleEntry[]) => void;
  addRuleEntry: (term: string, definition: string) => void;
  removeRuleEntry: (index: number) => void;
  setEmptyRows: (count: number) => void;
  setShowChampionLoser: (show: boolean) => void;
  setAccentColor: (color: string) => void;
}

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  boardId: null,
  name: '',
  eventTitle: 'THE WEEKEND OF',
  honorName: '',
  subtitle: '',
  players: [],
  tasks: [],
  design: createDefaultDesign(),

  loadBoard: (board: Board) => {
    set({
      boardId: board.id,
      name: board.name,
      eventTitle: board.eventTitle,
      honorName: board.honorName,
      subtitle: board.subtitle,
      players: [...board.players],
      tasks: [...board.tasks],
      design: structuredClone(board.design),
    });
  },

  reset: () => {
    set({
      boardId: null,
      name: '',
      eventTitle: 'THE WEEKEND OF',
      honorName: '',
      subtitle: '',
      players: [],
      tasks: [],
      design: createDefaultDesign(),
    });
  },

  toBoard: () => {
    const state = get();
    if (!state.boardId) return null;
    return {
      id: state.boardId,
      name: state.name,
      eventTitle: state.eventTitle,
      honorName: state.honorName,
      subtitle: state.subtitle,
      createdAt: '',
      updatedAt: '',
      players: state.players,
      tasks: state.tasks,
      design: state.design,
    };
  },

  setName: (name) => set({ name }),
  setEventTitle: (eventTitle) => set({ eventTitle }),
  setHonorName: (honorName) => set({ honorName }),
  setSubtitle: (subtitle) => set({ subtitle }),

  addPlayer: (name) => {
    const players = get().players;
    set({
      players: [
        ...players,
        { id: nanoid(), name, order: players.length },
      ],
    });
  },

  removePlayer: (id) => {
    const players = get().players
      .filter((p) => p.id !== id)
      .map((p, i) => ({ ...p, order: i }));
    set({ players });
  },

  updatePlayerName: (id, name) => {
    set({
      players: get().players.map((p) => (p.id === id ? { ...p, name } : p)),
    });
  },

  reorderPlayers: (fromIndex, toIndex) => {
    const players = [...get().players];
    const [moved] = players.splice(fromIndex, 1);
    if (!moved) return;
    players.splice(toIndex, 0, moved);
    set({ players: players.map((p, i) => ({ ...p, order: i })) });
  },

  addTask: (task) => {
    const tasks = get().tasks;
    set({
      tasks: [...tasks, { ...task, id: nanoid(), order: tasks.length }],
    });
  },

  removeTask: (id) => {
    const tasks = get().tasks
      .filter((t) => t.id !== id)
      .map((t, i) => ({ ...t, order: i }));
    set({ tasks });
  },

  updateTask: (id, updates) => {
    set({
      tasks: get().tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    });
  },

  reorderTasks: (fromIndex, toIndex) => {
    const tasks = [...get().tasks];
    const [moved] = tasks.splice(fromIndex, 1);
    if (!moved) return;
    tasks.splice(toIndex, 0, moved);
    set({ tasks: tasks.map((t, i) => ({ ...t, order: i })) });
  },

  addPresetTasks: (presets) => {
    const existing = get().tasks;
    const existingTitles = new Set(existing.map((t) => t.title.toLowerCase()));
    const newTasks = presets
      .filter((p) => !existingTitles.has(p.title.toLowerCase()))
      .map((p, i) => ({
        id: nanoid(),
        title: p.title,
        category: p.category,
        pointValue: p.pointValue,
        maxCompletions: p.maxCompletions,
        order: existing.length + i,
        source: 'preset' as const,
        pointsDisplay: p.pointsDisplay,
      }));
    set({ tasks: [...existing, ...newTasks] });
  },

  setPosterSize: (posterSize) => set({ design: { ...get().design, posterSize } }),
  setShowRules: (show) => set({ design: { ...get().design, showRules: show } }),
  setFooterNote: (footerNote) => set({ design: { ...get().design, footerNote } }),
  setRulesEntries: (rulesEntries) => set({ design: { ...get().design, rulesEntries } }),
  addRuleEntry: (term, definition) => {
    const design = get().design;
    set({ design: { ...design, rulesEntries: [...design.rulesEntries, { term, definition }] } });
  },
  removeRuleEntry: (index) => {
    const design = get().design;
    set({ design: { ...design, rulesEntries: design.rulesEntries.filter((_, i) => i !== index) } });
  },
  setEmptyRows: (emptyRows) => set({ design: { ...get().design, emptyRows } }),
  setShowChampionLoser: (show) => set({ design: { ...get().design, showChampionLoser: show } }),
  setAccentColor: (accentColor) => set({ design: { ...get().design, accentColor } }),
}));
