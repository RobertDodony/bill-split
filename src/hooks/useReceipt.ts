import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import * as receiptsDb from '@/db/receipts';
import * as splitsDb from '@/db/splits';
import { deleteReceiptImage } from '@/services/receiptImages';
import type { ItemFields, Receipt, ReceiptItem } from '@/types/receipt';
import { sumPrices } from '@/utils/price';
import { DEFAULT_SHARE, pickActiveItem, splitKey, summarizeSplit } from '@/utils/split';

/**
 * Loads one receipt with its items and exposes the edits the receipt screen can make, including
 * splitting the items between R and K one at a time.
 */
export function useReceipt(receiptId: number) {
  const db = useSQLiteContext();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [splitMemory, setSplitMemory] = useState<ReadonlyMap<string, number>>(new Map());
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  useEffect(() => {
    void receiptsDb.getReceipt(db, receiptId).then(setReceipt);
    void receiptsDb.getItems(db, receiptId).then(setItems);
  }, [db, receiptId]);

  useEffect(() => {
    void splitsDb.getSplitMemory(db).then(setSplitMemory);
  }, [db]);

  const total = sumPrices(items);
  const split = summarizeSplit(items);
  /** The item whose split is being edited, or `null` when every item is split. */
  const activeItemId = pickActiveItem(items, selectedItemId);

  /** The split an item's slider starts at: its own, else the one remembered for its name. */
  const initialShare = (item: ReceiptItem) =>
    item.r_share ?? splitMemory.get(splitKey(item.name)) ?? DEFAULT_SHARE;

  /** Saves an item's split, remembers it for the item's name and moves on to the next item. */
  const acceptSplit = async (itemId: number, share: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) {
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, r_share: share } : i)));
    setSelectedItemId(null);
    const key = splitKey(item.name);
    if (key) {
      setSplitMemory((prev) => new Map(prev).set(key, share));
    }
    await splitsDb.saveItemSplit(db, itemId, item.name, share);
  };

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
    split,
    activeItemId,
    initialShare,
    acceptSplit,
    /** Opens an item's split for editing. */
    selectItem: setSelectedItemId,
    updateItem,
    deleteItem,
    addItem,
    deleteReceipt,
  };
}
