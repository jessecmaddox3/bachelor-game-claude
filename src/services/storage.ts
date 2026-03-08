import { BoardSchema, type Board } from '@/models/board';
import { z } from 'zod';

const STORAGE_KEY = 'bachelor-game-boards';
const STORAGE_VERSION = 2;

const StorageSchema = z.object({
  version: z.number(),
  boards: z.array(BoardSchema),
});

type StorageData = z.infer<typeof StorageSchema>;

export function loadBoards(): Board[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const result = StorageSchema.safeParse(parsed);
    if (!result.success) {
      console.warn('Invalid storage data, resetting:', result.error);
      return [];
    }
    return result.data.boards;
  } catch {
    return [];
  }
}

export function saveBoards(boards: Board[]): void {
  const data: StorageData = {
    version: STORAGE_VERSION,
    boards,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function exportBoardJson(board: Board): string {
  return JSON.stringify(board, null, 2);
}

export function importBoardJson(json: string): Board | null {
  try {
    const parsed = JSON.parse(json);
    const result = BoardSchema.safeParse(parsed);
    if (!result.success) return null;
    return result.data;
  } catch {
    return null;
  }
}
