import { fireEvent, render, screen } from '@testing-library/react-native';

import { BalanceCard } from '@/components/receipts/BalanceCard';
import { CREATED_AT } from '@/test-utils/fixtures';
import type { BalanceSummary } from '@/utils/balance';

const balance = (overrides: Partial<BalanceSummary> = {}): BalanceSummary => ({
  receiptCount: 3,
  completeCount: 3,
  r: 2400,
  k: 1800,
  net: 450,
  ...overrides,
});

describe('BalanceCard', () => {
  it('shows since when receipts are open and how many', async () => {
    await render(<BalanceCard balance={balance()} openSince={CREATED_AT} onSettle={jest.fn()} />);

    expect(screen.getByText('Open since 2026. 01. 05.')).toBeOnTheScreen();
    expect(screen.getByText('3 receipts')).toBeOnTheScreen();
  });

  it('shows what R and K pay and who owes whom', async () => {
    await render(<BalanceCard balance={balance()} openSince={CREATED_AT} onSettle={jest.fn()} />);

    expect(screen.getByTestId('balance-card')).toHaveTextContent(/R2\s400K1\s800/);
    expect(screen.getByText('K owes R 450')).toBeOnTheScreen();
  });

  it('settles up when every receipt is complete', async () => {
    const onSettle = jest.fn();
    await render(<BalanceCard balance={balance()} openSince={CREATED_AT} onSettle={onSettle} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Settle up' }));

    expect(onSettle).toHaveBeenCalled();
  });

  it('says how many receipts are unfinished and holds off settling', async () => {
    await render(
      <BalanceCard
        balance={balance({ completeCount: 2 })}
        openSince={CREATED_AT}
        onSettle={jest.fn()}
      />
    );

    expect(screen.getByText('1 receipt not finished')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Settle up' })).toBeDisabled();
  });

  it('says when nothing is open', async () => {
    await render(
      <BalanceCard
        balance={balance({ receiptCount: 0, completeCount: 0, r: 0, k: 0, net: 0 })}
        openSince={null}
        onSettle={jest.fn()}
      />
    );

    expect(screen.getByText('Nothing open')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Settle up' })).not.toBeOnTheScreen();
  });
});
