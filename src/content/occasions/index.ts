import { JESSE_2017_OCCASION } from './jesse2017';
import type { OccasionPack } from './types';

export type { OccasionPack } from './types';
export * from './jesse2017';

export const OCCASION_PACKS: OccasionPack[] = [JESSE_2017_OCCASION];

export function occasionById(id: string): OccasionPack | undefined {
  return OCCASION_PACKS.find((pack) => pack.id === id);
}
