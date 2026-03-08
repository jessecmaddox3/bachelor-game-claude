import { CategoryIds, CategoryLabels, CategoryColors, type CategoryId } from '@/models/board';

export interface CategoryConfig {
  id: CategoryId;
  label: string;
  color: string;
}

export const CATEGORIES: CategoryConfig[] = CategoryIds.map((id) => ({
  id,
  label: CategoryLabels[id],
  color: CategoryColors[id],
}));

export { CategoryIds, CategoryLabels, CategoryColors };
