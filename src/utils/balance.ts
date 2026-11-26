import type { Person, ReceiptItem } from '@/types/receipt';
import { formatPrice, roundMoney } from '@/utils/price';
import { summarizeSplit } from '@/utils/split';

/** A net amount smaller than this (half a fillér) counts as nobody owing anything. */
const SQUARE_TOLERANCE = 0.005;

/** A receipt as the balance sees it: who paid for it, and its items with their splits. */
export type BalanceReceipt = {
  paid_by: Person | null;
  items: readonly ReceiptItem[];
};

export type BalanceSummary = {
  receiptCount: number;
  /** How many receipts are ready to settle (see `isReceiptComplete`). */
  completeCount: number;
  /** R's part of every split item. */
  r: number;
  /** K's part of every split item. */
  k: number;
  /**
   * What K owes R: positive when K owes R, negative when R owes K. Receipts without a payer
   * don't count, since nobody can owe anything for them yet.
   */
  net: number;
};

/** True when a receipt can be settled: someone paid for it and every item is split. */
export function isReceiptComplete(receipt: BalanceReceipt): boolean {
  return receipt.paid_by != null && receipt.items.every((item) => item.r_share != null);
}

/**
 * Adds up R's and K's parts across receipts and works out who owes whom. Whoever paid a receipt
 * is owed the other person's part of it.
 */
export function summarizeBalance(receipts: readonly BalanceReceipt[]): BalanceSummary {
  let r = 0;
  let k = 0;
  let net = 0;
  let completeCount = 0;

  for (const receipt of receipts) {
    const split = summarizeSplit(receipt.items);
    r += split.r;
    k += split.k;
    if (receipt.paid_by === 'R') {
      net += split.k;
    } else if (receipt.paid_by === 'K') {
      net -= split.r;
    }
    if (isReceiptComplete(receipt)) {
      completeCount += 1;
    }
  }

  return {
    receiptCount: receipts.length,
    completeCount,
    r: roundMoney(r),
    k: roundMoney(k),
    net: roundMoney(net),
  };
}

/** True when there's something open and every open receipt is complete. */
export function canSettle(summary: BalanceSummary): boolean {
  return summary.receiptCount > 0 && summary.completeCount === summary.receiptCount;
}

function describeTransfer(net: number, verb: 'owes' | 'paid'): string {
  if (Math.abs(net) < SQUARE_TOLERANCE) {
    return 'All square';
  }
  return net > 0 ? `K ${verb} R ${formatPrice(net)}` : `R ${verb} K ${formatPrice(-net)}`;
}

/** Who owes whom, in words: `K owes R 4 550`, `R owes K 300` or `All square`. */
export function describeNet(net: number): string {
  return describeTransfer(net, 'owes');
}

/** Who paid whom when a settlement was made: `K paid R 4 550`, `R paid K 300` or `All square`. */
export function describeSettlement(net: number): string {
  return describeTransfer(net, 'paid');
}
