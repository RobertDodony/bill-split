import type { SQLiteDatabase } from 'expo-sqlite';

import { migrate } from '@/db/migrations';
import { createReceipt, getItems, getReceipt, listReceipts } from '@/db/receipts';
import { recognizeText } from '@/services/ocr';
import { persistReceiptImage } from '@/services/receiptImages';
import { scanReceipt } from '@/services/scanReceipt';
import { createTestDatabase } from '@/test-utils/testDatabase';

jest.mock('@/services/ocr');
jest.mock('@/services/receiptImages');

const ocrLine = (text: string, top: number, left = 0) => ({
  text,
  top,
  bottom: top + 20,
  left,
  right: left + 100,
});

describe('scanReceipt', () => {
  let db: SQLiteDatabase;

  beforeEach(async () => {
    db = createTestDatabase();
    await migrate(db);
    jest.mocked(persistReceiptImage).mockResolvedValue('file:///documents/receipts/1.jpg');
  });

  afterEach(() => db.closeAsync());

  it('keeps the photo, reads it and saves the parsed receipt', async () => {
    jest
      .mocked(recognizeText)
      .mockResolvedValue([
        ocrLine('KENYÉR', 0),
        ocrLine('599', 0, 300),
        ocrLine('TEJ', 40),
        ocrLine('329', 40, 300),
        ocrLine('ÖSSZESEN 928', 80),
      ]);

    const result = await scanReceipt(db, 'file:///cache/tmp.jpg');

    expect(persistReceiptImage).toHaveBeenCalledWith('file:///cache/tmp.jpg');
    expect(recognizeText).toHaveBeenCalledWith('file:///documents/receipts/1.jpg');
    expect(result).toEqual({ receiptId: expect.any(Number), itemCount: 2 });
    expect(await getReceipt(db, result.receiptId)).toMatchObject({
      image_uri: 'file:///documents/receipts/1.jpg',
      detected_total: 928,
    });
    expect(await getItems(db, result.receiptId)).toMatchObject([
      { name: 'KENYÉR', price: 599 },
      { name: 'TEJ', price: 329 },
    ]);
  });

  it('saves an empty receipt when no items are recognized', async () => {
    jest.mocked(recognizeText).mockResolvedValue([]);

    const result = await scanReceipt(db, 'file:///cache/tmp.jpg');

    expect(result.itemCount).toBe(0);
    expect(await getReceipt(db, result.receiptId)).toMatchObject({ detected_total: null });
  });

  it('starts the receipt with the last payer', async () => {
    jest.mocked(recognizeText).mockResolvedValue([]);
    await createReceipt(db, { imageUri: null, paidBy: 'K', items: [] });

    const result = await scanReceipt(db, 'file:///cache/tmp.jpg');

    expect(await getReceipt(db, result.receiptId)).toMatchObject({ paid_by: 'K' });
  });

  it('starts the first receipt with no payer', async () => {
    jest.mocked(recognizeText).mockResolvedValue([]);

    const result = await scanReceipt(db, 'file:///cache/tmp.jpg');

    expect(await getReceipt(db, result.receiptId)).toMatchObject({ paid_by: null });
  });

  describe('OCR logging', () => {
    let log: jest.SpyInstance;

    beforeEach(() => {
      log = jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.mocked(recognizeText).mockResolvedValue([ocrLine('KENYÉR 599', 0)]);
    });

    afterEach(() => {
      log.mockRestore();
      delete process.env.EXPO_PUBLIC_LOG_OCR;
    });

    it('logs the OCR lines as JSON when EXPO_PUBLIC_LOG_OCR=1', async () => {
      process.env.EXPO_PUBLIC_LOG_OCR = '1';

      await scanReceipt(db, 'file:///cache/tmp.jpg');

      const [message] = log.mock.calls[0];
      expect(JSON.parse(message.split('\n')[1])).toEqual([ocrLine('KENYÉR 599', 0)]);
    });

    it('logs nothing otherwise', async () => {
      await scanReceipt(db, 'file:///cache/tmp.jpg');

      expect(log).not.toHaveBeenCalled();
    });
  });

  it('saves nothing when text recognition fails', async () => {
    jest.mocked(recognizeText).mockRejectedValue(new Error('OCR failed'));

    await expect(scanReceipt(db, 'file:///cache/tmp.jpg')).rejects.toThrow('OCR failed');
    expect(await listReceipts(db)).toEqual([]);
  });
});
