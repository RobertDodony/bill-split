/**
 * Runs the parser over every real receipt in `fixtures/receipts/` (see the README there).
 */
import fs from 'node:fs';
import path from 'node:path';

import type { OcrLine } from '@/types/ocr';
import type { ParsedReceipt } from '@/types/receipt';
import { parseReceipt, parseReceiptRows } from '@/utils/parseReceipt';
import { sumPrices } from '@/utils/price';

type ReceiptFixture = {
  file: string;
  description: string;
  image: string;
  /** The receipt row by row. A row printed in columns (name, price, VAT code) is an array. */
  rows: (string | string[])[];
  /** Raw OCR output captured in the app, if any. */
  ocrLines?: OcrLine[];
  expected: ParsedReceipt;
};

const FIXTURES_DIR = path.join(__dirname, '..', '..', 'fixtures', 'receipts');

const fixtures: ReceiptFixture[] = fs
  .readdirSync(FIXTURES_DIR)
  .filter((file) => file.endsWith('.json'))
  .toSorted()
  .map((file) => ({ file, ...JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, file), 'utf8')) }));

/**
 * Lays the rows out like OCR output of a slightly rotated photo: every column is a separate line,
 * columns further right sit a little lower, and the lines are not in reading order.
 */
function simulateOcr(rows: ReceiptFixture['rows']): OcrLine[] {
  const ROW_HEIGHT = 30;
  const ROW_SPACING = 42;
  const COLUMN_WIDTH = 400;
  const SKEW = 0.02;

  return rows
    .flatMap((row, r) =>
      (Array.isArray(row) ? row : [row]).map((text, c) => {
        const left = c * COLUMN_WIDTH;
        const top = r * ROW_SPACING + left * SKEW;
        return { text, left, right: left + text.length * 12, top, bottom: top + ROW_HEIGHT };
      })
    )
    .toReversed();
}

it('has receipt fixtures', () => {
  expect(fixtures.length).toBeGreaterThan(0);
});

describe.each(fixtures)('$file: $description', ({ image, rows, ocrLines, expected }) => {
  it('has its photo', () => {
    expect(fs.existsSync(path.join(FIXTURES_DIR, image))).toBe(true);
  });

  it('expects items that add up to the printed total', () => {
    expect(sumPrices(expected.items)).toBeCloseTo(expected.detectedTotal ?? NaN, 2);
  });

  it('reads the items and total from the rows', () => {
    const text = rows.map((row) => (Array.isArray(row) ? row.join(' ') : row));

    expect(parseReceiptRows(text)).toEqual(expected);
  });

  it('reads the same from OCR lines of a slightly rotated photo', () => {
    expect(parseReceipt(simulateOcr(rows))).toEqual(expected);
  });

  if (ocrLines) {
    it('reads the same from the OCR output captured in the app', () => {
      expect(parseReceipt(ocrLines)).toEqual(expected);
    });
  }
});
