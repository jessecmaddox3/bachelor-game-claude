import type { CategoryId } from '@/models/board';

export interface PresetTask {
  title: string;
  category: CategoryId;
  pointValue: number;
  maxCompletions: number;
  pointsDisplay?: string;
}

export const PRESET_TASKS: PresetTask[] = [
  // Lifestyle / Sleep
  { title: 'Go to Sleep Before 7pm', category: 'challenge', pointValue: 3, maxCompletions: 1 },
  { title: 'Go to Sleep After 2:30am', category: 'challenge', pointValue: 4, maxCompletions: 1 },
  { title: "Don't Sleep in a Bed", category: 'challenge', pointValue: 3, maxCompletions: 1 },
  { title: "Don't Take a Bath/Shower", category: 'challenge', pointValue: 2, maxCompletions: 1 },

  // Drinking
  { title: 'Shotgun a Beer', category: 'drinking', pointValue: 1, maxCompletions: 5 },
  { title: 'Beer Funnel', category: 'drinking', pointValue: 2, maxCompletions: 1 },
  { title: 'Do 2 Shots in a Row', category: 'drinking', pointValue: 2, maxCompletions: 1 },
  { title: 'Beer Bong', category: 'drinking', pointValue: 2, maxCompletions: 1 },
  { title: 'Ching Chong Chug', category: 'drinking', pointValue: 1, maxCompletions: 1 },

  // Physical
  { title: 'Ice Bath', category: 'physical', pointValue: 2, maxCompletions: 1 },
  { title: 'Jump in the River', category: 'physical', pointValue: 2, maxCompletions: 1 },
  { title: '100 Pushups in 30 Minutes', category: 'physical', pointValue: 2, maxCompletions: 1 },
  { title: '100 Pullups', category: 'physical', pointValue: 3, maxCompletions: 1 },
  { title: 'Catch a Fish', category: 'physical', pointValue: 2, maxCompletions: 1 },

  // Service
  { title: 'Water Boy', category: 'service', pointValue: 2, maxCompletions: 1 },
  { title: 'Cook Something of Quality', category: 'service', pointValue: 2, maxCompletions: 1 },
  { title: 'Meal Cleanup', category: 'service', pointValue: 2, maxCompletions: 1 },

  // Challenges
  { title: 'Wear Handcuffs for 30 Minutes', category: 'challenge', pointValue: 2, maxCompletions: 1 },
  { title: 'Eat a (Really Hot) Pepper', category: 'challenge', pointValue: 2, maxCompletions: 1 },
  { title: 'Paper Airplane Throw > 40 ft', category: 'challenge', pointValue: 2, maxCompletions: 1 },
  { title: 'Make Indoor Bball Shot from 30 ft', category: 'challenge', pointValue: 2, maxCompletions: 1 },
  { title: 'Throwing Axe Bullseye', category: 'challenge', pointValue: 3, maxCompletions: 1 },
  { title: 'Hula Hoop for 10 Seconds', category: 'challenge', pointValue: 1, maxCompletions: 1 },
  { title: 'Hot Ones Challenge: Try All 10', category: 'challenge', pointValue: 3, maxCompletions: 1 },
  { title: 'Karaoke', category: 'challenge', pointValue: 1, maxCompletions: 1 },
  { title: 'Paintball Duel', category: 'challenge', pointValue: 2, maxCompletions: 1 },

  // Games / Tournaments
  { title: 'Beer Pong Tournament', category: 'game', pointValue: 1, maxCompletions: 1, pointsDisplay: '1 to 6' },
  { title: 'Pool Tournament', category: 'game', pointValue: 1, maxCompletions: 1, pointsDisplay: '1 to 6' },
  { title: 'Shuffleboard Tournament', category: 'game', pointValue: 1, maxCompletions: 1, pointsDisplay: '1 to 6' },
  { title: 'Win a Board Game', category: 'game', pointValue: 2, maxCompletions: 1 },
  { title: 'Win a Game of Chess', category: 'game', pointValue: 2, maxCompletions: 1 },
  { title: 'Win a Game of Stump', category: 'game', pointValue: 2, maxCompletions: 1 },
  { title: 'Win a Game of CanJam', category: 'game', pointValue: 2, maxCompletions: 1 },
  { title: 'Win Mario Kart Game', category: 'game', pointValue: 2, maxCompletions: 1 },
  { title: 'Coin Race', category: 'game', pointValue: 1, maxCompletions: 1 },

  // Social
  { title: 'Buffalo Someone Else', category: 'social', pointValue: 1, maxCompletions: 2 },
  { title: 'LIFE Someone Else', category: 'social', pointValue: 1, maxCompletions: 1 },
  { title: 'Call Someone on a Banned Word', category: 'social', pointValue: 1, maxCompletions: 3 },

  // Mishaps
  { title: 'Bleed (Involuntary)', category: 'wildcard', pointValue: 3, maxCompletions: 1 },
  { title: 'Throw Up', category: 'wildcard', pointValue: 1, maxCompletions: 1 },

  // Bonus
  { title: 'General Bonus', category: 'wildcard', pointValue: 1, maxCompletions: 1 },
];
