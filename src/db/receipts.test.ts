import type { SQLiteDatabase } from 'expo-sqlite';

import { migrate } from '@/db/migrations';
import {
  addItem,
  createReceipt,
  deleteItem,
  deleteReceipt,
  getItems,
  getReceipt,
  listReceipts,
  updateItem,
} from '@/db/receipts';
import { createTestDatabase } from '@/test-utils/testDatabase';
import type { ItemFields } from '@/types/receipt';

describe('receipts db', () => {
  let db: SQLiteDatabase;
  let now: jest.SpyInstance<number, []>;

  beforeEach(async () => {
    db = createTestDatabase();
    await migrate(db);
    now = jest.spyOn(Date, 'now').mockReturnValue(1_000);
  });

  afterEach(async () => {
    now.mockRestore();
    await db.closeAsync();
  });

  const count = async (table: 'receipts' | 'items') =>
    (await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`))?.n;

  describe('createReceipt', () => {
    it('saves the receipt and its items in order', async () => {
      const id = await createReceipt(db, {
        imageUri: 'file:///r.jpg',
        detectedTotal: 928,
        items: [
          { name: 'KENYÉR', price: 599 },
          { name: 'TEJ', price: 329 },
        ],
      });

      expect(await getReceipt(db, id)).toEqual({
        id,
        created_at: 1_000,
        image_uri: 'file:///r.jpg',
        detected_total: 928,
        paid_by: null,
        settlement_id: null,
      });
      expect(await getItems(db, id)).toEqual([
        { id: 1, receipt_id: id, name: 'KENYÉR', price: 599, position: 0, r_share: null },
        { id: 2, receipt_id: id, name: 'TEJ', price: 329, position: 1, r_share: null },
      ]);
    });

    it('stores a missing image and total as null', async () => {
      const id = await createReceipt(db, { imageUri: null, items: [] });

      expect(await getReceipt(db, id)).toMatchObject({ image_uri: null, detected_total: null });
    });

    it('saves nothing when an item fails to insert', async () => {
      const badItem = { name: null, price: 1 } as unknown as ItemFields;

      await expect(
        createReceipt(db, { imageUri: null, items: [{ name: 'OK', price: 1 }, badItem] })
      ).rejects.toThrow(/NOT NULL/);

      expect(await count('receipts')).toBe(0);
      expect(await count('items')).toBe(0);
    });
  });

  describe('listReceipts', () => {
    it('lists receipts newest first with item count and total', async () => {
      now.mockReturnValue(1_000);
      const older = await createReceipt(db, {
        imageUri: null,
        items: [
          { name: 'A', price: 100 },
          { name: 'B', price: 250.5 },
        ],
      });
      now.mockReturnValue(2_000);
      const newer = await createReceipt(db, { imageUri: 'file:///n.jpg', items: [] });

      expect(await listReceipts(db)).toEqual([
        {
          id: newer,
          created_at: 2_000,
          image_uri: 'file:///n.jpg',
          detected_total: null,
          paid_by: null,
          settlement_id: null,
          item_count: 0,
          items_total: 0,
        },
        {
          id: older,
          created_at: 1_000,
          image_uri: null,
          detected_total: null,
          paid_by: null,
          settlement_id: null,
          item_count: 2,
          items_total: 350.5,
        },
      ]);
    });

    it('is empty without receipts', async () => {
      expect(await listReceipts(db)).toEqual([]);
    });
  });

  describe('getReceipt', () => {
    it('returns null for an unknown id', async () => {
      expect(await getReceipt(db, 42)).toBeNull();
    });
  });

  describe('deleteReceipt', () => {
    it('deletes the receipt and its items, leaving others alone', async () => {
      const keep = await createReceipt(db, { imageUri: null, items: [{ name: 'K', price: 1 }] });
      const gone = await createReceipt(db, { imageUri: null, items: [{ name: 'G', price: 2 }] });

      await deleteReceipt(db, gone);

      expect(await getReceipt(db, gone)).toBeNull();
      expect(await getItems(db, gone)).toEqual([]);
      expect(await getItems(db, keep)).toHaveLength(1);
    });
  });

  describe('getItems', () => {
    it('orders items by position, then id', async () => {
      const id = await createReceipt(db, { imageUri: null, items: [] });
      const insert = (name: string, position: number) =>
        db.runAsync(
          'INSERT INTO items (receipt_id, name, price, position) VALUES (?, ?, 0, ?)',
          id,
          name,
          position
        );
      await insert('third', 2);
      await insert('first', 0);
      await insert('second-a', 1);
      await insert('second-b', 1);

      expect((await getItems(db, id)).map((i) => i.name)).toEqual([
        'first',
        'second-a',
        'second-b',
        'third',
      ]);
    });
  });

  describe('addItem', () => {
    it('appends an empty item after the last one', async () => {
      const id = await createReceipt(db, {
        imageUri: null,
        items: [
          { name: 'A', price: 1 },
          { name: 'B', price: 2 },
        ],
      });

      const item = await addItem(db, id);

      expect(item).toEqual({
        id: 3,
        receipt_id: id,
        name: '',
        price: 0,
        position: 2,
        r_share: null,
      });
      expect(await getItems(db, id)).toContainEqual(item);
    });

    it('starts at position 0 on an empty receipt', async () => {
      const id = await createReceipt(db, { imageUri: null, items: [] });

      expect((await addItem(db, id)).position).toBe(0);
    });
  });

  describe('updateItem', () => {
    it('changes the name and price of one item', async () => {
      const id = await createReceipt(db, {
        imageUri: null,
        items: [
          { name: 'A', price: 1 },
          { name: 'B', price: 2 },
        ],
      });

      await updateItem(db, 1, { name: 'Alma', price: 349.9 });

      expect(await getItems(db, id)).toMatchObject([
        { id: 1, name: 'Alma', price: 349.9 },
        { id: 2, name: 'B', price: 2 },
      ]);
    });
  });

  describe('deleteItem', () => {
    it('removes one item', async () => {
      const id = await createReceipt(db, {
        imageUri: null,
        items: [
          { name: 'A', price: 1 },
          { name: 'B', price: 2 },
        ],
      });

      await deleteItem(db, 1);

      expect((await getItems(db, id)).map((i) => i.name)).toEqual(['B']);
    });
  });
});
