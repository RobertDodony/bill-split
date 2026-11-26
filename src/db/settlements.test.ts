import type { SQLiteDatabase } from 'expo-sqlite';

import { migrate } from '@/db/migrations';
import { createReceipt, deleteReceipt, getReceipt } from '@/db/receipts';
import { getOpenReceiptsWithItems, listSettlements, settleOpenReceipts } from '@/db/settlements';
import { createTestDatabase } from '@/test-utils/testDatabase';

describe('settlements db', () => {
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

  describe('getOpenReceiptsWithItems', () => {
    it('returns open receipts oldest first, each with its own items in order', async () => {
      const first = await createReceipt(db, {
        imageUri: null,
        paidBy: 'R',
        items: [
          { name: 'KENYÉR', price: 599 },
          { name: 'TEJ', price: 329 },
        ],
      });
      now.mockReturnValue(2_000);
      const second = await createReceipt(db, {
        imageUri: null,
        items: [{ name: 'SAJT', price: 1299 }],
      });

      const open = await getOpenReceiptsWithItems(db);

      expect(open.map((r) => r.id)).toEqual([first, second]);
      expect(open[0]).toMatchObject({ paid_by: 'R', settlement_id: null });
      expect(open[0]?.items.map((i) => i.name)).toEqual(['KENYÉR', 'TEJ']);
      expect(open[1]?.items.map((i) => i.name)).toEqual(['SAJT']);
    });

    it('includes receipts without items', async () => {
      const id = await createReceipt(db, { imageUri: null, items: [] });

      expect(await getOpenReceiptsWithItems(db)).toEqual([
        expect.objectContaining({ id, items: [] }),
      ]);
    });

    it('leaves out settled receipts', async () => {
      await createReceipt(db, { imageUri: null, items: [{ name: 'A', price: 1 }] });
      await settleOpenReceipts(db);
      const open = await createReceipt(db, { imageUri: null, items: [{ name: 'B', price: 2 }] });

      expect((await getOpenReceiptsWithItems(db)).map((r) => r.id)).toEqual([open]);
    });
  });

  describe('settleOpenReceipts', () => {
    it('closes every open receipt under one new settlement', async () => {
      const a = await createReceipt(db, { imageUri: null, items: [] });
      const b = await createReceipt(db, { imageUri: null, items: [] });
      now.mockReturnValue(5_000);

      const settlementId = await settleOpenReceipts(db);

      expect(settlementId).not.toBeNull();
      expect(await listSettlements(db)).toEqual([{ id: settlementId, settled_at: 5_000 }]);
      expect(await getReceipt(db, a)).toMatchObject({ settlement_id: settlementId });
      expect(await getReceipt(db, b)).toMatchObject({ settlement_id: settlementId });
      expect(await getOpenReceiptsWithItems(db)).toEqual([]);
    });

    it('leaves receipts from an earlier settlement in that one', async () => {
      const old = await createReceipt(db, { imageUri: null, items: [] });
      const firstId = await settleOpenReceipts(db);
      const recent = await createReceipt(db, { imageUri: null, items: [] });

      const secondId = await settleOpenReceipts(db);

      expect(secondId).not.toBe(firstId);
      expect(await getReceipt(db, old)).toMatchObject({ settlement_id: firstId });
      expect(await getReceipt(db, recent)).toMatchObject({ settlement_id: secondId });
    });

    it('creates nothing when there is nothing open', async () => {
      await createReceipt(db, { imageUri: null, items: [] });
      await settleOpenReceipts(db);

      expect(await settleOpenReceipts(db)).toBeNull();
      expect(await listSettlements(db)).toHaveLength(1);
    });

    it('keeps a settlement when one of its receipts is deleted', async () => {
      const a = await createReceipt(db, { imageUri: null, items: [] });
      await createReceipt(db, { imageUri: null, items: [] });
      await settleOpenReceipts(db);

      await deleteReceipt(db, a);

      expect(await listSettlements(db)).toHaveLength(1);
    });
  });

  describe('listSettlements', () => {
    it('lists settlements newest first', async () => {
      await createReceipt(db, { imageUri: null, items: [] });
      const older = await settleOpenReceipts(db);
      now.mockReturnValue(9_000);
      await createReceipt(db, { imageUri: null, items: [] });
      const newer = await settleOpenReceipts(db);

      expect((await listSettlements(db)).map((s) => s.id)).toEqual([newer, older]);
    });

    it('is empty before the first settle-up', async () => {
      expect(await listSettlements(db)).toEqual([]);
    });
  });
});
