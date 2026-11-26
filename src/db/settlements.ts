import type { SQLiteDatabase } from 'expo-sqlite';

import type { Receipt, ReceiptItem, ReceiptWithItems, Settlement } from '@/types/receipt';

/** Every receipt not settled yet, oldest first, each with its items in order. */
export async function getOpenReceiptsWithItems(db: SQLiteDatabase): Promise<ReceiptWithItems[]> {
  const receipts = await db.getAllAsync<Receipt>(
    'SELECT * FROM receipts WHERE settlement_id IS NULL ORDER BY created_at, id'
  );
  const items = await db.getAllAsync<ReceiptItem>(`
    SELECT i.* FROM items i JOIN receipts r ON r.id = i.receipt_id
    WHERE r.settlement_id IS NULL
    ORDER BY i.position, i.id
  `);

  // Two queries instead of one per receipt; the items are matched back to their receipts here.
  // Filtering per receipt is fine at a month's worth of receipts. The rows are fresh from the
  // query, so attaching the items to them in place is safe.
  return receipts.map((receipt) =>
    Object.assign(receipt, { items: items.filter((item) => item.receipt_id === receipt.id) })
  );
}

/**
 * Closes every open receipt as one settlement and returns its id. Returns `null` and creates
 * nothing when there's nothing open to settle.
 */
export async function settleOpenReceipts(db: SQLiteDatabase): Promise<number | null> {
  let settlementId: number | null = null;
  await db.withTransactionAsync(async () => {
    const open = await db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM receipts WHERE settlement_id IS NULL'
    );
    if (!open?.n) {
      return;
    }
    const res = await db.runAsync('INSERT INTO settlements (settled_at) VALUES (?)', Date.now());
    settlementId = res.lastInsertRowId;
    await db.runAsync(
      'UPDATE receipts SET settlement_id = ? WHERE settlement_id IS NULL',
      settlementId
    );
  });
  return settlementId;
}

/** All settlements, newest first. */
export function listSettlements(db: SQLiteDatabase) {
  return db.getAllAsync<Settlement>('SELECT * FROM settlements ORDER BY settled_at DESC, id DESC');
}
