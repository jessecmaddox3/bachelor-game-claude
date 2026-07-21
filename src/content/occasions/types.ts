import type { Draft } from '../../store/toBoardSpec';

/** A complete, reusable starting board that can be loaded into the wizard. */
export interface OccasionPack {
  id: string;
  name: string;
  description: string;
  createDraft: () => Draft;
}
