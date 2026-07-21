import {
  ACTIVITY_BROWSE_CATEGORY_LABELS,
  ACTIVITY_OCCASIONS,
  type ActivityBrowseCategory,
  type ActivityDifficulty,
  type ActivityOccasion,
  type PresetActivity,
} from './activities';

export const ACTIVITY_CATEGORY_ORDER: Record<ActivityOccasion, readonly ActivityBrowseCategory[]> = {
  bachelor: ['drinking', 'movement', 'sports', 'games', 'social', 'bold', 'outdoors', 'food', 'creative', 'service', 'learning'],
  bachelorette: ['social', 'games', 'movement', 'bold', 'drinking', 'creative', 'food', 'outdoors', 'sports', 'service', 'learning'],
  'kids-weekend': ['games', 'creative', 'movement', 'outdoors', 'sports', 'social', 'learning', 'food', 'service'],
  anniversary: ['social', 'creative', 'food', 'service', 'games', 'outdoors', 'movement', 'bold', 'drinking', 'learning', 'sports'],
  'family-reunion': ['kids', 'social', 'games', 'food', 'service', 'creative', 'outdoors', 'sports', 'learning', 'movement', 'drinking', 'bold'],
  'friends-weekend': ['games', 'food', 'outdoors', 'social', 'sports', 'drinking', 'movement', 'creative', 'service', 'bold', 'learning'],
  'beach-trip': ['outdoors', 'sports', 'movement', 'games', 'food', 'social', 'creative', 'service', 'drinking', 'bold', 'learning'],
  general: ['social', 'games', 'food', 'creative', 'outdoors', 'movement', 'sports', 'service', 'learning', 'bold', 'drinking'],
};

const DIFFICULTY_ORDER: Record<ActivityDifficulty, number> = {
  easy: 0,
  stretch: 1,
  quest: 2,
};

export interface ActivityBrowseGroup {
  category: ActivityBrowseCategory;
  label: string;
  activities: PresetActivity[];
}

export function isActivitySafeForOccasion(activity: PresetActivity, occasion: ActivityOccasion): boolean {
  if (occasion === 'kids-weekend') return !activity.adultOnly && activity.category !== 'drinking';
  if (occasion === 'family-reunion' && (activity.adultOnly || activity.category === 'drinking')) {
    return activity.occasions.includes('family-reunion');
  }
  return true;
}

export function activityRelevance(activity: PresetActivity, occasion: ActivityOccasion): number {
  if (activity.primaryOccasion === occasion) return 0;
  if (activity.occasions.includes(occasion) && activity.occasions.length < ACTIVITY_OCCASIONS.length) return 1;
  if (!activity.primaryOccasion) return 2;
  return 3;
}

function compareActivities(left: PresetActivity, right: PresetActivity, occasion: ActivityOccasion): number {
  return activityRelevance(left, occasion) - activityRelevance(right, occasion)
    || DIFFICULTY_ORDER[left.difficulty] - DIFFICULTY_ORDER[right.difficulty]
    || left.name.localeCompare(right.name);
}

export function groupActivitiesForOccasion(
  activities: readonly PresetActivity[],
  occasion: ActivityOccasion,
): ActivityBrowseGroup[] {
  const order = ACTIVITY_CATEGORY_ORDER[occasion];
  const grouped = new Map<ActivityBrowseCategory, PresetActivity[]>();

  for (const activity of activities) {
    if (!isActivitySafeForOccasion(activity, occasion)) continue;
    const categories = new Set<ActivityBrowseCategory>([activity.category, ...(activity.browseTags ?? [])]);
    const category = order.find((candidate) => categories.has(candidate));
    if (!category) continue;
    const rows = grouped.get(category) ?? [];
    rows.push(activity);
    grouped.set(category, rows);
  }

  return order.flatMap((category) => {
    const rows = grouped.get(category);
    if (!rows?.length) return [];
    return [{
      category,
      label: ACTIVITY_BROWSE_CATEGORY_LABELS[category],
      activities: rows.sort((left, right) => compareActivities(left, right, occasion)),
    }];
  });
}
