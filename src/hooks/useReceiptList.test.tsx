import { renderRouter, screen, testRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { listReceipts } from '@/db/receipts';
import { useReceiptList } from '@/hooks/useReceiptList';
import { makeReceiptSummary } from '@/test-utils/fixtures';

const mockDb = { name: 'test-db' };

jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => mockDb }));
jest.mock('@/db/receipts');

const mockList = jest.mocked(listReceipts);

function ReceiptIds() {
  const receipts = useReceiptList();
  return <Text>{receipts.length ? receipts.map((r) => r.id).join(',') : 'none'}</Text>;
}

describe('useReceiptList', () => {
  it('loads the receipts when the screen is focused', async () => {
    mockList.mockResolvedValue([makeReceiptSummary({ id: 2 }), makeReceiptSummary({ id: 1 })]);

    await renderRouter({ index: ReceiptIds });

    expect(await screen.findByText('2,1')).toBeOnTheScreen();
    expect(mockList).toHaveBeenCalledWith(mockDb);
  });

  it('is empty until the receipts are loaded', async () => {
    mockList.mockReturnValue(new Promise(() => {}));

    await renderRouter({ index: ReceiptIds });

    expect(screen.getByText('none')).toBeOnTheScreen();
  });

  it('reloads when the screen is focused again', async () => {
    mockList.mockResolvedValue([makeReceiptSummary({ id: 1 })]);
    await renderRouter({ index: ReceiptIds, other: () => <Text>Other</Text> });
    await screen.findByText('1');

    mockList.mockResolvedValue([makeReceiptSummary({ id: 2 }), makeReceiptSummary({ id: 1 })]);
    await testRouter.push('/other');
    await testRouter.back();

    expect(await screen.findByText('2,1')).toBeOnTheScreen();
    expect(mockList).toHaveBeenCalledTimes(2);
  });
});
