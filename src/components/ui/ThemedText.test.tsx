import { render, screen } from '@testing-library/react-native';
import colors from 'tailwindcss/colors';

import { ThemedText } from '@/components/ui/ThemedText';

// NativeWind writes Tailwind's `#fff` as `#ffffff`.
const WHITE = '#ffffff';

describe('ThemedText', () => {
  it('renders its text in the default style', async () => {
    await render(<ThemedText>Hello</ThemedText>);

    expect(screen.getByText('Hello')).toHaveStyle({
      color: WHITE,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '500',
    });
  });

  it.each([
    ['small', { fontSize: 14, lineHeight: 20, fontWeight: '500' }],
    ['smallBold', { fontSize: 14, lineHeight: 20, fontWeight: '700' }],
    ['subtitle', { fontSize: 32, lineHeight: 44, fontWeight: '600' }],
  ] as const)('supports the %s type', async (type, style) => {
    await render(<ThemedText type={type}>Hello</ThemedText>);

    expect(screen.getByText('Hello')).toHaveStyle(style);
  });

  it.each([
    ['mutedForeground', colors.zinc[400]],
    ['primaryForeground', WHITE],
    ['danger', colors.red[500]],
  ] as const)('uses the %s color', async (themeColor, expected) => {
    await render(<ThemedText themeColor={themeColor}>Hello</ThemedText>);

    expect(screen.getByText('Hello')).toHaveStyle({ color: expected });
  });

  it('adds classes from className', async () => {
    await render(<ThemedText className="px-6 text-center">Hello</ThemedText>);

    expect(screen.getByText('Hello')).toHaveStyle({
      paddingLeft: 24,
      paddingRight: 24,
      textAlign: 'center',
      fontSize: 16,
    });
  });

  it('passes other Text props through', async () => {
    await render(<ThemedText numberOfLines={1}>Hello</ThemedText>);

    expect(screen.getByText('Hello')).toHaveProp('numberOfLines', 1);
  });
});
