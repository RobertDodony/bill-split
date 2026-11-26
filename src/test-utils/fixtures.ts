import type { Receipt, ReceiptItem, ReceiptSummary } from '@/types/receipt';

/** A fixed local time, so formatted dates are the same in every timezone: 2026. 01. 05. 14:03 */
export const CREATED_AT = new Date(2026, 0, 5, 14, 3).getTime();

export function makeReceipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    id: 1,
    created_at: CREATED_AT,
    image_uri: 'file:///documents/receipts/1.jpg',
    detected_total: null,
    ...overrides,
  };
}

export function makeReceiptSummary(overrides: Partial<ReceiptSummary> = {}): ReceiptSummary {
  return { ...makeReceipt(), item_count: 2, items_total: 1500, ...overrides };
}

export function makeItem(overrides: Partial<ReceiptItem> = {}): ReceiptItem {
  return {
    id: 1,
    receipt_id: 1,
    name: 'Kenyér',
    price: 599,
    position: 0,
    r_share: null,
    ...overrides,
  };
}
