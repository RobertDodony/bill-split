import type { ReceiptItem } from '@/types/receipt';

/**
 * Splits are stored as R's share of an item's price, in percent (0–100). K pays the rest.
 */

/** The split an item starts with when nothing is remembered for it. */
export const DEFAULT_SHARE = 50;

/** Shares the slider jumps to when it's dragged close to them: a third, half, two thirds. */
export const SPLIT_BREAKPOINTS = [100 / 3, 50, 200 / 3] as const;

/** How close (in percentage points) the slider has to get to a breakpoint to jump to it. */
export const SNAP_DISTANCE = 4;

/** Clamps a share to 0–100 and snaps it to a nearby breakpoint, or else to a whole percent. */
export function snapShare(raw: number): number {
  const share = Math.min(100, Math.max(0, raw));
  const breakpoint = SPLIT_BREAKPOINTS.find((p) => Math.abs(share - p) <= SNAP_DISTANCE);
  return breakpoint ?? Math.round(share);
}

/** Shares shown as a fraction rather than a percent, since they'd round to an uneven 33% / 67%. */
const SHARE_FRACTIONS = [
  [100 / 3, '1/3'],
  [200 / 3, '2/3'],
] as const;

/** A share for display: `1/3` and `2/3` for the thirds, otherwise a whole percent like `45%`. */
export function formatShare(share: number): string {
  const fraction = SHARE_FRACTIONS.find(([value]) => Math.abs(share - value) < 0.01);
  if (fraction) {
    return fraction[1];
  }
  return `${Math.round(share)}%`;
}

const roundMoney = (value: number) => Math.round(value * 100) / 100;

/** What R and K each pay for a price, rounded to two decimals. Together they add up to the price. */
export function splitPrice(price: number, share: number): { r: number; k: number } {
  const r = roundMoney((price * share) / 100);
  return { r, k: roundMoney(price - r) };
}

/** The key a split is remembered under: the item name, ignoring case and extra spaces. */
export function splitKey(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toUpperCase();
}

export type SplitSummary = {
  itemCount: number;
  /** How many items have been split. */
  splitCount: number;
  /** What R pays for the split items. */
  r: number;
  /** What K pays for the split items. */
  k: number;
};

export function summarizeSplit(items: readonly ReceiptItem[]): SplitSummary {
  let r = 0;
  let k = 0;
  let splitCount = 0;
  for (const item of items) {
    if (item.r_share != null) {
      const amounts = splitPrice(item.price, item.r_share);
      r += amounts.r;
      k += amounts.k;
      splitCount += 1;
    }
  }
  return { itemCount: items.length, splitCount, r: roundMoney(r), k: roundMoney(k) };
}

/**
 * The item whose split is being edited: the one the user picked, or else the first item that
 * hasn't been split yet. `null` when every item is split.
 */
export function pickActiveItem(
  items: readonly ReceiptItem[],
  selectedId: number | null
): number | null {
  if (selectedId != null && items.some((i) => i.id === selectedId)) {
    return selectedId;
  }
  return items.find((i) => i.r_share == null)?.id ?? null;
}
