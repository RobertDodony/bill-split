import { render, screen } from '@testing-library/react-native';

import { PersonTotals } from '@/components/receipts/PersonTotals';
import { COLORS } from '@/constants/theme';

describe('PersonTotals', () => {
  it('shows what R and K pay', async () => {
    await render(<PersonTotals testID="totals" r={599.5} k={400} />);

    expect(screen.getByTestId('totals')).toHaveTextContent('R599,5K400');
  });

  it('colors each letter for its person', async () => {
    await render(<PersonTotals r={1} k={2} />);

    expect(screen.getByText('R')).toHaveStyle({ color: COLORS.personR });
    expect(screen.getByText('K')).toHaveStyle({ color: COLORS.personK });
  });
});
