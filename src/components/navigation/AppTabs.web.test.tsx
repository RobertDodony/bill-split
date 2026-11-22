import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';
import colors from 'tailwindcss/colors';

import { AppTabs } from '@/components/navigation/AppTabs.web';

const routes = {
  '(tabs)/_layout': AppTabs,
  '(tabs)/index': () => <Text>Scan screen</Text>,
  '(tabs)/history': () => <Text>History screen</Text>,
};

// NativeWind writes Tailwind's `#fff` as `#ffffff`.
const WHITE = '#ffffff';

describe('AppTabs (web)', () => {
  it('shows the app name and both tabs', async () => {
    await renderRouter(routes);

    expect(screen.getByText('Számla elosztó')).toBeOnTheScreen();
    expect(screen.getByText('Scan')).toBeOnTheScreen();
    expect(screen.getByText('History')).toBeOnTheScreen();
  });

  it('opens on the Scan tab and highlights it', async () => {
    await renderRouter(routes);

    expect(screen).toHavePathname('/');
    expect(screen.getByText('Scan screen')).toBeOnTheScreen();
    expect(screen.getByText('Scan')).toHaveStyle({ color: WHITE });
    expect(screen.getByText('History')).toHaveStyle({
      color: colors.zinc[400],
    });
  });

  it('switches tabs when a tab is pressed', async () => {
    await renderRouter(routes);

    await fireEvent.press(screen.getByText('History'));

    expect(screen).toHavePathname('/history');
    expect(screen.getByText('History screen')).toBeOnTheScreen();
    expect(screen.getByText('History')).toHaveStyle({ color: WHITE });
  });
});
