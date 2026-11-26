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

    expect(await tableNames(db)).toEqual([
      'items',
      'items_receipt',
      'receipts',
      'receipts_settlement',
      'settlements',
      'split_memory',
    ]);
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

  it('upgrades a version 1 database, keeping its items unsplit', async () => {
    await db.execAsync(`
      CREATE TABLE receipts (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at INTEGER NOT NULL,
        image_uri TEXT, detected_total REAL);
      CREATE TABLE items (id INTEGER PRIMARY KEY AUTOINCREMENT, receipt_id INTEGER NOT NULL,
        name TEXT NOT NULL, price REAL NOT NULL, position INTEGER NOT NULL);
      INSERT INTO receipts (created_at) VALUES (1);
      INSERT INTO items (receipt_id, name, price, position) VALUES (1, 'TEJ', 329, 0);
      PRAGMA user_version = 1;
    `);

    await migrate(db);

    expect(await userVersion(db)).toBe(DATABASE_VERSION);
    expect(await db.getAllAsync('SELECT name, r_share FROM items')).toEqual([
      { name: 'TEJ', r_share: null },
    ]);
    expect(await db.getAllAsync('SELECT * FROM split_memory')).toEqual([]);
  });

  it('upgrades a version 2 database, keeping its receipts open with no payer', async () => {
    await db.execAsync(`
      CREATE TABLE receipts (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at INTEGER NOT NULL,
        image_uri TEXT, detected_total REAL);
      CREATE TABLE items (id INTEGER PRIMARY KEY AUTOINCREMENT, receipt_id INTEGER NOT NULL,
        name TEXT NOT NULL, price REAL NOT NULL, position INTEGER NOT NULL, r_share REAL);
      CREATE TABLE split_memory (name_key TEXT PRIMARY KEY, r_share REAL NOT NULL);
      INSERT INTO receipts (created_at) VALUES (1);
      PRAGMA user_version = 2;
    `);

    await migrate(db);

    expect(await userVersion(db)).toBe(DATABASE_VERSION);
    expect(await db.getAllAsync('SELECT id, paid_by, settlement_id FROM receipts')).toEqual([
      { id: 1, paid_by: null, settlement_id: null },
    ]);
    expect(await db.getAllAsync('SELECT * FROM settlements')).toEqual([]);
  });

  it('only accepts R or K as the payer', async () => {
    await migrate(db);

    await expect(
      db.runAsync("INSERT INTO receipts (created_at, paid_by) VALUES (1, 'X')")
    ).rejects.toThrow('CHECK constraint failed');
  });

  it('reopens receipts when their settlement is deleted', async () => {
    await migrate(db);
    await db.execAsync(`
      INSERT INTO settlements (settled_at) VALUES (5);
      INSERT INTO receipts (created_at, settlement_id) VALUES (1, 1);
      DELETE FROM settlements;
    `);

    expect(await db.getAllAsync('SELECT settlement_id FROM receipts')).toEqual([
      { settlement_id: null },
    ]);
  });

  it('skips migration steps the database already has', async () => {
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);

    await migrate(db);

    expect(await tableNames(db)).toEqual([]);
  });
});
