/** Two totals closer than this are considered equal (absorbs floating-point noise). */
const TOTAL_TOLERANCE = 0.009;

/** Groups thousands in displayed prices. A no-break space, so an amount never wraps. */
const THOUSANDS_SEPARATOR = ' ';

/** Every position in a run of digits that has a multiple of three digits after it. */
const THOUSANDS_BOUNDARY = /\B(?=(\d{3})+(?!\d))/g;

/** Turn a price string into a number, handling HU/EU thousand and decimal separators. */
export function parsePrice(raw: string): number | undefined {
  let s = raw.replace(/\s/g, '');
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > -1 && lastDot > -1) {
    // Both present: the later one is the decimal separator.
    if (lastComma > lastDot) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (lastComma > -1) {
    s = s.replace(',', '.');
  } else if (lastDot > -1 && /\.\d{3}$/.test(s)) {
    // `1.299` → thousands separator
    s = s.replace(/\./g, '');
  }
  if (s === '') {
    return undefined;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

/** Parse what the user typed into a price field. Anything unreadable becomes 0. */
export function parsePriceInput(text: string): number {
  return parsePrice(text.replace(/[^\d.,-]/g, '')) ?? 0;
}

/** Format a price for display, e.g. `4 550` or `12 999,5`. */
export function formatPrice(value: number): string {
  // hu-HU only groups from five digits up (4550 but 12 999). `useGrouping: 'always'` would fix
  // that, but engines disagree on it, so the grouping is added here the same way everywhere.
  const plain = value.toLocaleString('hu-HU', { maximumFractionDigits: 2, useGrouping: false });
  return plain.replace(THOUSANDS_BOUNDARY, THOUSANDS_SEPARATOR);
}

/** Format a price as the initial text of an editable field. Zero shows as an empty field. */
export function formatPriceInput(value: number): string {
  return value ? String(value).replace('.', ',') : '';
}

/** Rounds an amount to two decimals, so sums like 0.1 + 0.2 come out as 0.3. */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function sumPrices(items: readonly { price: number }[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

/** True when the total printed on the receipt doesn't match the sum of its items. */
export function totalsDiffer(
  detectedTotal: number | null | undefined,
  itemsTotal: number
): boolean {
  return detectedTotal != null && Math.abs(detectedTotal - itemsTotal) > TOTAL_TOLERANCE;
}
