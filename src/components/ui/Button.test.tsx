import { fireEvent, render, screen } from '@testing-library/react-native';
import colors from 'tailwindcss/colors';

import { Button } from '@/components/ui/Button';
import { opacityOf } from '@/test-utils/styles';

// NativeWind writes Tailwind's `#fff` as `#ffffff`.
const WHITE = '#ffffff';

describe('Button', () => {
  it('shows its title and handles presses', async () => {
    const onPress = jest.fn();
    await render(<Button title="Take photo" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Take photo' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is filled with the primary color by default', async () => {
    await render(<Button title="Go" />);

    expect(screen.getByRole('button')).toHaveStyle({
      backgroundColor: colors.blue[500],
      borderRadius: 16,
      paddingTop: 16,
      paddingBottom: 16,
      paddingLeft: 24,
      paddingRight: 24,
    });
    expect(screen.getByText('Go')).toHaveStyle({ color: WHITE });
  });

  it('has a subtle secondary variant', async () => {
    await render(<Button title="Go" variant="secondary" />);

    expect(screen.getByRole('button')).toHaveStyle({
      backgroundColor: colors.zinc[900],
    });
    expect(screen.getByText('Go')).toHaveStyle({ color: WHITE });
  });

  it('dims while pressed', async () => {
    await render(<Button title="Go" />);
    expect(opacityOf(screen.getByRole('button'))).toBeUndefined();

    await fireEvent(screen.getByRole('button'), 'pressIn');

    expect(opacityOf(screen.getByRole('button'))).toBeCloseTo(0.6);
  });

  it('is dimmed and ignores presses when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button title="Go" disabled onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button'));

    expect(screen.getByRole('button')).toBeDisabled();
    expect(opacityOf(screen.getByRole('button'))).toBeCloseTo(0.6);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('adds classes from className', async () => {
    await render(<Button title="Go" className="mt-2" />);

    expect(screen.getByRole('button')).toHaveStyle({
      marginTop: 8,
      backgroundColor: colors.blue[500],
    });
  });
});
