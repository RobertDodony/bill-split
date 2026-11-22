import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import ScanScreen from '@/app/(tabs)/index';
import { useReceiptScanner } from '@/hooks/useReceiptScanner';

jest.mock('@/hooks/useReceiptScanner');

const scanner = {
  busy: false,
  takePhoto: jest.fn(),
  pickPhoto: jest.fn(),
};

const renderScreen = () => renderRouter({ index: ScanScreen });

describe('ScanScreen', () => {
  beforeEach(() => {
    jest.mocked(useReceiptScanner).mockReturnValue(scanner);
  });

  it('explains how to scan', async () => {
    await renderScreen();

    expect(screen.getByText('Scan a receipt')).toBeOnTheScreen();
    expect(screen.getByText(/lay it flat in good light/)).toBeOnTheScreen();
  });

  it('keeps the content clear of the tab bar', async () => {
    await renderScreen();

    expect(screen.getByTestId('scan-content')).toHaveStyle({ paddingBottom: 104 });
  });

  it('takes a photo', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Take photo' }));

    expect(scanner.takePhoto).toHaveBeenCalled();
  });

  it('picks a photo from the gallery', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Choose from gallery' }));

    expect(scanner.pickPhoto).toHaveBeenCalled();
  });

  it('shows progress instead of the buttons while reading a receipt', async () => {
    jest.mocked(useReceiptScanner).mockReturnValue({ ...scanner, busy: true });

    await renderScreen();

    expect(screen.getByText('Reading receipt…')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });
});
