import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { SafeAreaView } from '@/components/ui/SafeAreaView';

describe('SafeAreaView', () => {
  it('renders its children', async () => {
    await render(
      <SafeAreaView>
        <Text>Content</Text>
      </SafeAreaView>
    );

    expect(screen.getByText('Content')).toBeOnTheScreen();
  });

  it('is styled with className', async () => {
    await render(<SafeAreaView testID="area" className="flex-1 gap-6 px-6" />);

    // NativeWind follows CSS: `flex-1` is `flex: 1 1 0%` and `gap-6` sets both gaps.
    expect(screen.getByTestId('area')).toHaveStyle({
      flexGrow: 1,
      flexShrink: 1,
      rowGap: 24,
      columnGap: 24,
      paddingLeft: 24,
      paddingRight: 24,
    });
  });
});
