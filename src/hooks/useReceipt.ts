import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import * as receiptsDb from '@/db/receipts';
import { deleteReceiptImage } from '@/services/receiptImages';
import type { ItemFields, Receipt, ReceiptItem } from '@/types/receipt';
import { sumPrices } from '@/utils/price';

/** Loads one receipt with its items and exposes the edits the receipt screen can make. */
export function useReceipt(receiptId: number) {
  const db = useSQLiteContext();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [items, setItems] = useState<ReceiptItem[]>([]);

  useEffect(() => {
    void receiptsDb.getReceipt(db, receiptId).then(setReceipt);
    void receiptsDb.getItems(db, receiptId).then(setItems);
  }, [db, receiptId]);

  const total = sumPrices(items);

  const updateItem = async (itemId: number, fields: ItemFields) => {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, ...fields } : i)));
    await receiptsDb.updateItem(db, itemId, fields);
  };

  const deleteItem = async (itemId: number) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    await receiptsDb.deleteItem(db, itemId);
  };

  const addItem = async () => {
    const item = await receiptsDb.addItem(db, receiptId);
    setItems((prev) => [...prev, item]);
  };

  /** Deletes the receipt, its items and its stored photo. */
  const deleteReceipt = async () => {
    await receiptsDb.deleteReceipt(db, receiptId);
    deleteReceiptImage(receipt?.image_uri ?? null);
  };

  return {
    receipt,
    items,
    total,
    updateItem,
    deleteItem,
    addItem,
    deleteReceipt,
  };
}
