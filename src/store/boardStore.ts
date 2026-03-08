import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Board } from '@/models/board';
import { createDefaultDesign } from '@/models/board';
import { loadBoards, saveBoards } from '@/services/storage';
import { getRandomNames } from '@/config/names';
import { PRESET_TASKS } from '@/config/presets';

interface BoardStore {
  boards: Board[];
  loaded: boolean;
  load: () => void;
  createBoard: (name: string) => Board;
  duplicateBoard: (id: string) => Board | null;
  deleteBoard: (id: string) => void;
  updateBoard: (board: Board) => void;
  getBoard: (id: string) => Board | undefined;
  createRandomBoard: () => Board;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  boards: [],
  loaded: false,

  load: () => {
    const boards = loadBoards();
    set({ boards, loaded: true });
  },

  createBoard: (name: string) => {
    const now = new Date().toISOString();
    const board: Board = {
      id: nanoid(),
      name,
      eventTitle: 'THE WEEKEND OF',
      honorName: '',
      subtitle: '',
      createdAt: now,
      updatedAt: now,
      players: [],
      tasks: [],
      design: createDefaultDesign(),
    };
    const boards = [...get().boards, board];
    set({ boards });
    saveBoards(boards);
    return board;
  },

  duplicateBoard: (id: string) => {
    const source = get().boards.find((b) => b.id === id);
    if (!source) return null;
    const now = new Date().toISOString();
    const board: Board = {
      ...structuredClone(source),
      id: nanoid(),
      name: `${source.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    const boards = [...get().boards, board];
    set({ boards });
    saveBoards(boards);
    return board;
  },

  deleteBoard: (id: string) => {
    const boards = get().boards.filter((b) => b.id !== id);
    set({ boards });
    saveBoards(boards);
  },

  updateBoard: (board: Board) => {
    const boards = get().boards.map((b) =>
      b.id === board.id ? { ...board, updatedAt: new Date().toISOString() } : b,
    );
    set({ boards });
    saveBoards(boards);
  },

  getBoard: (id: string) => {
    return get().boards.find((b) => b.id === id);
  },

  createRandomBoard: () => {
    const names = getRandomNames(12);
    const honorName = names[0]!;
    const playerNames = names.slice(1);
    const now = new Date().toISOString();

    const players = playerNames.map((name, i) => ({
      id: nanoid(),
      name,
      order: i,
    }));

    const shuffledPresets = [...PRESET_TASKS].sort(() => Math.random() - 0.5);
    const selectedPresets = shuffledPresets.slice(0, 25);
    const tasks = selectedPresets.map((preset, i) => ({
      id: nanoid(),
      title: preset.title,
      category: preset.category,
      pointValue: preset.pointValue,
      maxCompletions: preset.maxCompletions,
      order: i,
      source: 'preset' as const,
      pointsDisplay: preset.pointsDisplay,
    }));

    const board: Board = {
      id: nanoid(),
      name: `${honorName}'s Weekend`,
      eventTitle: 'THE WEEKEND OF',
      honorName,
      subtitle: 'Let the games begin',
      createdAt: now,
      updatedAt: now,
      players,
      tasks,
      design: createDefaultDesign(),
    };

    const boards = [...get().boards, board];
    set({ boards });
    saveBoards(boards);
    return board;
  },
}));
