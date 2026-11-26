import { makeItem } from '@/test-utils/fixtures';
import {
  formatShare,
  pickActiveItem,
  snapShare,
  splitKey,
  splitPrice,
  summarizeSplit,
} from '@/utils/split';

describe('snapShare', () => {
  it.each([
    [30, 100 / 3],
    [33, 100 / 3],
    [37, 100 / 3],
    [46, 50],
    [54, 50],
    [63, 200 / 3],
    [70.5, 200 / 3],
  ])('jumps from %d to a nearby breakpoint', (raw, expected) => {
    expect(snapShare(raw)).toBeCloseTo(expected);
  });

  it.each([
    [10.4, 10],
    [28.6, 29],
    [38, 38],
    [45.4, 45],
    [55, 55],
    [62, 62],
    [71, 71],
    [96, 96],
  ])('rounds %d to a whole percent away from the breakpoints', (raw, expected) => {
    expect(snapShare(raw)).toBe(expected);
  });

  it('clamps to 0–100', () => {
    expect(snapShare(-20)).toBe(0);
    expect(snapShare(140)).toBe(100);
  });
});

describe('formatShare', () => {
  it('shows the thirds as fractions', () => {
    expect(formatShare(100 / 3)).toBe('1/3');
    expect(formatShare(200 / 3)).toBe('2/3');
    expect(formatShare(100 - 100 / 3)).toBe('2/3');
  });

  it('shows other shares as a whole percent', () => {
    expect(formatShare(50)).toBe('50%');
    expect(formatShare(33)).toBe('33%');
    expect(formatShare(45.4)).toBe('45%');
    expect(formatShare(0)).toBe('0%');
  });
});

describe('splitPrice', () => {
  it('splits by R’s share', () => {
    expect(splitPrice(1000, 50)).toEqual({ r: 500, k: 500 });
    expect(splitPrice(1000, 0)).toEqual({ r: 0, k: 1000 });
    expect(splitPrice(1000, 100)).toEqual({ r: 1000, k: 0 });
  });

  it('rounds to two decimals and still adds up to the price', () => {
    const { r, k } = splitPrice(599, 100 / 3);

    expect(r).toBe(199.67);
    expect(k).toBe(399.33);
    expect(r + k).toBeCloseTo(599);
  });
});

describe('splitKey', () => {
  it('ignores case and extra spaces', () => {
    expect(splitKey('  Kenyér   félbarna ')).toBe('KENYÉR FÉLBARNA');
    expect(splitKey('KENYÉR FÉLBARNA')).toBe('KENYÉR FÉLBARNA');
  });

  it('is empty for a blank name', () => {
    expect(splitKey('   ')).toBe('');
  });
});

describe('summarizeSplit', () => {
  it('adds up what R and K pay for the split items', () => {
    const items = [
      makeItem({ id: 1, price: 600, r_share: 50 }),
      makeItem({ id: 2, price: 900, r_share: 100 / 3 }),
      makeItem({ id: 3, price: 250, r_share: null }),
    ];

    expect(summarizeSplit(items)).toEqual({ itemCount: 3, splitCount: 2, r: 600, k: 900 });
  });

  it('is empty without items', () => {
    expect(summarizeSplit([])).toEqual({ itemCount: 0, splitCount: 0, r: 0, k: 0 });
  });
});

describe('pickActiveItem', () => {
  const items = [
    makeItem({ id: 1, r_share: 50 }),
    makeItem({ id: 2, r_share: null }),
    makeItem({ id: 3, r_share: null }),
  ];

  it('is the first item that isn’t split yet', () => {
    expect(pickActiveItem(items, null)).toBe(2);
  });

  it('is the selected item, even when it’s already split', () => {
    expect(pickActiveItem(items, 1)).toBe(1);
  });

  it('ignores a selected item that no longer exists', () => {
    expect(pickActiveItem(items, 99)).toBe(2);
  });

  it('is null when every item is split', () => {
    expect(pickActiveItem([makeItem({ r_share: 50 })], null)).toBeNull();
  });
});
