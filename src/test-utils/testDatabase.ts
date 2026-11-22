import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * An in-memory SQLite database (Node's built-in `node:sqlite`) behind the subset of the
 * `expo-sqlite` API the app uses, so queries and migrations run against a real SQLite engine.
 */
export function createTestDatabase(): SQLiteDatabase {
  const sqlite = new DatabaseSync(':memory:');

  const db = {
    async execAsync(source: string) {
      sqlite.exec(source);
    },
    async getFirstAsync(source: string, ...params: SQLInputValue[]) {
      return sqlite.prepare(source).get(...params) ?? null;
    },
    async getAllAsync(source: string, ...params: SQLInputValue[]) {
      return sqlite.prepare(source).all(...params);
    },
    async runAsync(source: string, ...params: SQLInputValue[]) {
      const result = sqlite.prepare(source).run(...params);
      return { lastInsertRowId: Number(result.lastInsertRowid), changes: Number(result.changes) };
    },
    async withTransactionAsync(task: () => Promise<void>) {
      sqlite.exec('BEGIN');
      try {
        await task();
        sqlite.exec('COMMIT');
      } catch (e) {
        sqlite.exec('ROLLBACK');
        throw e;
      }
    },
    async closeAsync() {
      sqlite.close();
    },
  };

  return db as unknown as SQLiteDatabase;
}
