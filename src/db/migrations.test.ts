import type { SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_NAME, DATABASE_VERSION, migrate } from '@/db/migrations';
import { createTestDatabase } from '@/test-utils/testDatabase';

const tableNames = async (db: SQLiteDatabase) =>
  (
    await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type IN ('table', 'index') AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
  ).map((r) => r.name);

const userVersion = async (db: SQLiteDatabase) =>
  (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version;

describe('migrate', () => {
  let db: SQLiteDatabase;

  beforeEach(() => {
    db = createTestDatabase();
  });

  afterEach(() => db.closeAsync());

  it('uses a stable database file name', () => {
    expect(DATABASE_NAME).toBe('receipts.db');
  });

  it('creates the schema on a fresh database', async () => {
    await migrate(db);

    expect(await tableNames(db)).toEqual(['items', 'items_receipt', 'receipts']);
    expect(await userVersion(db)).toBe(DATABASE_VERSION);
  });

  it('enables foreign keys', async () => {
    await db.execAsync('PRAGMA foreign_keys = OFF');
    await migrate(db);

    const row = await db.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys');
    expect(row?.foreign_keys).toBe(1);
  });

  it('can run again on an up-to-date database', async () => {
    await migrate(db);
    await db.runAsync('INSERT INTO receipts (created_at) VALUES (?)', 1);

    await migrate(db);

    expect(await userVersion(db)).toBe(DATABASE_VERSION);
    expect(await db.getAllAsync('SELECT id FROM receipts')).toEqual([{ id: 1 }]);
  });

  it('skips migration steps the database already has', async () => {
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);

    await migrate(db);

    expect(await tableNames(db)).toEqual([]);
  });
});
