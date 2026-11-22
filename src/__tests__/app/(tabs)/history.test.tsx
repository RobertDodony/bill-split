import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

import HistoryScreen from '@/app/(tabs)/history';
import { useReceiptList } from '@/hooks/useReceiptList';
import { CREATED_AT, makeReceiptSummary } from '@/test-utils/fixtures';

jest.mock('@/hooks/useReceiptList');

const renderScreen = () =>
  renderRouter({ index: HistoryScreen, 'receipt/[id]': () => <Text>Receipt screen</Text> });

describe('HistoryScreen', () => {
  it('lists the saved receipts', async () => {
    jest
      .mocked(useReceiptList)
      .mockReturnValue([
        makeReceiptSummary({ id: 2, created_at: new Date(2026, 1, 1, 9, 30).getTime() }),
        makeReceiptSummary({ id: 1, created_at: CREATED_AT }),
      ]);

    await renderScreen();

    expect(screen.getByText('History')).toBeOnTheScreen();
    expect(screen.getByText('2026. 02. 01. 09:30')).toBeOnTheScreen();
    expect(screen.getByText('2026. 01. 05. 14:03')).toBeOnTheScreen();
  });

  it('opens a receipt when it is pressed', async () => {
    jest.mocked(useReceiptList).mockReturnValue([makeReceiptSummary({ id: 3 })]);
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
