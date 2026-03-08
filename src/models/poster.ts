export interface PosterSize {
  id: string;
  label: string;
  widthInches: number;
  heightInches: number;
  widthPx: number;
  heightPx: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutPlan {
  posterSize: PosterSize;

  // Major regions
  headerRect: Rect;
  gridRect: Rect;
  rulesRect: Rect | null;

  // Header elements
  championBox: Rect;
  loserBox: Rect;

  // Grid structure
  gameLabelRect: Rect;           // "THE GAME" big label area
  columnHeaderHeight: number;     // Height of the column header row
  taskLabelColWidth: number;      // Width of the task/activities column
  possiblePtsColWidth: number;    // Width of "POSSIBLE POINTS" column
  maxPtsColWidth: number;         // Width of "MAX POINTS" column
  playerColWidth: number;         // Width of each player column
  playerColStartX: number;        // X where player columns begin
  rowHeight: number;              // Height of each task row
  gridStartY: number;             // Y where task rows begin (after column headers)

  // Computed rects for each task row
  taskRows: Array<{
    y: number;
    isEmptyRow: boolean;
  }>;

  // Total points row
  totalRowY: number;

  // Font sizes
  fonts: {
    eventTitle: number;
    honorName: number;
    subtitle: number;
    gameLabel: number;
    activitiesLabel: number;
    columnHeader: number;
    playerName: number;
    taskLabel: number;
    points: number;
    totalLabel: number;
    championLabel: number;
    rulesTitle: number;
    rulesBody: number;
    rulesTerm: number;
    footerNote: number;
  };

  feasible: boolean;
  errors: string[];
}
