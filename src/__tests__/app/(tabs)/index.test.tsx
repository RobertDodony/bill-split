import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Alert, type AlertButton } from 'react-native';

import ScanScreen from '@/app/(tabs)/index';
import { useOpenBalance } from '@/hooks/useOpenBalance';
import { CREATED_AT } from '@/test-utils/fixtures';

jest.mock('@/hooks/useOpenBalance');

const EMPTY = { receiptCount: 0, completeCount: 0, r: 0, k: 0, net: 0 };

function mockScanScreen(overrides: Partial<ReturnType<typeof useOpenBalance>> = {}) {
  const value: ReturnType<typeof useOpenBalance> = {
    busy: false,
    takePhoto: jest.fn(),
    pickPhoto: jest.fn(),
    balance: EMPTY,
    openSince: null,
    settle: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  jest.mocked(useOpenBalance).mockReturnValue(value);
  return value;
}

const renderScreen = () => renderRouter({ index: ScanScreen });

describe('ScanScreen', () => {
  it('explains how to scan', async () => {
    mockScanScreen();
    await renderScreen();

    expect(screen.getByText('Scan a receipt')).toBeOnTheScreen();
    expect(screen.getByText(/lay it flat in good light/)).toBeOnTheScreen();
  });

  it('keeps the content clear of the tab bar', async () => {
    mockScanScreen();
    await renderScreen();

    expect(screen.getByTestId('scan-content')).toHaveStyle({ paddingBottom: 104 });
  });

  it('takes a photo', async () => {
    const scan = mockScanScreen();
    await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Take photo' }));

    expect(scan.takePhoto).toHaveBeenCalled();
  });

  it('picks a photo from the gallery', async () => {
    const scan = mockScanScreen();
    await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Choose from gallery' }));

    expect(scan.pickPhoto).toHaveBeenCalled();
  });

  it('shows progress instead of the buttons while reading a receipt', async () => {
    mockScanScreen({ busy: true });

    await renderScreen();

    expect(screen.getByText('Reading receipt…')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  describe('open balance', () => {
    const open = { receiptCount: 2, completeCount: 2, r: 1500, k: 900, net: 400 };
    let alert: jest.SpyInstance;

    beforeEach(() => {
      alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });

    afterEach(() => alert.mockRestore());

    const alertButton = (text: string): AlertButton =>
      (alert.mock.lastCall[2] as AlertButton[]).find((b) => b.text === text)!;

    it('says when nothing is open', async () => {
      mockScanScreen();
      await renderScreen();

      expect(screen.getByText('Nothing open')).toBeOnTheScreen();
    });

    it('shows the open receipts and who owes whom', async () => {
      mockScanScreen({ balance: open, openSince: CREATED_AT });
      await renderScreen();

      expect(screen.getByText('Open since 2026. 01. 05.')).toBeOnTheScreen();
      expect(screen.getByText('K owes R 400')).toBeOnTheScreen();
    });

    it('asks before settling up', async () => {
      const scan = mockScanScreen({ balance: open, openSince: CREATED_AT });
      await renderScreen();

      await fireEvent.press(screen.getByRole('button', { name: 'Settle up' }));

      expect(alert).toHaveBeenCalledWith(
        'Settle up?',
        'K owes R 400. This closes every open receipt.',
        expect.any(Array)
      );
      expect(alertButton('Cancel').style).toBe('cancel');
      expect(scan.settle).not.toHaveBeenCalled();
    });

    it('settles up when confirmed', async () => {
      const scan = mockScanScreen({ balance: open, openSince: CREATED_AT });
      await renderScreen();
      await fireEvent.press(screen.getByRole('button', { name: 'Settle up' }));

      await act(async () => {
        alertButton('Settle up').onPress?.();
      });

      expect(scan.settle).toHaveBeenCalled();
    });
  });
});
