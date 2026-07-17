import type { PointsValue } from '../models/boardSpec';

export const ACTIVITY_CATEGORIES = ['drinking', 'physical', 'service', 'challenge', 'game', 'social', 'wildcard'] as const;
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export interface PresetActivity {
  name: string;
  points: PointsValue;
  maxPoints?: number;
  category: ActivityCategory;
}

export const ACTIVITY_LIBRARY: PresetActivity[] = [
  { name: 'Go to Sleep Before 7pm', points: 3, category: 'challenge' },
  { name: 'Go to Sleep After 2:30am', points: 4, category: 'challenge' },
  { name: "Don't Sleep in a Bed", points: 3, category: 'challenge' },
  { name: "Don't Take a Bath/Shower", points: 2, category: 'challenge' },
  { name: 'Shotgun a Beer', points: 1, maxPoints: 5, category: 'drinking' },
  { name: 'Beer Funnel', points: 2, category: 'drinking' },
  { name: 'Do 2 Shots in a Row', points: 2, category: 'drinking' },
  { name: 'Beer Bong', points: 2, category: 'drinking' },
  { name: 'Ching Chong Chug', points: 1, category: 'drinking' },
  { name: 'Ice Bath', points: 2, category: 'physical' },
  { name: 'Jump in the River', points: 2, category: 'physical' },
  { name: '100 Pushups in 30 Minutes', points: 2, category: 'physical' },
  { name: '100 Pullups', points: 3, category: 'physical' },
  { name: 'Catch a Fish', points: 2, category: 'physical' },
  { name: 'Water Boy', points: 2, category: 'service' },
  { name: 'Cook Something of Quality', points: 2, category: 'service' },
  { name: 'Meal Cleanup', points: 2, category: 'service' },
  { name: 'Wear Handcuffs for 30 Minutes', points: 2, category: 'challenge' },
  { name: 'Eat a (Really Hot) Pepper', points: 2, category: 'challenge' },
  { name: 'Paper Airplane Throw > 40 ft', points: 2, category: 'challenge' },
  { name: 'Make Indoor Bball Shot from 30 ft', points: 2, category: 'challenge' },
  { name: 'Throwing Axe Bullseye', points: 3, category: 'challenge' },
  { name: 'Hula Hoop for 10 Seconds', points: 1, category: 'challenge' },
  { name: 'Hot Ones Challenge: Try All 10', points: 3, category: 'challenge' },
  { name: 'Karaoke', points: 1, category: 'challenge' },
  { name: 'Paintball Duel', points: 2, category: 'challenge' },
  { name: 'Beer Pong Tournament', points: { min: 1, max: 6 }, category: 'game' },
  { name: 'Pool Tournament', points: { min: 1, max: 6 }, category: 'game' },
  { name: 'Shuffleboard Tournament', points: { min: 1, max: 6 }, category: 'game' },
  { name: 'Win a Board Game', points: 2, category: 'game' },
  { name: 'Win a Game of Chess', points: 2, category: 'game' },
  { name: 'Win a Game of Stump', points: 2, category: 'game' },
  { name: 'Win a Game of CanJam', points: 2, category: 'game' },
  { name: 'Win Mario Kart Game', points: 2, category: 'game' },
  { name: 'Coin Race', points: 1, category: 'game' },
  { name: 'Buffalo Someone Else', points: 1, maxPoints: 2, category: 'social' },
  { name: 'LIFE Someone Else', points: 1, category: 'social' },
  { name: 'Call Someone on a Banned Word', points: 1, maxPoints: 3, category: 'social' },
  { name: 'Bleed (Involuntary)', points: 3, category: 'wildcard' },
  { name: 'Throw Up', points: 1, category: 'wildcard' },
  { name: 'Go to Sleep Before 10pm', points: 2, category: 'challenge' },
  { name: 'Win Rock Paper Scissors Best of 5', points: 1, category: 'game' },
  { name: 'Give a Toast at Dinner', points: 1, category: 'social' },
  { name: 'First One Up Makes Coffee', points: 2, category: 'service' },
];

export const STARTER_RULES = [
  { heading: 'BUFFALO', text: 'If someone is drinking with their right hand, call Buffalo and they have to chug it.' },
  { heading: 'WATER BOY', text: 'Go around offering water to every person to ensure they are hydrated.' },
  { heading: 'COIN RACE', text: 'Spin a coin on a table, then start chugging. Finish before the coin falls to win.' },
  { heading: 'ICE BATH', text: 'Sit in the ice bath for one minute. Emerge with your entire body wet.' },
  { heading: 'CHING CHONG CHUG', text: "There is a dedicated ping pong ball. The possessor tries to put it in someone's cup; success means they chug and take the ball." },
];

export const STARTER_FOOTNOTE = 'Speaking a banned word means you must finish your drink.';
