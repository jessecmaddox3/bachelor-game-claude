import type { PosterSize } from '@/models/poster';

const DPI = 300;

export const POSTER_SIZES: PosterSize[] = [
  {
    id: '18x24',
    label: '18" x 24"',
    widthInches: 18,
    heightInches: 24,
    widthPx: 18 * DPI,
    heightPx: 24 * DPI,
  },
  {
    id: '24x36',
    label: '24" x 36"',
    widthInches: 24,
    heightInches: 36,
    widthPx: 24 * DPI,
    heightPx: 36 * DPI,
  },
  {
    id: '36x48',
    label: '36" x 48"',
    widthInches: 36,
    heightInches: 48,
    widthPx: 36 * DPI,
    heightPx: 48 * DPI,
  },
  {
    id: '48x72',
    label: '48" x 72"',
    widthInches: 48,
    heightInches: 72,
    widthPx: 48 * DPI,
    heightPx: 72 * DPI,
  },
];

export function getPosterSize(id: string): PosterSize {
  const size = POSTER_SIZES.find((s) => s.id === id);
  if (!size) throw new Error(`Unknown poster size: ${id}`);
  return size;
}
