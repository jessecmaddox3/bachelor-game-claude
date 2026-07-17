import type { BoardSpec } from '../models/boardSpec';

export type ThemeValues = BoardSpec['theme'];

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  theme: Partial<ThemeValues>;
}

/**
 * Starter presets mapped from the build-4 theme ideas onto the flat schema-v2
 * theme. Fonts/decorations from the old model don't map yet (Plan 4).
 */
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'steven',
    name: 'Classic Teal',
    description: 'The original hand-made look: teal masthead, blue grid, tinted scoring columns',
    theme: {
      titleColor: '#45C0C8',
      accentColor: '#3A6BC7',
      activityColor: '#3A6BC7',
      highlightColor: '#141414',
      rowTint: '#EAF1F8',
      pointsColTint: '#D8E9F5',
      maxPointsColTint: '#E8E8E8',
      cornerLabel: 'THE GAME',
      cornerSubLabel: 'ACTIVITIES',
      allCaps: true,
    },
  },
  {
    id: 'ink',
    name: 'Ink',
    description: 'Clean black-on-white, red highlights',
    theme: {},
  },
  {
    id: 'casino',
    name: 'Casino',
    description: 'High-roller gold and felt green',
    theme: {
      titleColor: '#B8860B',
      accentColor: '#0B6B3A',
      activityColor: '#1A1A1A',
      highlightColor: '#B22222',
      rowTint: '#F5EEDC',
      pointsColTint: '#EFE3C0',
      maxPointsColTint: '#E8E8E8',
      cornerLabel: 'THE GAME',
      cornerSubLabel: 'ACTIVITIES',
      allCaps: true,
    },
  },
  {
    id: 'outdoors',
    name: 'Outdoors',
    description: 'Forest green and timber',
    theme: {
      titleColor: '#2F5D3A',
      accentColor: '#7A4A21',
      activityColor: '#23402B',
      highlightColor: '#7A4A21',
      rowTint: '#EDF3EA',
      pointsColTint: '#DDE9D6',
      maxPointsColTint: '#EAE4DA',
      cornerLabel: 'THE GAME',
      cornerSubLabel: 'ACTIVITIES',
      allCaps: true,
    },
  },
];
