import type { ReceiptItem, ReceiptSummary, Settlement } from '@/types/receipt';
import { describeNet, describeSettlement, summarizeBalance } from '@/utils/balance';
import { formatDay } from '@/utils/date';

/** A group of receipts in the history list: the open ones, or one settlement's. */
export type HistorySection = {
  /** `open`, or the settlement's id. */
  key: string;
  title: string;
  /** Who owes whom for the open receipts, or who paid whom when they were settled. */
  summary: string;
  data: ReceiptSummary[];
};

/** Net balance of a group of receipts, with each receipt's items picked out of `items`. */
function netOf(receipts: readonly ReceiptSummary[], items: readonly ReceiptItem[]): number {
  return summarizeBalance(
    receipts.map((receipt) => ({
      paid_by: receipt.paid_by,
      items: items.filter((item) => item.receipt_id === receipt.id),
    }))
  ).net;
}

/**
 * Groups receipts for the history list: the open ones first, then one section per settlement.
 * Receipts and settlements keep the order they come in (newest first, from the db). Settlements
 * whose receipts have all been deleted are left out.
 */
export function groupHistory(
  receipts: readonly ReceiptSummary[],
  items: readonly ReceiptItem[],
  settlements: readonly Settlement[]
): HistorySection[] {
  const open = receipts.filter((receipt) => receipt.settlement_id == null);
  const openSection: HistorySection[] = open.length
    ? [{ key: 'open', title: 'Open', summary: describeNet(netOf(open, items)), data: open }]
    : [];

  const settledSections = settlements
    .map((settlement) => {
      const data = receipts.filter((receipt) => receipt.settlement_id === settlement.id);
      return {
        key: String(settlement.id),
        title: `Settled ${formatDay(settlement.settled_at)}`,
        summary: describeSettlement(netOf(data, items)),
        data,
      };
    })
    .filter((section) => section.data.length > 0);

  return [...openSection, ...settledSections];
}
