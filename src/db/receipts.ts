import type { SQLiteDatabase } from 'expo-sqlite';

import type { ItemFields, Receipt, ReceiptItem, ReceiptSummary } from '@/types/receipt';

export type NewReceipt = {
  imageUri: string | null;
  detectedTotal?: number;
  items: ItemFields[];
};

/** Inserts a receipt and its items in one transaction and returns the new receipt id. */
export async function createReceipt(db: SQLiteDatabase, data: NewReceipt): Promise<number> {
  let id = 0;
  await db.withTransactionAsync(async () => {
    const res = await db.runAsync(
      'INSERT INTO receipts (created_at, image_uri, detected_total) VALUES (?, ?, ?)',
      Date.now(),
      data.imageUri,
      data.detectedTotal ?? null
    );
    id = res.lastInsertRowId;
    for (const [i, item] of data.items.entries()) {
      // Inserted one at a time inside the transaction, in item order.
      // oxlint-disable-next-line no-await-in-loop
      await db.runAsync(
        'INSERT INTO items (receipt_id, name, price, position) VALUES (?, ?, ?, ?)',
        id,
        item.name,
        item.price,
        i
      );
    }
  });
  return id;
}

/** All receipts, newest first, with their item count and item total. */
export function listReceipts(db: SQLiteDatabase) {
  return db.getAllAsync<ReceiptSummary>(`
    SELECT r.*, COUNT(i.id) AS item_count, COALESCE(SUM(i.price), 0) AS items_total
    FROM receipts r LEFT JOIN items i ON i.receipt_id = r.id
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `);
}

export function getReceipt(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Receipt>('SELECT * FROM receipts WHERE id = ?', id);
}

/** Deletes a receipt. Its items are removed by the `ON DELETE CASCADE` foreign key. */
export async function deleteReceipt(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM receipts WHERE id = ?', id);
}

export function getItems(db: SQLiteDatabase, receiptId: number) {
  return db.getAllAsync<ReceiptItem>(
    'SELECT * FROM items WHERE receipt_id = ? ORDER BY position, id',
    receiptId
  );
}

/** Appends an empty item to the end of a receipt and returns it. */
export async function addItem(db: SQLiteDatabase, receiptId: number): Promise<ReceiptItem> {
  const max = await db.getFirstAsync<{ pos: number | null }>(
    'SELECT MAX(position) AS pos FROM items WHERE receipt_id = ?',
    receiptId
  );
  const position = (max?.pos ?? -1) + 1;
  const res = await db.runAsync(
    'INSERT INTO items (receipt_id, name, price, position) VALUES (?, ?, ?, ?)',
    receiptId,
    '',
    0,
    position
  );
  return {
    id: res.lastInsertRowId,
    receipt_id: receiptId,
    name: '',
    price: 0,
    position,
    r_share: null,
  };
}

export async function updateItem(db: SQLiteDatabase, id: number, fields: ItemFields) {
  await db.runAsync(
    'UPDATE items SET name = ?, price = ? WHERE id = ?',
    fields.name,
    fields.price,
    id
  );
}

export async function deleteItem(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM items WHERE id = ?', id);
}
