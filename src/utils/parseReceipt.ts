import type { OcrLine } from '@/types/ocr';
import type { ItemFields, ParsedReceipt } from '@/types/receipt';
import { parsePrice } from '@/utils/price';

/*
 * Hungarian receipts print the shop's details, then a "NYUGTA" (receipt) heading, then the
 * line items, then "ÖSSZESEN" (total) followed by payment details. Items are only read
 * between the heading and the total.
 *
 * Keywords are compared on text normalized by `normalize()`: uppercase, without diacritics.
 */

/** The heading above the items. */
const HEADING = 'NYUGTA';

/** The shop's tax number, the last header line. Used as the anchor if the heading is unreadable. */
const TAX_NUMBER = 'ADOSZAM';

/** A row starting with one of these holds the total; everything after it is payment details. */
const TOTAL_KEYWORDS = ['OSSZESEN', 'OSSZEG', 'FIZETENDO', 'TOTAL'];

/**
 * "ÖSSZESEN" (total) is never part of an item name, so a row with it anywhere holds the total,
 * even after a VAT code or a misread letter (`B00 ÖSSZESEN`, `0SSZESEN`).
 */
const TOTAL_WORD = 'OSSZESEN';

/** Payment lines follow the total. Reaching one means the total row was missed: stop there. */
const PAYMENT_KEYWORDS = [
  'BANKKARTYA',
  'KESZPENZ',
  'VISA',
  'MASTERCARD',
  'MAESTRO',
  'GONGYOLEG',
  'SZEP KARTYA',
  'UTALVANY',
];

/** Rows containing one of these (at the start of a word) are not line items. */
const SKIP_KEYWORDS = [
  'AFA',
  'ADOSZAM',
  'ADOSZ',
  'KESZPENZ',
  'BANKKARTYA',
  'KARTYA',
  'VISSZAJARO',
  'RESZOSSZEG',
  'RESZOSSZESEN',
  'KEREKITES',
  'NAV',
  'AP ',
  'TEL.',
  'TELEFON',
  'DATUM',
  'SUBTOTAL',
  'CHANGE',
  'CASH',
  'CARD',
  'VAT',
  'TAX',
  // Column headings, e.g. SPAR's "ÁFA Megnevezés / Menny. Me. Egységár Érték".
  'MEGNEVEZES',
  'MENNY',
  'EGYSEGAR',
  // The article number line Rossmann prints above each item: "CIKKSZ M: 40471 1 DB X 255 Ft".
  'CIKKSZ',
];

/** How many rows below a total keyword the amount may be printed (Rossmann prints it below). */
const TOTAL_AMOUNT_LOOKAHEAD = 2;

/** `1 299`, `1.299`, `1 299,50` or `1299`, `12,5`, `3.50`. */
const AMOUNT = String.raw`\d{1,3}(?:[ .]\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?`;

/**
 * A price at the end of a row, optionally followed by a currency and a VAT code (`B00`, `C27`, `A`,
 * `*`). Groups: 1 = amount, 2 = a letter glued to the amount (`-552e` on Rossmann discounts).
 */
const PRICE_AT_END = new RegExp(
  String.raw`(?:^|\s)(-?(?:${AMOUNT}))([a-z])?\s*(?:FT|HUF|EUR|€|\$)?(?:\s+[A-E][0-9O]{0,2}|\s*\*)?\s*$`,
  'i'
);

/** A quantity line such as `0,712 KG * 399 Ft/KG 284` or `2 DB X 255 Ft`. */
const QUANTITY = /\d+(?:[.,]\d+)?\s*(?:DB|KG|G|L|CS|PCS)\.?\s*[X×*]\s*\d/;

/** The VAT code some shops print before the name (`B00 Trappista`), including common misreads. */
const LEADING_VAT_CODE = /^[A-E(][0OÓÖŐQUÚŰ]{1,3}\s+/;

function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
}

/** True if `key` contains a keyword at the start of a word (so `HOTEL` doesn't match `TEL`). */
function hasKeyword(key: string, keywords: string[]) {
  return keywords.some((k) => new RegExp(`(^|[^A-Z])${k.replace('.', '\\.')}`).test(key));
}

function startsWithKeyword(key: string, keywords: string[]) {
  return keywords.some((k) => new RegExp(`^[^A-Z]*${k}`).test(key));
}

/** True if `a` and `b` differ by at most one inserted, deleted or replaced character. */
function withinOneEdit(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) {
    return false;
  }
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) {
      return false;
    }
    if (a.length > b.length) {
      i++;
    } else if (a.length < b.length) {
      j++;
    } else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/** The heading row, allowing one misread letter (OCR often reads `NYUGTA` as `NYUGIA`). */
function isHeading(row: string) {
  return normalize(row)
    .split(/[^A-Z]+/)
    .some((word) => withinOneEdit(word, HEADING));
}

/** True if the row holds the total: it starts with a total keyword or contains `TOTAL_WORD`. */
function isTotalRow(key: string) {
  return (
    startsWithKeyword(key, TOTAL_KEYWORDS) ||
    key.split(/[^A-Z]+/).some((word) => withinOneEdit(word, TOTAL_WORD))
  );
}

/** Index of the first row that holds items: below the heading, else below the tax number. */
function findItemsStart(rows: string[]) {
  const heading = rows.findIndex(isHeading);
  if (heading !== -1) {
    return heading + 1;
  }
  const taxNumber = rows.findIndex((row) => hasKeyword(normalize(row), [TAX_NUMBER]));
  return taxNumber + 1;
}

/** Removes markers, a leading VAT code and trailing separators from an item name. */
function cleanName(text: string) {
  return text
    .replace(/^[!*#\s]+/, '')
    .replace(LEADING_VAT_CODE, '')
    .replace(/[\s.:*-]+$/, '')
    .trim();
}

function splitRow(row: string): { name: string; price?: number } {
  const match = row.match(PRICE_AT_END);
  if (!match || match.index === undefined) {
    return { name: row };
  }
  const [, amount, gluedLetter] = match;
  // `0,5l` is part of a name; only discounts carry a letter, e.g. `-552e`.
  if (gluedLetter && !amount.startsWith('-')) {
    return { name: row };
  }
  return { name: row.slice(0, match.index).trim(), price: parsePrice(amount) };
}

function isMostlyLetters(text: string) {
  const letters = text.replace(/[^\p{L}]/gu, '').length;
  return letters >= 2 && letters >= text.replace(/\s/g, '').length * 0.4;
}

/** Turn visual rows of text into line items and the printed total, if any. */
export function parseReceiptRows(rows: string[]): ParsedReceipt {
  const items: ItemFields[] = [];
  /** A name-only row whose price may be on the next row. */
  let pendingName: string | undefined;
  /** Rows left to find the amount of a total printed without one. */
  let totalLookahead = 0;

  for (const row of rows.slice(findItemsStart(rows))) {
    const key = normalize(row);
    const { name, price } = splitRow(row);

    if (isTotalRow(key)) {
      if (price !== undefined) {
        return { items, detectedTotal: price };
      }
      totalLookahead = TOTAL_AMOUNT_LOOKAHEAD;
      continue;
    }
    if (totalLookahead > 0) {
      if (price !== undefined && !name) {
        return { items, detectedTotal: price };
      }
      if (--totalLookahead === 0) {
        break;
      }
      continue;
    }
    if (startsWithKeyword(key, PAYMENT_KEYWORDS)) {
      break;
    }

    if (hasKeyword(key, SKIP_KEYWORDS) || row.trimStart().startsWith('[')) {
      pendingName = undefined;
      continue;
    }

    if (QUANTITY.test(key)) {
      // Weighed or multiplied item: the name is on the row above, the line total at the end.
      if (pendingName && price !== undefined) {
        items.push({ name: pendingName, price });
      }
      pendingName = undefined;
      continue;
    }

    const cleaned = cleanName(name);
    if (price === undefined) {
      // Name-only row; its price might be on the next row.
      pendingName = isMostlyLetters(cleaned) ? cleaned : undefined;
      continue;
    }

    if (cleaned && isMostlyLetters(cleaned)) {
      items.push({ name: cleaned, price });
    } else if (!cleaned && pendingName) {
      // Wrapped line: the price alone on the row below the name.
      items.push({ name: pendingName, price });
    }
    pendingName = undefined;
  }

  return { items, detectedTotal: undefined };
}

// Copy-then-sort instead of toSorted() (and the no-array-sort disables below): the Hermes build on
// device may not have toSorted — it threw "undefined is not a function" when scanning.
/** Group OCR lines into visual rows by vertical-center overlap, then sort each row left→right. */
export function groupIntoRows(lines: OcrLine[]): string[] {
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts a copy; see note above
  const sorted = [...lines].sort((a, b) => a.top - b.top);
  const rows: { center: number; height: number; lines: OcrLine[] }[] = [];

  for (const line of sorted) {
    const center = (line.top + line.bottom) / 2;
    const height = Math.max(1, line.bottom - line.top);
    const row = rows.find((r) => Math.abs(r.center - center) < Math.min(r.height, height) * 0.6);
    if (row) {
      row.lines.push(line);
    } else {
      rows.push({ center, height, lines: [line] });
    }
  }

  rows.sort((a, b) => a.center - b.center);
  return rows
    .map((r) => {
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts a copy; see note above
      const rowLines = [...r.lines].sort((a, b) => a.left - b.left);
      return rowLines
        .map((l) => l.text.trim())
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    })
    .filter(Boolean);
}

/** Parse raw OCR lines into line items and the printed total, if any. */
export function parseReceipt(lines: OcrLine[]): ParsedReceipt {
  return parseReceiptRows(groupIntoRows(lines));
}
