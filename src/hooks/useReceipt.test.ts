import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as receiptsDb from '@/db/receipts';
import { useReceipt } from '@/hooks/useReceipt';
import { deleteReceiptImage } from '@/services/receiptImages';
import { makeItem, makeReceipt } from '@/test-utils/fixtures';

const mockDb = { name: 'test-db' };

jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => mockDb }));
jest.mock('@/db/receipts');
jest.mock('@/services/receiptImages');

const db = jest.mocked(receiptsDb);

const receipt = makeReceipt({ id: 7, detected_total: 928 });
const bread = makeItem({ id: 1, receipt_id: 7, name: 'KENYÉR', price: 599 });
const milk = makeItem({ id: 2, receipt_id: 7, name: 'TEJ', price: 329, position: 1 });

async function renderLoaded(receiptId = 7) {
  const hook = await renderHook((id: number) => useReceipt(id), { initialProps: receiptId });
  await waitFor(() => expect(hook.result.current.receipt).not.toBeNull());
  return hook;
}

describe('useReceipt', () => {
  beforeEach(() => {
    db.getReceipt.mockResolvedValue(receipt);
    db.getItems.mockResolvedValue([bread, milk]);
  });

  it('loads the receipt and its items', async () => {
    const { result } = await renderLoaded();

    expect(db.getReceipt).toHaveBeenCalledWith(mockDb, 7);
    expect(db.getItems).toHaveBeenCalledWith(mockDb, 7);
    expect(result.current.receipt).toEqual(receipt);
    expect(result.current.items).toEqual([bread, milk]);
    expect(result.current.total).toBe(928);
  });

  it('starts empty while loading', async () => {
    db.getReceipt.mockReturnValue(new Promise(() => {}));
    db.getItems.mockReturnValue(new Promise(() => {}));

    const { result } = await renderHook(() => useReceipt(7));

    expect(result.current.receipt).toBeNull();
    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('reloads when the receipt id changes', async () => {
    const { rerender } = await renderLoaded(7);

    await rerender(8);

    await waitFor(() => expect(db.getReceipt).toHaveBeenLastCalledWith(mockDb, 8));
    expect(db.getItems).toHaveBeenLastCalledWith(mockDb, 8);
  });

  it('updates an item in place and saves it', async () => {
    const { result } = await renderLoaded();

    await act(() => result.current.updateItem(2, { name: 'TEJ 1L', price: 349 }));

    expect(db.updateItem).toHaveBeenCalledWith(mockDb, 2, { name: 'TEJ 1L', price: 349 });
    expect(result.current.items).toEqual([bread, { ...milk, name: 'TEJ 1L', price: 349 }]);
    expect(result.current.total).toBe(948);
  });

  it('removes a deleted item and deletes it from the db', async () => {
    const { result } = await renderLoaded();

    await act(() => result.current.deleteItem(1));

    expect(db.deleteItem).toHaveBeenCalledWith(mockDb, 1);
    expect(result.current.items).toEqual([milk]);
  });

  it('appends a new item', async () => {
    const added = makeItem({ id: 3, receipt_id: 7, name: '', price: 0, position: 2 });
    db.addItem.mockResolvedValue(added);
    const { result } = await renderLoaded();

    await act(() => result.current.addItem());

    expect(db.addItem).toHaveBeenCalledWith(mockDb, 7);
    expect(result.current.items).toEqual([bread, milk, added]);
  });

  it('deletes the receipt and its photo', async () => {
    const { result } = await renderLoaded();

    await act(() => result.current.deleteReceipt());

    expect(db.deleteReceipt).toHaveBeenCalledWith(mockDb, 7);
    expect(deleteReceiptImage).toHaveBeenCalledWith(receipt.image_uri);
  });

  it('deletes a receipt that has no photo', async () => {
    db.getReceipt.mockResolvedValue(makeReceipt({ id: 7, image_uri: null }));
    const { result } = await renderLoaded();

    await act(() => result.current.deleteReceipt());

    expect(deleteReceiptImage).toHaveBeenCalledWith(null);
  });
});
