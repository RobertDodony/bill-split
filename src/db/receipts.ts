import type { SQLiteDatabase } from 'expo-sqlite';

import type { ParsedItem } from '@/lib/parse-receipt';

export type Receipt = {
  id: number;
  created_at: number;
  image_uri: string | null;
  detected_total: number | null;
};

export type ReceiptSummary = Receipt & { item_count: number; items_total: number };

export type Item = {
  id: number;
  receipt_id: number;
  name: string;
  price: number;
  position: number;
};

const DATABASE_VERSION = 1;

export async function migrate(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version >= DATABASE_VERSION) return;

  if (version === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at INTEGER NOT NULL,
        image_uri TEXT,
        detected_total REAL
      );
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_id INTEGER NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        position INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS items_receipt ON items(receipt_id);
    `);
  }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

export async function createReceipt(
  db: SQLiteDatabase,
  data: { imageUri: string | null; detectedTotal?: number; items: ParsedItem[] }
): Promise<number> {
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

export function getItems(db: SQLiteDatabase, receiptId: number) {
  return db.getAllAsync<Item>(
    'SELECT * FROM items WHERE receipt_id = ? ORDER BY position, id',
    receiptId
  );
}

export async function updateItem(
  db: SQLiteDatabase,
  id: number,
  fields: { name: string; price: number }
) {
  await db.runAsync('UPDATE items SET name = ?, price = ? WHERE id = ?', fields.name, fields.price, id);
}

export async function addItem(db: SQLiteDatabase, receiptId: number): Promise<Item> {
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
  return { id: res.lastInsertRowId, receipt_id: receiptId, name: '', price: 0, position };
}

export async function deleteItem(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM items WHERE id = ?', id);
}

export async function deleteReceipt(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM receipts WHERE id = ?', id);
}
