/** Two totals closer than this are considered equal (absorbs floating-point noise). */
const TOTAL_TOLERANCE = 0.009;

/** Turn a price string into a number, handling HU/EU thousand and decimal separators. */
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
  if (s === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

/** Parse what the user typed into a price field. Anything unreadable becomes 0. */
export function parsePriceInput(text: string): number {
  return parsePrice(text.replace(/[^\d.,-]/g, '')) ?? 0;
}

/** Format a price for display, e.g. `12 999,5`. */
export function formatPrice(value: number): string {
  return value.toLocaleString('hu-HU', { maximumFractionDigits: 2 });
}

/** Format a price as the initial text of an editable field. Zero shows as an empty field. */
export function formatPriceInput(value: number): string {
  return value ? String(value).replace('.', ',') : '';
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
