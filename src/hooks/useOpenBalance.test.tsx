import { fireEvent, renderRouter, screen, testRouter } from 'expo-router/testing-library';
import { Pressable, Text } from 'react-native';

import { getOpenReceiptsWithItems, settleOpenReceipts } from '@/db/settlements';
import { useOpenBalance } from '@/hooks/useOpenBalance';
import { useReceiptScanner } from '@/hooks/useReceiptScanner';
import { makeItem, makeReceipt } from '@/test-utils/fixtures';
import type { ReceiptWithItems } from '@/types/receipt';

const mockDb = { name: 'test-db' };

jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => mockDb }));
jest.mock('@/db/settlements');
jest.mock('@/hooks/useReceiptScanner');

const mockOpen = jest.mocked(getOpenReceiptsWithItems);
const mockSettle = jest.mocked(settleOpenReceipts);
const takePhoto = jest.fn();

/** An open receipt R paid for, with one item split half and half. */
const paidReceipt = (id: number, createdAt: number): ReceiptWithItems => ({
  ...makeReceipt({ id, created_at: createdAt, paid_by: 'R' }),
  items: [makeItem({ id, receipt_id: id, price: 1000, r_share: 50 })],
});

/** Renders the hook on a route, so focus effects run: what it returns, and buttons to call it. */
function Balance() {
  const { balance, openSince, settle, takePhoto: photo } = useOpenBalance();
  return (
    <>
      <Text>{`${balance.receiptCount} open, net ${balance.net}, since ${openSince ?? 'never'}`}</Text>
      <Pressable accessibilityRole="button" onPress={() => void settle()}>
        <Text>Settle</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => void photo()}>
        <Text>Photo</Text>
      </Pressable>
    </>
  );
}

describe('useOpenBalance', () => {
  beforeEach(() => {
    jest
      .mocked(useReceiptScanner)
      .mockReturnValue({ busy: false, takePhoto, pickPhoto: jest.fn() });
  });

  it('adds up the open receipts when the screen is focused', async () => {
    mockOpen.mockResolvedValue([paidReceipt(1, 1_000), paidReceipt(2, 2_000)]);

    await renderRouter({ index: Balance });

    expect(await screen.findByText('2 open, net 1000, since 1000')).toBeOnTheScreen();
    expect(mockOpen).toHaveBeenCalledWith(mockDb);
  });

  it('is empty until the receipts are loaded', async () => {
    mockOpen.mockReturnValue(new Promise(() => {}));

    await renderRouter({ index: Balance });

    expect(screen.getByText('0 open, net 0, since never')).toBeOnTheScreen();
  });

  it('reloads when the screen is focused again', async () => {
    mockOpen.mockResolvedValue([paidReceipt(1, 1_000)]);
    await renderRouter({ index: Balance, other: () => <Text>Other</Text> });
    await screen.findByText('1 open, net 500, since 1000');

    mockOpen.mockResolvedValue([paidReceipt(1, 1_000), paidReceipt(2, 2_000)]);
    await testRouter.push('/other');
    await testRouter.back();

    expect(await screen.findByText('2 open, net 1000, since 1000')).toBeOnTheScreen();
  });

  it('settles up and reloads', async () => {
    mockOpen.mockResolvedValue([paidReceipt(1, 1_000)]);
    await renderRouter({ index: Balance });
    await screen.findByText('1 open, net 500, since 1000');

    mockOpen.mockResolvedValue([]);
    await fireEvent.press(screen.getByRole('button', { name: 'Settle' }));

    expect(await screen.findByText('0 open, net 0, since never')).toBeOnTheScreen();
    expect(mockSettle).toHaveBeenCalledWith(mockDb);
  });

  it('does not settle while a receipt is unfinished', async () => {
    const unpaid = { ...paidReceipt(2, 2_000), paid_by: null };
    mockOpen.mockResolvedValue([paidReceipt(1, 1_000), unpaid]);
    await renderRouter({ index: Balance });
    await screen.findByText('2 open, net 500, since 1000');

    await fireEvent.press(screen.getByRole('button', { name: 'Settle' }));

    expect(mockSettle).not.toHaveBeenCalled();
  });

  it('passes the scanner through', async () => {
    mockOpen.mockResolvedValue([]);
    await renderRouter({ index: Balance });

    await fireEvent.press(screen.getByRole('button', { name: 'Photo' }));

    expect(takePhoto).toHaveBeenCalled();
  });
});
