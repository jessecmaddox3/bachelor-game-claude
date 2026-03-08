const DPI = 300;

// Minimum dimensions for print legibility (in pixels at 300 DPI)
export const MIN_COLUMN_WIDTH = Math.round(0.6 * DPI); // 180px = 0.6"
export const MIN_ROW_HEIGHT = Math.round(0.3 * DPI); // 90px = 0.3"

// Margins: 0.5" safe area
export const MARGIN_PX = Math.round(0.5 * DPI); // 150px

// Player limits
export const MIN_PLAYERS = 8;
export const MAX_PLAYERS = 35;

// Task limits
export const MIN_TASKS = 5;
export const MAX_TASKS = 80;
