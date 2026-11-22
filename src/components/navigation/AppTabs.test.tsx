import { renderRouter, screen, testRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { AppTabs } from '@/components/navigation/AppTabs';
import { queryAllByProps } from '@/test-utils/queries';

const routes = {
  '(tabs)/_layout': AppTabs,
  '(tabs)/index': () => <Text>Scan screen</Text>,
  '(tabs)/history': () => <Text>History screen</Text>,
};

describe('AppTabs (native)', () => {
  it('has a Scan and a History tab', async () => {
    await renderRouter(routes);

    expect(queryAllByProps(screen.container, { title: 'Scan' })).toHaveLength(1);
    expect(queryAllByProps(screen.container, { title: 'History' })).toHaveLength(1);
    expect(screen.getByText('Scan screen')).toBeOnTheScreen();
  });

  it('opens on the Scan tab', async () => {
    await renderRouter(routes);

    expect(screen).toHavePathname('/');
  });

  it('switches to the History tab', async () => {
    await renderRouter(routes);

    await testRouter.navigate('/history');

    expect(screen).toHavePathname('/history');
    expect(screen.getByText('History screen')).toBeOnTheScreen();
  });
});
