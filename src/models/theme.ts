export interface ThemeColors {
  background: string;
  headerBackground: string;
  headerText: string;
  gridBackground: string;
  gridLineColor: string;
  gridLineWidth: number;
  cellBackground: string;
  cellAlternateBackground: string;
  cellText: string;
  taskLabelBackground: string;
  taskLabelText: string;
  pointsBackground: string;
  pointsText: string;
  playerHeaderBackground: string;
  playerHeaderText: string;
  scoreboardBackground: string;
  scoreboardText: string;
  bracketBackground: string;
  bracketLineColor: string;
  bracketText: string;
  rulesBackground: string;
  rulesText: string;
  accentColor: string;
  categoryColors: Record<string, string>;
}

export interface ThemeFonts {
  title: string;
  subtitle: string;
  bachelorName: string;
  playerName: string;
  taskLabel: string;
  cellText: string;
  body: string;
}

export interface ThemeDecorations {
  headerStyle: 'banner' | 'underline' | 'box' | 'none';
  checkboxStyle: 'square' | 'circle' | 'diamond' | 'star';
  cornerDecoration: boolean;
  borderStyle: 'solid' | 'double' | 'dashed' | 'none';
  borderWidth: number;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  decorations: ThemeDecorations;
  spacingMultiplier: number;
}
