import { MD3DarkTheme, type MD3Theme } from 'react-native-paper';

/** The app's palette (Tailwind 3 values). The only place hex colors are written. */
const PALETTE = {
  white: '#ffffff',
  black: '#000000',
  zinc400: '#a1a1aa',
  zinc800: '#27272a',
  zinc900: '#18181b',
  blue500: '#3b82f6',
  sky400: '#38bdf8',
  sky500: '#0ea5e9',
  amber400: '#fbbf24',
  amber500: '#f59e0b',
  red500: '#ef4444',
} as const;

/** Colors for the two people a receipt is split between, on top of Material's color roles. */
const PERSON_COLORS = {
  /** R's text color. */
  personR: PALETTE.sky400,
  /** K's text color. */
  personK: PALETTE.amber400,
  /** R's color on larger shapes: the slider track and the outline of the item being split. */
  personRStrong: PALETTE.sky500,
  /** K's color on larger shapes: the slider track. */
  personKStrong: PALETTE.amber500,
};

/** Paper's dark Material 3 theme in the app's colors, plus a color per person (R and K). */
export const PAPER_THEME = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...PERSON_COLORS,
    primary: PALETTE.blue500,
    onPrimary: PALETTE.white,
    secondaryContainer: PALETTE.zinc900,
    onSecondaryContainer: PALETTE.white,
    background: PALETTE.black,
    onBackground: PALETTE.white,
    surface: PALETTE.zinc900,
    onSurface: PALETTE.white,
    surfaceVariant: PALETTE.zinc800,
    onSurfaceVariant: PALETTE.zinc400,
    error: PALETTE.red500,
  },
} satisfies MD3Theme;

/**
 * The theme's colors. The app is dark-only, so styles can read them directly instead of through
 * Paper's `useTheme`.
 */
export const COLORS = PAPER_THEME.colors;
