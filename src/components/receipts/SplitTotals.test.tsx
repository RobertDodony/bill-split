import { render, screen } from '@testing-library/react-native';

import { SplitTotals } from '@/components/receipts/SplitTotals';

describe('SplitTotals', () => {
  it('shows the progress until every item is split', async () => {
    await render(<SplitTotals split={{ itemCount: 5, splitCount: 2, r: 100, k: 200 }} />);

    expect(screen.getByText('2 of 5 items split')).toBeOnTheScreen();
    expect(screen.queryByTestId('split-totals')).not.toBeOnTheScreen();
  });

  it('shows what R and K pay once every item is split', async () => {
    await render(<SplitTotals split={{ itemCount: 2, splitCount: 2, r: 599.5, k: 400 }} />);

    expect(screen.getByTestId('split-totals')).toHaveTextContent('R599,5K400');
    expect(screen.queryByText(/items split/)).not.toBeOnTheScreen();
  });

  it('shows nothing without items', async () => {
    await render(<SplitTotals split={{ itemCount: 0, splitCount: 0, r: 0, k: 0 }} />);

    expect(screen.toJSON()).toBeNull();
  });
});
