import type { PosterSize, LayoutPlan, Rect } from '@/models/poster';
import type { Theme } from '@/models/theme';
import type { Player, Task, DesignConfig } from '@/models/board';
import { MARGIN_PX, MIN_COLUMN_WIDTH, MIN_ROW_HEIGHT } from '@/config/constraints';

interface BoardConfig {
  players: Player[];
  tasks: Task[];
  design: DesignConfig;
}

const DPI = 300;

export function computeLayout(
  config: BoardConfig,
  posterSize: PosterSize,
  _theme: Theme,
): LayoutPlan {
  const { players, tasks, design } = config;
  const errors: string[] = [];

  const totalTaskRows = tasks.length + design.emptyRows;
  const margin = MARGIN_PX;

  // ─── Usable area ───────────────────────────────────────────────────────
  const usableX = margin;
  const usableY = margin;
  const usableW = posterSize.widthPx - 2 * margin;
  const usableH = posterSize.heightPx - 2 * margin;

  // ─── Vertical partitioning ─────────────────────────────────────────────
  // Header: compact, ~10% of height
  const headerHeight = Math.round(usableH * 0.10);

  // Rules: compact, ~6% if shown
  const rulesHeight = design.showRules ? Math.round(usableH * 0.065) : 0;

  // Grid gets everything else
  const gridHeight = usableH - headerHeight - rulesHeight;

  // Column header: enough for rotated text but not excessive
  // Target ~2 inches for rotated column headers = 600px at 300dpi
  // But cap as a percentage to avoid being too large on huge posters
  const columnHeaderHeight = Math.min(
    Math.round(2.2 * DPI), // max 2.2 inches
    Math.round(gridHeight * 0.12), // or 12% of grid
  );

  // Row area: grid minus column header, shared by all rows including total
  const rowAreaHeight = gridHeight - columnHeaderHeight;
  const allRowCount = totalTaskRows + 1; // +1 for total points row
  const rowHeight = Math.floor(rowAreaHeight / allRowCount);

  // ─── Horizontal partitioning ───────────────────────────────────────────
  // Points columns: fixed widths (in inches)
  const possiblePtsColWidth = Math.round(1.0 * DPI); // 1.0 inch
  const maxPtsColWidth = Math.round(0.8 * DPI); // 0.8 inch

  // Player columns get ~58% of width, task label gets the rest
  const targetPlayerAreaRatio = 0.58;
  const nonPlayerWidth = possiblePtsColWidth + maxPtsColWidth;
  const playerAreaBudget = Math.round(usableW * targetPlayerAreaRatio);
  const playerColWidth = players.length > 0
    ? Math.floor(playerAreaBudget / players.length)
    : 0;
  const actualPlayerArea = playerColWidth * players.length;

  // Task label gets remaining width
  const taskLabelColWidth = usableW - nonPlayerWidth - actualPlayerArea;

  const playerColStartX = usableX + taskLabelColWidth + possiblePtsColWidth + maxPtsColWidth;

  // ─── Feasibility check ─────────────────────────────────────────────────
  if (playerColWidth < MIN_COLUMN_WIDTH && players.length > 0) {
    errors.push(`Player columns too narrow (${playerColWidth}px < ${MIN_COLUMN_WIDTH}px). Try a larger poster or fewer players.`);
  }
  if (rowHeight < MIN_ROW_HEIGHT) {
    errors.push(`Rows too short (${rowHeight}px < ${MIN_ROW_HEIGHT}px). Try a larger poster or fewer tasks.`);
  }
  if (taskLabelColWidth < Math.round(1.5 * DPI)) {
    errors.push(`Task label column too narrow. Try a larger poster or fewer players.`);
  }

  const feasible = errors.length === 0;

  // ─── Rects ─────────────────────────────────────────────────────────────
  const headerRect: Rect = { x: usableX, y: usableY, width: usableW, height: headerHeight };
  const gridRect: Rect = { x: usableX, y: usableY + headerHeight, width: usableW, height: gridHeight };
  const rulesRect: Rect | null = design.showRules
    ? { x: usableX, y: usableY + headerHeight + gridHeight, width: usableW, height: rulesHeight }
    : null;

  // "THE GAME" label area
  const gameLabelRect: Rect = {
    x: usableX,
    y: gridRect.y,
    width: taskLabelColWidth,
    height: columnHeaderHeight,
  };

  const gridStartY = gridRect.y + columnHeaderHeight;

  // Champion/Loser boxes
  const boxW = Math.round(usableW * 0.10);
  const boxH = Math.round(headerHeight * 0.20);
  const boxX = usableX + usableW - boxW - 10;
  const championBox: Rect = { x: boxX, y: usableY + headerHeight * 0.10, width: boxW, height: boxH };
  const loserBox: Rect = { x: boxX, y: usableY + headerHeight * 0.55, width: boxW, height: boxH };

  // Task rows
  const taskRows = [];
  for (let i = 0; i < totalTaskRows; i++) {
    taskRows.push({
      y: gridStartY + i * rowHeight,
      isEmptyRow: i >= tasks.length,
    });
  }

  // Total points row (immediately after last task row)
  const totalRowY = gridStartY + totalTaskRows * rowHeight;

  // ─── Font scaling ──────────────────────────────────────────────────────
  const pt = (p: number) => Math.round(p * (DPI / 72));
  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  const fonts = {
    eventTitle: clamp(Math.round(headerHeight * 0.20), pt(16), pt(54)),
    honorName: clamp(Math.round(headerHeight * 0.34), pt(22), pt(72)),
    subtitle: clamp(Math.round(headerHeight * 0.11), pt(9), pt(24)),
    gameLabel: clamp(Math.round(columnHeaderHeight * 0.28), pt(20), pt(56)),
    activitiesLabel: clamp(Math.round(columnHeaderHeight * 0.08), pt(7), pt(14)),
    columnHeader: clamp(Math.round(Math.min(possiblePtsColWidth, maxPtsColWidth) * 0.18), pt(4), pt(9)),
    playerName: clamp(Math.round(playerColWidth * 0.20), pt(5), pt(16)),
    taskLabel: clamp(Math.round(rowHeight * 0.50), pt(6), pt(24)),
    points: clamp(Math.round(rowHeight * 0.45), pt(6), pt(20)),
    totalLabel: clamp(Math.round(rowHeight * 0.50), pt(8), pt(26)),
    championLabel: clamp(Math.round(headerHeight * 0.055), pt(5), pt(10)),
    rulesTitle: rulesHeight > 0 ? clamp(Math.round(rulesHeight * 0.10), pt(8), pt(14)) : 0,
    rulesBody: rulesHeight > 0 ? clamp(Math.round(rulesHeight * 0.055), pt(5), pt(9)) : 0,
    rulesTerm: rulesHeight > 0 ? clamp(Math.round(rulesHeight * 0.065), pt(5), pt(10)) : 0,
    footerNote: rulesHeight > 0 ? clamp(Math.round(rulesHeight * 0.055), pt(5), pt(9)) : 0,
  };

  return {
    posterSize,
    headerRect,
    gridRect,
    rulesRect,
    championBox,
    loserBox,
    gameLabelRect,
    columnHeaderHeight,
    taskLabelColWidth,
    possiblePtsColWidth,
    maxPtsColWidth,
    playerColWidth,
    playerColStartX,
    rowHeight,
    gridStartY,
    taskRows,
    totalRowY,
    fonts,
    feasible,
    errors,
  };
}
