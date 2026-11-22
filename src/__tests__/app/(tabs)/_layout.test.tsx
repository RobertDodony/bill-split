import { renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

import TabLayout from '@/app/(tabs)/_layout';
import { queryAllByProps } from '@/test-utils/queries';

describe('TabLayout', () => {
  it('shows the app tabs', async () => {
    await renderRouter({
      '(tabs)/_layout': TabLayout,
      '(tabs)/index': () => <Text>Scan screen</Text>,
      '(tabs)/history': () => <Text>History screen</Text>,
    });

    expect(queryAllByProps(screen.container, { title: 'Scan' })).toHaveLength(1);
    expect(queryAllByProps(screen.container, { title: 'History' })).toHaveLength(1);
  });
});
