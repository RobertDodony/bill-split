import type { SQLiteDatabase } from 'expo-sqlite';

import { migrate } from '@/db/migrations';
import { createReceipt, getItems } from '@/db/receipts';
import { getSplitMemory, saveItemSplit } from '@/db/splits';
import { createTestDatabase } from '@/test-utils/testDatabase';

describe('splits db', () => {
  let db: SQLiteDatabase;
  let receiptId: number;

  beforeEach(async () => {
    db = createTestDatabase();
    await migrate(db);
    receiptId = await createReceipt(db, {
      imageUri: null,
      items: [
        { name: 'Kenyér', price: 599 },
        { name: 'TEJ', price: 329 },
      ],
    });
  });

  afterEach(() => db.closeAsync());

  it('starts with new items unsplit and nothing remembered', async () => {
    expect((await getItems(db, receiptId)).map((i) => i.r_share)).toEqual([null, null]);
    expect(await getSplitMemory(db)).toEqual(new Map());
  });

  it('saves the item’s split', async () => {
    await saveItemSplit(db, 1, 'Kenyér', 100 / 3);

    expect((await getItems(db, receiptId)).map((i) => i.r_share)).toEqual([100 / 3, null]);
  });

  it('remembers the split under the normalized item name', async () => {
    await saveItemSplit(db, 1, ' Kenyér ', 100 / 3);

    expect(await getSplitMemory(db)).toEqual(new Map([['KENYÉR', 100 / 3]]));
  });

  it('remembers the latest split for a name', async () => {
    await saveItemSplit(db, 1, 'Kenyér', 50);
    await saveItemSplit(db, 1, 'KENYÉR', 75);

    expect(await getSplitMemory(db)).toEqual(new Map([['KENYÉR', 75]]));
  });

  it('remembers nothing for an item without a name', async () => {
    await saveItemSplit(db, 1, '  ', 20);

    expect((await getItems(db, receiptId))[0].r_share).toBe(20);
    expect(await getSplitMemory(db)).toEqual(new Map());
  });

  it('keeps the memory when the receipt is deleted', async () => {
    await saveItemSplit(db, 1, 'Kenyér', 50);
    await db.runAsync('DELETE FROM receipts');

    expect(await getSplitMemory(db)).toEqual(new Map([['KENYÉR', 50]]));
  });
});
