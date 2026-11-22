import { render, screen } from '@testing-library/react-native';
import colors from 'tailwindcss/colors';

import { ReceiptTotals } from '@/components/receipts/ReceiptTotals';

const WARNING = /totals differ/;

describe('ReceiptTotals', () => {
  it('shows the item count and total', async () => {
    await render(<ReceiptTotals itemCount={2} total={928} detectedTotal={null} />);

    expect(screen.getByText('Total (2 items)')).toBeOnTheScreen();
    expect(screen.getByText('928')).toBeOnTheScreen();
  });

  it('hides the printed total when none was detected', async () => {
    await render(<ReceiptTotals itemCount={2} total={928} detectedTotal={null} />);

    expect(screen.queryByText('Total printed on receipt')).not.toBeOnTheScreen();
    expect(screen.queryByText(WARNING)).not.toBeOnTheScreen();
  });

  it('shows a matching printed total without a warning', async () => {
    await render(<ReceiptTotals itemCount={2} total={928} detectedTotal={928} />);

    expect(screen.getByText('Total printed on receipt')).toBeOnTheScreen();
    const [, printed] = screen.getAllByText('928');
    expect(printed).toHaveStyle({ color: colors.zinc[400] });
    expect(screen.queryByText(WARNING)).not.toBeOnTheScreen();
  });

  it('warns when the printed total differs', async () => {
    await render(<ReceiptTotals itemCount={2} total={900} detectedTotal={928} />);

    expect(screen.getByText('928')).toHaveStyle({ color: colors.red[500] });
    expect(screen.getByText(WARNING)).toHaveStyle({ color: colors.red[500] });
  });

  it('shows a printed total of 0', async () => {
    await render(<ReceiptTotals itemCount={1} total={50} detectedTotal={0} />);

    expect(screen.getByText('0')).toBeOnTheScreen();
    expect(screen.getByText(WARNING)).toBeOnTheScreen();
  });
});
