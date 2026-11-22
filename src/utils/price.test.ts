import {
  formatPrice,
  formatPriceInput,
  parsePrice,
  parsePriceInput,
  sumPrices,
  totalsDiffer,
} from '@/utils/price';

/** `toLocaleString('hu-HU')` groups with a (narrow) no-break space; compare with plain spaces. */
const plainSpaces = (s: string) => s.replace(/\s/g, ' ');

describe('parsePrice', () => {
  it.each([
    ['1299', 1299],
    ['1 299', 1299],
    ['1.299', 1299],
    ['12 345 678', 12345678],
    ['1299,50', 1299.5],
    ['1.299,50', 1299.5],
    ['1,299.50', 1299.5],
    ['12.5', 12.5],
    ['0,99', 0.99],
    ['-150', -150],
  ])('parses %p as %p', (raw, expected) => {
    expect(parsePrice(raw)).toBe(expected);
  });

  it.each(['', '   ', 'abc', '-', '1,2,3'])('returns undefined for %p', (raw) => {
    expect(parsePrice(raw)).toBeUndefined();
  });
});

describe('parsePriceInput', () => {
  it('ignores currency and other non-numeric characters', () => {
    expect(parsePriceInput('1 299 Ft')).toBe(1299);
    expect(parsePriceInput('€12,5')).toBe(12.5);
  });

  it('falls back to 0 for unreadable input', () => {
    expect(parsePriceInput('')).toBe(0);
    expect(parsePriceInput('free')).toBe(0);
  });
});

describe('formatPrice', () => {
  it('formats with Hungarian separators', () => {
    expect(plainSpaces(formatPrice(12999.5))).toBe('12 999,5');
    expect(plainSpaces(formatPrice(1234567))).toBe('1 234 567');
  });

  it('rounds to at most two decimals', () => {
    expect(formatPrice(1.239)).toBe('1,24');
    expect(formatPrice(599)).toBe('599');
  });
});

describe('formatPriceInput', () => {
  it('uses a decimal comma', () => {
    expect(formatPriceInput(12.5)).toBe('12,5');
    expect(formatPriceInput(599)).toBe('599');
  });

  it('shows zero as an empty field', () => {
    expect(formatPriceInput(0)).toBe('');
  });
});

describe('sumPrices', () => {
  it('adds up item prices', () => {
    expect(sumPrices([{ price: 599 }, { price: 329.5 }, { price: -50 }])).toBe(878.5);
  });

  it('is 0 for no items', () => {
    expect(sumPrices([])).toBe(0);
  });
});

describe('totalsDiffer', () => {
  it('is false when no total was detected', () => {
    expect(totalsDiffer(null, 100)).toBe(false);
    expect(totalsDiffer(undefined, 100)).toBe(false);
  });

  it('is false when the totals match, ignoring floating-point noise', () => {
    expect(totalsDiffer(100, 100)).toBe(false);
    expect(totalsDiffer(0.3, 0.1 + 0.2)).toBe(false);
  });

  it('is true when the totals differ', () => {
    expect(totalsDiffer(100, 99)).toBe(true);
    expect(totalsDiffer(0, 5)).toBe(true);
    expect(totalsDiffer(10, 10.01)).toBe(true);
  });
});
