import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'receipts.db';

/** Bump this and add a migration step below whenever the schema changes. */
export const DATABASE_VERSION = 2;

/** Brings the database schema up to `DATABASE_VERSION`. Safe to run on every app start. */
export async function migrate(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version >= DATABASE_VERSION) {
    return;
  }

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
  if (version < 2) {
    // How each item is split between R and K, and the last split used for each item name.
    await db.execAsync(`
      ALTER TABLE items ADD COLUMN r_share REAL;
      CREATE TABLE IF NOT EXISTS split_memory (
        name_key TEXT PRIMARY KEY,
        r_share REAL NOT NULL
      );
    `);
  }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
