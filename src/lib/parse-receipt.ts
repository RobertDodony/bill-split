export type OcrLine = {
  text: string;
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type ParsedItem = { name: string; price: number };

export type ParsedReceipt = {
  items: ParsedItem[];
  detectedTotal?: number;
};

/** Rows whose text contains one of these are not line items. Compared without diacritics, uppercase. */
const SKIP_KEYWORDS = [
  'AFA',
  'ADOSZAM',
  'ADOSZ',
  'NYUGTA',
  'KESZPENZ',
  'BANKKARTYA',
  'KARTYA',
  'VISSZAJARO',
  'FIZETENDO',
  'RESZOSSZEG',
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
];

const TOTAL_KEYWORDS = ['OSSZESEN', 'OSSZEG', 'TOTAL', 'FIZETENDO'];

/**
 * A price at the end of a row: `1 299`, `1.299`, `1299,00`, `1 299 Ft`, `-150`, optionally
 * followed by a VAT code like `A`, `B00`, `C27`, `*`.
 */
const PRICE_AT_END =
  /(-?\d{1,3}(?:[ .]\d{3})+(?:,\d{1,2})?|-?\d+(?:[.,]\d{1,2})?)\s*(?:FT|HUF|EUR|€|\$)?\s*(?:[A-Z]\d{0,2}|\*)?\s*$/i;

/** True if `key` contains a keyword at the start of a word (so `HOTEL` doesn't match `TEL`). */
function hasKeyword(key: string, keywords: string[]) {
  return keywords.some((k) => new RegExp(`(^|[^A-Z])${k.replace('.', '\\.')}`).test(key));
}

function normalizeKeyword(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase();
}

/** Turn a matched price string into a number, handling HU/EU thousand and decimal separators. */
export function parsePrice(raw: string): number | undefined {
  let s = raw.replace(/\s/g, '');
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > -1 && lastDot > -1) {
    // Both present: the later one is the decimal separator.
    if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (lastComma > -1) {
    s = s.replace(',', '.');
  } else if (lastDot > -1 && /\.\d{3}$/.test(s)) {
    // `1.299` → thousands separator
    s = s.replace(/\./g, '');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

/** Group OCR lines into visual rows by vertical-center overlap, then sort each row left→right. */
export function groupIntoRows(lines: OcrLine[]): string[] {
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

  return rows
    .sort((a, b) => a.center - b.center)
    .map((r) =>
      r.lines
        .sort((a, b) => a.left - b.left)
        .map((l) => l.text.trim())
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(Boolean);
}

function splitRow(row: string): { name: string; price?: number } {
  const match = row.match(PRICE_AT_END);
  if (!match || match.index === undefined) return { name: row };
  const price = parsePrice(match[1]);
  const name = row
    .slice(0, match.index)
    .replace(/[\s.:*-]+$/, '')
    .trim();
  return { name, price };
}

function isMostlyLetters(text: string) {
  const letters = text.replace(/[^\p{L}]/gu, '').length;
  return letters >= 2 && letters >= text.replace(/\s/g, '').length * 0.4;
}

export function parseReceiptRows(rows: string[]): ParsedReceipt {
  const items: ParsedItem[] = [];
  let detectedTotal: number | undefined;
  let pendingName: string | undefined;

  for (const row of rows) {
    const key = normalizeKeyword(row);
    const { name, price } = splitRow(row);

    if (hasKeyword(key, TOTAL_KEYWORDS)) {
      if (price !== undefined && detectedTotal === undefined) detectedTotal = price;
      pendingName = undefined;
      continue;
    }
    if (hasKeyword(key, SKIP_KEYWORDS)) {
      pendingName = undefined;
      continue;
    }

    if (price === undefined) {
      // Name-only row; its price might be on the next row.
      pendingName = isMostlyLetters(row) ? row : undefined;
      continue;
    }

    if (name && isMostlyLetters(name)) {
      items.push({ name, price });
      pendingName = undefined;
    } else if (!name && pendingName) {
      // Wrapped receipt: price alone on the row below the name.
      items.push({ name: pendingName, price });
      pendingName = undefined;
    }
  }

  return { items, detectedTotal };
}

export function parseReceipt(lines: OcrLine[]): ParsedReceipt {
  return parseReceiptRows(groupIntoRows(lines));
}
