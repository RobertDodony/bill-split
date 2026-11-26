import { StyleSheet } from 'react-native';

import { COLORS } from '@/constants/theme';

/** Bottom padding that keeps content clear of the native tab bar: its height (80dp) plus 24. */
export const TAB_BAR_PADDING = 104;

/** How wide screen content gets on large displays. */
export const CONTENT_MAX_WIDTH = 800;

/** Every screen's frame: a black background with the content centered and width-capped. */
export const SCREEN_STYLES = StyleSheet.create({
  screen: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    maxWidth: CONTENT_MAX_WIDTH,
  },
});
