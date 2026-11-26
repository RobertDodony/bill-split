import type { SQLiteDatabase } from 'expo-sqlite';

import { createReceipt, getLastPaidBy } from '@/db/receipts';
import { recognizeText } from '@/services/ocr';
import { persistReceiptImage } from '@/services/receiptImages';
import { parseReceipt } from '@/utils/parseReceipt';

export type ScanResult = { receiptId: number; itemCount: number };

/**
 * The full scan pipeline: keep the photo, read its text, parse items and save the receipt. The
 * receipt starts out paid by whoever paid the last one.
 */
export async function scanReceipt(db: SQLiteDatabase, tempUri: string): Promise<ScanResult> {
  const imageUri = await persistReceiptImage(tempUri);
  const lines = await recognizeText(imageUri);
  if (process.env.EXPO_PUBLIC_LOG_OCR === '1') {
    // Start the dev server with EXPO_PUBLIC_LOG_OCR=1 to capture test fixtures
    // (see fixtures/receipts/README.md).
    console.log(`[scanReceipt] OCR lines:\n${JSON.stringify(lines)}`);
  }
  const { items, detectedTotal } = parseReceipt(lines);
  const paidBy = await getLastPaidBy(db);
  const receiptId = await createReceipt(db, { imageUri, detectedTotal, paidBy, items });
  return { receiptId, itemCount: items.length };
}
