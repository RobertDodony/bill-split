import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

import HistoryScreen from '@/app/(tabs)/history';
import { useReceiptList } from '@/hooks/useReceiptList';
import { CREATED_AT, makeReceiptSummary } from '@/test-utils/fixtures';
import type { HistorySection } from '@/utils/history';

jest.mock('@/hooks/useReceiptList');

const renderScreen = () =>
  renderRouter({ index: HistoryScreen, 'receipt/[id]': () => <Text>Receipt screen</Text> });

const section = (overrides: Partial<HistorySection> = {}): HistorySection => ({
  key: 'open',
  title: 'Open',
  summary: 'All square',
  data: [makeReceiptSummary({ id: 1 })],
  ...overrides,
});

describe('HistoryScreen', () => {
  it('lists the saved receipts', async () => {
    jest.mocked(useReceiptList).mockReturnValue([
      section({
        data: [
          makeReceiptSummary({ id: 2, created_at: new Date(2026, 1, 1, 9, 30).getTime() }),
          makeReceiptSummary({ id: 1, created_at: CREATED_AT }),
        ],
      }),
    ]);

    await renderScreen();

    expect(screen.getByText('History')).toBeOnTheScreen();
    expect(screen.getByText('2026. 02. 01. 09:30')).toBeOnTheScreen();
    expect(screen.getByText('2026. 01. 05. 14:03')).toBeOnTheScreen();
  });

  it('groups the receipts under the open ones and each settlement', async () => {
    jest.mocked(useReceiptList).mockReturnValue([
      section({ summary: 'K owes R 300' }),
      section({
        key: '1',
        title: 'Settled 2026. 11. 26.',
        summary: 'R paid K 1200',
        data: [makeReceiptSummary({ id: 2 })],
      }),
    ]);

    await renderScreen();

    expect(screen.getByText('Open')).toBeOnTheScreen();
    expect(screen.getByText('K owes R 300')).toBeOnTheScreen();
    expect(screen.getByText('Settled 2026. 11. 26.')).toBeOnTheScreen();
    expect(screen.getByText('R paid K 1200')).toBeOnTheScreen();
  });

  it('opens a receipt when it is pressed', async () => {
    jest
      .mocked(useReceiptList)
      .mockReturnValue([section({ data: [makeReceiptSummary({ id: 3 })] })]);
    await renderScreen();

    await fireEvent.press(screen.getByRole('button'));

    expect(screen).toHavePathname('/receipt/3');
    expect(screen.getByText('Receipt screen')).toBeOnTheScreen();
  });

  it('explains what to do when there are no receipts', async () => {
    jest.mocked(useReceiptList).mockReturnValue([]);

    await renderScreen();

    expect(screen.getByText('No receipts yet. Scan one first.')).toBeOnTheScreen();
  });
});
