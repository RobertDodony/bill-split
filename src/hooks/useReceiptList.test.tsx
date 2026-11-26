import { renderRouter, screen, testRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { listAllItems, listReceipts } from '@/db/receipts';
import { listSettlements } from '@/db/settlements';
import { useReceiptList } from '@/hooks/useReceiptList';
import { makeItem, makeReceiptSummary } from '@/test-utils/fixtures';

const mockDb = { name: 'test-db' };

jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => mockDb }));
jest.mock('@/db/receipts');
jest.mock('@/db/settlements');

const mockList = jest.mocked(listReceipts);

/** Shows each section as `title: receipt ids (summary)`. */
function Sections() {
  const sections = useReceiptList();
  return (
    <Text>
      {sections.length
        ? sections
            .map((s) => `${s.title}: ${s.data.map((r) => r.id).join(',')} (${s.summary})`)
            .join(' | ')
        : 'none'}
    </Text>
  );
}

describe('useReceiptList', () => {
  beforeEach(() => {
    jest.mocked(listAllItems).mockResolvedValue([]);
    jest.mocked(listSettlements).mockResolvedValue([]);
  });

  it('loads and groups the receipts when the screen is focused', async () => {
    mockList.mockResolvedValue([
      makeReceiptSummary({ id: 2, paid_by: 'R', settlement_id: null }),
      makeReceiptSummary({ id: 1, paid_by: 'R', settlement_id: 1 }),
    ]);
    jest
      .mocked(listAllItems)
      .mockResolvedValue([
        makeItem({ id: 1, receipt_id: 1, price: 800, r_share: 50 }),
        makeItem({ id: 2, receipt_id: 2, price: 100, r_share: 0 }),
      ]);
    jest
      .mocked(listSettlements)
      .mockResolvedValue([{ id: 1, settled_at: new Date(2026, 10, 26).getTime() }]);

    await renderRouter({ index: Sections });

    expect(
      await screen.findByText('Open: 2 (K owes R 100) | Settled 2026. 11. 26.: 1 (K paid R 400)')
    ).toBeOnTheScreen();
    expect(mockList).toHaveBeenCalledWith(mockDb);
  });

  it('is empty until the receipts are loaded', async () => {
    mockList.mockReturnValue(new Promise(() => {}));

    await renderRouter({ index: Sections });

    expect(screen.getByText('none')).toBeOnTheScreen();
  });

  it('reloads when the screen is focused again', async () => {
    mockList.mockResolvedValue([makeReceiptSummary({ id: 1 })]);
    await renderRouter({ index: Sections, other: () => <Text>Other</Text> });
    await screen.findByText('Open: 1 (All square)');

    mockList.mockResolvedValue([makeReceiptSummary({ id: 2 }), makeReceiptSummary({ id: 1 })]);
    await testRouter.push('/other');
    await testRouter.back();

    expect(await screen.findByText('Open: 2,1 (All square)')).toBeOnTheScreen();
    expect(mockList).toHaveBeenCalledTimes(2);
  });
});
