import { Stack } from 'expo-router';
import { act, fireEvent, renderRouter, screen, testRouter } from 'expo-router/testing-library';
import { Alert, Text, type AlertButton } from 'react-native';

import ReceiptScreen from '@/app/receipt/[id]';
import { COLORS } from '@/constants/theme';
import { useReceipt } from '@/hooks/useReceipt';
import { makeItem, makeReceipt } from '@/test-utils/fixtures';
import { isChecked, queryAllByProps, queryAllSliders } from '@/test-utils/queries';

jest.mock('@/hooks/useReceipt');

const bread = makeItem({ id: 1, name: 'KENYÉR', price: 599 });
const milk = makeItem({ id: 2, name: 'TEJ', price: 329, position: 1 });

function mockReceipt(overrides: Partial<ReturnType<typeof useReceipt>> = {}) {
  const value: ReturnType<typeof useReceipt> = {
    receipt: makeReceipt({ id: 7, detected_total: 928 }),
    items: [bread, milk],
    total: 928,
    split: { itemCount: 2, splitCount: 0, r: 0, k: 0 },
    activeItemId: 1,
    initialShare: () => 50,
    acceptSplit: jest.fn(),
    paidBy: null,
    setPaidBy: jest.fn(),
    complete: false,
    scanNext: jest.fn(),
    scanning: false,
    selectItem: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
    addItem: jest.fn(),
    deleteReceipt: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  jest.mocked(useReceipt).mockReturnValue(value);
  return value;
}

/** Opens the receipt from a home screen, so the screen has somewhere to go back to. */
async function openReceipt(id = 7) {
  await renderRouter({
    _layout: () => <Stack />,
    index: () => <Text>Home</Text>,
    'receipt/[id]': ReceiptScreen,
  });
  await testRouter.push(`/receipt/${id}`);
}

describe('ReceiptScreen', () => {
  it('loads the receipt from the route', async () => {
    mockReceipt();

    await openReceipt(7);

    expect(useReceipt).toHaveBeenCalledWith(7);
  });

  it('shows the receipt date as the title', async () => {
    mockReceipt();

    await openReceipt();

    expect(queryAllByProps(screen.container, { title: '2026. 01. 05. 14:03' })).toHaveLength(1);
  });

  it('shows a generic title while loading', async () => {
    mockReceipt({ receipt: null, items: [], total: 0 });

    await openReceipt();

    expect(queryAllByProps(screen.container, { title: 'Receipt' })).toHaveLength(1);
  });

  it('shows the receipt photo', async () => {
    mockReceipt();

    await openReceipt();

    expect(screen.getByTestId('receipt-image')).toBeOnTheScreen();
  });

  it('has no photo when none was saved', async () => {
    mockReceipt({ receipt: makeReceipt({ image_uri: null }) });

    await openReceipt();

    expect(screen.queryByTestId('receipt-image')).not.toBeOnTheScreen();
  });

  it('shows who paid', async () => {
    mockReceipt({ paidBy: 'R' });

    await openReceipt();

    expect(isChecked(screen.getByRole('button', { name: 'Paid by R' }))).toBe(true);
  });

  it('changes who paid', async () => {
    const receipt = mockReceipt({ paidBy: 'R' });
    await openReceipt();

    await fireEvent.press(screen.getByRole('button', { name: 'Paid by K' }));

    expect(receipt.setPaidBy).toHaveBeenCalledWith('K');
  });

  it('lists the items with the totals', async () => {
    mockReceipt();

    await openReceipt();

    expect(screen.getByDisplayValue('KENYÉR')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('TEJ')).toBeOnTheScreen();
    expect(screen.getByText('Total (2 items)')).toBeOnTheScreen();
    expect(screen.getByText('Total printed on receipt')).toBeOnTheScreen();
  });

  it('explains what to do when there are no items', async () => {
    mockReceipt({ items: [], total: 0 });

    await openReceipt();

    expect(screen.getByText('No items. Add one below.')).toBeOnTheScreen();
  });

  it('adds an item', async () => {
    const receipt = mockReceipt();
    await openReceipt();

    await fireEvent.press(screen.getByRole('button', { name: 'Add item' }));

    expect(receipt.addItem).toHaveBeenCalled();
  });

  it('saves an edited item', async () => {
    const receipt = mockReceipt();
    await openReceipt();

    const name = screen.getByDisplayValue('TEJ');
    await fireEvent.changeText(name, 'TEJ 1L');
    await fireEvent(name, 'endEditing');

    expect(receipt.updateItem).toHaveBeenCalledWith(2, { name: 'TEJ 1L', price: 329 });
  });

  it('deletes an item', async () => {
    const receipt = mockReceipt();
    await openReceipt();

    await fireEvent.press(screen.getAllByRole('button', { name: 'Delete item' })[0]!);

    expect(receipt.deleteItem).toHaveBeenCalledWith(1);
  });

  describe('splitting', () => {
    it('shows the slider on the active item only', async () => {
      mockReceipt();
      await openReceipt();

      expect(queryAllSliders(screen.container)).toHaveLength(1);
      expect(screen.getByText('Not split yet')).toBeOnTheScreen();
      expect(screen.getByText('0 of 2 items split')).toBeOnTheScreen();
    });

    it('starts the slider at the item’s initial share', async () => {
      mockReceipt({ initialShare: () => 100 / 3 });
      await openReceipt();

      expect(screen.getByText('R 1/3 · 199,67')).toBeOnTheScreen();
    });

    it('accepts the active item’s split', async () => {
      const receipt = mockReceipt();
      await openReceipt();

      await fireEvent.press(screen.getByRole('button', { name: 'Accept' }));

      expect(receipt.acceptSplit).toHaveBeenCalledWith(1, 50);
    });

    it('opens another item’s split', async () => {
      const receipt = mockReceipt();
      await openReceipt();

      await fireEvent.press(screen.getByRole('button', { name: 'Split item' }));

      expect(receipt.selectItem).toHaveBeenCalledWith(2);
    });

    it('shows the sums for R and K once every item is split', async () => {
      mockReceipt({
        items: [
          { ...bread, r_share: 100 },
          { ...milk, r_share: 0 },
        ],
        activeItemId: null,
        split: { itemCount: 2, splitCount: 2, r: 599, k: 329 },
      });
      await openReceipt();

      expect(queryAllSliders(screen.container)).toHaveLength(0);
      expect(screen.getByTestId('split-totals')).toHaveTextContent('R599K329');
    });
  });

  describe('scanning the next receipt', () => {
    it('is offered once the receipt is complete', async () => {
      const receipt = mockReceipt({ complete: true });
      await openReceipt();

      await fireEvent.press(screen.getByRole('button', { name: 'Scan next receipt' }));

      expect(receipt.scanNext).toHaveBeenCalled();
    });

    it('is not offered before the receipt is complete', async () => {
      mockReceipt({ complete: false });
      await openReceipt();

      expect(screen.queryByRole('button', { name: 'Scan next receipt' })).not.toBeOnTheScreen();
    });

    it('is disabled while the next receipt is being read', async () => {
      mockReceipt({ complete: true, scanning: true });
      await openReceipt();

      expect(screen.getByRole('button', { name: 'Scan next receipt' })).toBeDisabled();
      expect(screen.getByText('Reading receipt…')).toBeOnTheScreen();
    });
  });

  describe('deleting the receipt', () => {
    let alert: jest.SpyInstance;

    beforeEach(() => {
      alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });

    afterEach(() => alert.mockRestore());

    const alertButton = (text: string): AlertButton =>
      (alert.mock.lastCall[2] as AlertButton[]).find((b) => b.text === text)!;

    it('has a red Delete button in the header', async () => {
      mockReceipt();
      await openReceipt();

      expect(screen.getByText('Delete')).toHaveStyle({ color: COLORS.error });
    });

    it('asks for confirmation first', async () => {
      const receipt = mockReceipt();
      await openReceipt();

      await fireEvent.press(screen.getByRole('button', { name: 'Delete' }));

      expect(alert).toHaveBeenCalledWith('Delete receipt?', expect.any(String), expect.any(Array));
      expect(alertButton('Cancel').style).toBe('cancel');
      expect(receipt.deleteReceipt).not.toHaveBeenCalled();
    });

    it('deletes the receipt and goes back when confirmed', async () => {
      const receipt = mockReceipt();
      await openReceipt();
      await fireEvent.press(screen.getByRole('button', { name: 'Delete' }));

      await act(async () => {
        await alertButton('Delete').onPress?.();
      });

      expect(receipt.deleteReceipt).toHaveBeenCalled();
      expect(screen).toHavePathname('/');
    });
  });
});
