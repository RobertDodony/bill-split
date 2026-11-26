import type { SQLiteDatabase } from 'expo-sqlite';

import { splitKey } from '@/utils/split';

/** The last split used for each item name, keyed by `splitKey(name)`. */
export async function getSplitMemory(db: SQLiteDatabase): Promise<Map<string, number>> {
  const rows = await db.getAllAsync<{ name_key: string; r_share: number }>(
    'SELECT name_key, r_share FROM split_memory'
  );
  return new Map(rows.map((row) => [row.name_key, row.r_share]));
}

/** Saves an item's split and remembers it as the default for items with the same name. */
export async function saveItemSplit(
  db: SQLiteDatabase,
  itemId: number,
  name: string,
  share: number
) {
  const key = splitKey(name);
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE items SET r_share = ? WHERE id = ?', share, itemId);
    if (key) {
      await db.runAsync(
        `INSERT INTO split_memory (name_key, r_share) VALUES (?, ?)
         ON CONFLICT(name_key) DO UPDATE SET r_share = excluded.r_share`,
        key,
        share
      );
    }
  });
}
