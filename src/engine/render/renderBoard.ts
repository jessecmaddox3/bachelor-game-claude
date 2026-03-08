import type { LayoutPlan } from '@/models/poster';
import type { Player, Task, DesignConfig, RuleEntry } from '@/models/board';

export interface RenderData {
  eventTitle: string;
  honorName: string;
  subtitle: string;
  players: Player[];
  tasks: Task[];
  design: DesignConfig;
}

const LINE_COLOR = '#AAAAAA';
const LINE_WIDTH = 1.5;
const BORDER_COLOR = '#333333';
const BORDER_WIDTH = 4;
const TEXT_COLOR = '#1a1a1a';
const PTS_BG = '#FFF8E1';
const FONT = 'Arial, Helvetica, sans-serif';

export function renderBoard(
  ctx: CanvasRenderingContext2D,
  layout: LayoutPlan,
  data: RenderData,
): void {
  const { posterSize } = layout;

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, posterSize.widthPx, posterSize.heightPx);

  renderHeader(ctx, layout, data);
  renderColumnHeaders(ctx, layout, data);
  renderTaskRows(ctx, layout, data);
  renderTotalRow(ctx, layout, data);
  renderGridLines(ctx, layout, data);

  if (layout.rulesRect && data.design.showRules) {
    renderRules(ctx, layout, data);
  }
}

// ─── HEADER ────────────────────────────────────────────────────────────────────

function renderHeader(
  ctx: CanvasRenderingContext2D,
  layout: LayoutPlan,
  data: RenderData,
): void {
  const { headerRect, fonts, championBox, loserBox } = layout;
  const accent = data.design.accentColor;
  const centerX = headerRect.x + headerRect.width / 2;

  // Event title line 1
  if (data.eventTitle) {
    ctx.fillStyle = accent;
    ctx.font = `900 ${fonts.eventTitle}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      data.eventTitle.toUpperCase(),
      centerX,
      headerRect.y + headerRect.height * 0.22,
      headerRect.width * 0.80,
    );
  }

  // Honor name line 2 (biggest text)
  if (data.honorName) {
    ctx.fillStyle = accent;
    ctx.font = `900 ${fonts.honorName}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      data.honorName.toUpperCase(),
      centerX,
      headerRect.y + headerRect.height * 0.52,
      headerRect.width * 0.80,
    );
  }

  // Subtitle line 3
  if (data.subtitle) {
    ctx.fillStyle = '#444444';
    ctx.font = `bold ${fonts.subtitle}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      data.subtitle.toUpperCase(),
      centerX,
      headerRect.y + headerRect.height * 0.80,
      headerRect.width * 0.75,
    );
  }

  // Grand Champion / Loser boxes
  if (data.design.showChampionLoser) {
    drawLabeledBox(ctx, championBox, 'GRAND CHAMPION', fonts.championLabel);
    drawLabeledBox(ctx, loserBox, 'THE LOSER OF IT ALL', fonts.championLabel);
  }
}

function drawLabeledBox(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; width: number; height: number },
  label: string,
  fontSize: number,
): void {
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = 2;
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

  ctx.fillStyle = '#333333';
  ctx.font = `bold ${fontSize}px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, rect.x + rect.width, rect.y - 4);
}

// ─── COLUMN HEADERS (THE GAME, rotated text, player names) ────────────────────

function renderColumnHeaders(
  ctx: CanvasRenderingContext2D,
  layout: LayoutPlan,
  data: RenderData,
): void {
  const {
    gameLabelRect, columnHeaderHeight, gridRect,
    taskLabelColWidth, possiblePtsColWidth, maxPtsColWidth,
    playerColWidth, playerColStartX, fonts,
  } = layout;
  const accent = data.design.accentColor;
  const gridX = gridRect.x;
  const ptsColX = gridX + taskLabelColWidth;
  const maxPtsColX = ptsColX + possiblePtsColWidth;

  // "THE GAME" - bold teal, stacked
  ctx.fillStyle = accent;
  ctx.font = `900 ${fonts.gameLabel}px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const gameLineHeight = fonts.gameLabel * 1.05;
  ctx.fillText('THE', gameLabelRect.x + 12, gameLabelRect.y + gameLineHeight * 1.1);
  ctx.fillText('GAME', gameLabelRect.x + 12, gameLabelRect.y + gameLineHeight * 2.15);

  // "ACTIVITIES" below THE GAME
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = `bold ${fonts.activitiesLabel}px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('ACTIVITIES', gameLabelRect.x + 12, gameLabelRect.y + columnHeaderHeight - 8);

  // "POSSIBLE POINTS (PER ACCOMPLISHMENT)" - rotated
  drawRotatedText(ctx, [
    'POSSIBLE POINTS',
    '(PER ACCOMPLISHMENT)',
  ], ptsColX + possiblePtsColWidth / 2, gridRect.y, columnHeaderHeight, fonts.columnHeader, accent);

  // "MAX POINTS (IF BLANK, CAN ONLY BE DONE ONCE)" - rotated
  drawRotatedText(ctx, [
    'MAX POINTS',
    '(IF BLANK, CAN ONLY',
    'BE DONE ONCE)',
  ], maxPtsColX + maxPtsColWidth / 2, gridRect.y, columnHeaderHeight, fonts.columnHeader, accent);

  // Player names - rotated 90° CCW
  data.players.forEach((player, i) => {
    const colCenterX = playerColStartX + i * playerColWidth + playerColWidth / 2;

    ctx.save();
    ctx.translate(colCenterX, gridRect.y + columnHeaderHeight - 8);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = accent;
    ctx.font = `bold ${fonts.playerName}px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.name.toUpperCase(), 0, 0, columnHeaderHeight - 20);
    ctx.restore();
  });
}

function drawRotatedText(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  cx: number,
  topY: number,
  headerHeight: number,
  fontSize: number,
  color: string,
): void {
  ctx.save();
  ctx.translate(cx, topY + headerHeight - 8);
  ctx.rotate(-Math.PI / 2);

  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const lineHeight = fontSize * 1.25;
  // Start from bottom of column header (which is left after rotation)
  lines.forEach((line, i) => {
    ctx.fillText(line, 4, i * lineHeight - (lines.length - 1) * lineHeight / 2);
  });

  ctx.restore();
}

// ─── TASK ROWS ─────────────────────────────────────────────────────────────────

function renderTaskRows(
  ctx: CanvasRenderingContext2D,
  layout: LayoutPlan,
  data: RenderData,
): void {
  const {
    gridRect, taskLabelColWidth, possiblePtsColWidth, maxPtsColWidth,
    rowHeight, taskRows, fonts,
  } = layout;
  const gridX = gridRect.x;
  const ptsColX = gridX + taskLabelColWidth;
  const maxPtsColX = ptsColX + possiblePtsColWidth;

  taskRows.forEach((row, i) => {
    const task = i < data.tasks.length ? data.tasks[i] : null;
    const y = row.y;

    // Empty rows get a distinct gray fill; others get subtle alternating
    if (row.isEmptyRow) {
      ctx.fillStyle = '#EBEBEB';
      ctx.fillRect(gridX, y, gridRect.width, rowHeight);
    } else if (i % 2 === 1) {
      ctx.fillStyle = '#F7F7F7';
      ctx.fillRect(gridX, y, gridRect.width, rowHeight);
    }

    // Points columns yellow background
    ctx.fillStyle = PTS_BG;
    ctx.fillRect(ptsColX, y, possiblePtsColWidth, rowHeight);
    ctx.fillRect(maxPtsColX, y, maxPtsColWidth, rowHeight);

    if (task) {
      // Task label - bold, all caps, left aligned
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = `bold ${fonts.taskLabel}px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        task.title.toUpperCase(),
        gridX + 14,
        y + rowHeight / 2,
        taskLabelColWidth - 24,
      );

      // Possible points
      const ptsDisplay = task.pointsDisplay || String(task.pointValue);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = `bold ${fonts.points}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ptsDisplay, ptsColX + possiblePtsColWidth / 2, y + rowHeight / 2);

      // Max points (only show when maxCompletions > 1 and < 999)
      if (task.maxCompletions > 1 && task.maxCompletions < 999) {
        const maxPts = task.pointValue * task.maxCompletions;
        ctx.fillText(String(maxPts), maxPtsColX + maxPtsColWidth / 2, y + rowHeight / 2);
      }
    }
  });
}

// ─── TOTAL POINTS ROW ──────────────────────────────────────────────────────────

function renderTotalRow(
  ctx: CanvasRenderingContext2D,
  layout: LayoutPlan,
  data: RenderData,
): void {
  const {
    gridRect, totalRowY, rowHeight, taskLabelColWidth,
    possiblePtsColWidth, maxPtsColWidth, playerColWidth,
    playerColStartX, fonts,
  } = layout;
  const accent = data.design.accentColor;
  const gridX = gridRect.x;
  const labelWidth = taskLabelColWidth + possiblePtsColWidth + maxPtsColWidth;

  // Teal background for label area
  ctx.fillStyle = accent;
  ctx.fillRect(gridX, totalRowY, labelWidth, rowHeight);

  // "TOTAL POINTS" text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${fonts.totalLabel}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TOTAL POINTS', gridX + labelWidth / 2, totalRowY + rowHeight / 2);

  // Player total cells - white with border
  data.players.forEach((_, i) => {
    const cellX = playerColStartX + i * playerColWidth;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cellX, totalRowY, playerColWidth, rowHeight);
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = LINE_WIDTH;
    ctx.strokeRect(cellX, totalRowY, playerColWidth, rowHeight);
  });
}

// ─── GRID LINES ────────────────────────────────────────────────────────────────

function renderGridLines(
  ctx: CanvasRenderingContext2D,
  layout: LayoutPlan,
  data: RenderData,
): void {
  const {
    gridRect, gridStartY, taskRows, rowHeight,
    taskLabelColWidth, possiblePtsColWidth,
    playerColWidth, playerColStartX, totalRowY,
  } = layout;
  const gridX = gridRect.x;
  const gridW = gridRect.width;
  const gridEndY = totalRowY + rowHeight;
  const ptsColX = gridX + taskLabelColWidth;
  const maxPtsColX = ptsColX + possiblePtsColWidth;

  // ─── Horizontal lines (between task rows) ───
  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = LINE_WIDTH;
  taskRows.forEach((row) => {
    line(ctx, gridX, row.y, gridX + gridW, row.y);
  });
  // Line before total row
  line(ctx, gridX, totalRowY, gridX + gridW, totalRowY);

  // ─── Vertical lines (through entire grid including column header) ───
  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = LINE_WIDTH;

  // After task label col
  line(ctx, ptsColX, gridRect.y, ptsColX, gridEndY);
  // After possible pts col
  line(ctx, maxPtsColX, gridRect.y, maxPtsColX, gridEndY);
  // After max pts col (start of player area)
  line(ctx, playerColStartX, gridRect.y, playerColStartX, gridEndY);
  // Between player columns
  for (let i = 1; i <= data.players.length; i++) {
    const x = playerColStartX + i * playerColWidth;
    line(ctx, x, gridRect.y, x, gridEndY);
  }

  // ─── Thick outer border around entire grid (column headers + rows + total) ───
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = BORDER_WIDTH;
  ctx.strokeRect(gridX, gridRect.y, gridW, gridEndY - gridRect.y);

  // Thick line between column headers and first task row
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = BORDER_WIDTH;
  line(ctx, gridX, gridStartY, gridX + gridW, gridStartY);
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// ─── RULES SECTION ─────────────────────────────────────────────────────────────

function renderRules(
  ctx: CanvasRenderingContext2D,
  layout: LayoutPlan,
  data: RenderData,
): void {
  const rect = layout.rulesRect!;
  const { fonts } = layout;
  const accent = data.design.accentColor;

  // Footer note (left side, smaller italic text)
  if (data.design.footerNote) {
    ctx.fillStyle = '#555555';
    ctx.font = `italic ${fonts.footerNote}px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const noteMaxWidth = rect.width * 0.28;
    const noteLines = wrapText(ctx, data.design.footerNote, noteMaxWidth);
    noteLines.forEach((noteLine, i) => {
      ctx.fillText(noteLine, rect.x + 10, rect.y + 20 + i * fonts.footerNote * 1.4);
    });
  }

  // "GAME RULES:" section (right ~65% of width)
  const rulesX = rect.x + rect.width * 0.33;
  const rulesW = rect.width * 0.65;
  let rulesY = rect.y + 12;

  ctx.fillStyle = accent;
  ctx.font = `900 ${fonts.rulesTitle}px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('GAME RULES:', rulesX, rulesY);
  rulesY += fonts.rulesTitle * 1.4;

  const entries = data.design.rulesEntries;
  if (entries.length === 0) return;

  // Two-column layout for rule entries
  const colWidth = rulesW / 2 - 15;
  const entriesPerCol = Math.ceil(entries.length / 2);

  entries.forEach((entry: RuleEntry, i: number) => {
    const col = i < entriesPerCol ? 0 : 1;
    const rowInCol = col === 0 ? i : i - entriesPerCol;
    const entryX = rulesX + col * (colWidth + 30);

    // Estimate entry height
    ctx.font = `${fonts.rulesBody}px ${FONT}`;
    const defLines = wrapText(ctx, entry.definition, colWidth);
    const entryHeight = fonts.rulesTerm * 1.3 + defLines.length * fonts.rulesBody * 1.3 + fonts.rulesBody;
    const entryY = rulesY + rowInCol * entryHeight;

    if (entryY + fonts.rulesTerm > rect.y + rect.height - 5) return;

    // Term (bold)
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = `bold ${fonts.rulesTerm}px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(entry.term + ':', entryX, entryY);

    // Definition
    ctx.fillStyle = '#444444';
    ctx.font = `${fonts.rulesBody}px ${FONT}`;
    defLines.forEach((defLine, li) => {
      const lineY = entryY + fonts.rulesTerm * 1.3 + li * fonts.rulesBody * 1.3;
      if (lineY + fonts.rulesBody < rect.y + rect.height - 5) {
        ctx.fillText(defLine, entryX, lineY);
      }
    });
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}
