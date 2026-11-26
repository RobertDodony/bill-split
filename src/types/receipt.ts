/** One of the two people sharing the bills. */
export type Person = 'R' | 'K';

/** A row of the `receipts` table. */
export type Receipt = {
  id: number;
  created_at: number;
  image_uri: string | null;
  detected_total: number | null;
  /** Who paid the receipt. `null` until it's been set. */
  paid_by: Person | null;
  /** The settlement that closed the receipt. `null` while it's still open. */
  settlement_id: number | null;
};

/** A row of the `settlements` table: one settle-up that closed every receipt open at the time. */
export type Settlement = {
  id: number;
  /** When it was settled, in ms since epoch (shown with `formatDate`). */
  settled_at: number;
};

/** A receipt with aggregated item data, as shown in the history list. */
export type ReceiptSummary = Receipt & { item_count: number; items_total: number };

/** A row of the `items` table. */
export type ReceiptItem = {
  id: number;
  receipt_id: number;
  name: string;
  price: number;
  position: number;
  /** R's share of the price in percent (0–100); K pays the rest. `null` until it's been split. */
  r_share: number | null;
};

/** The user-editable fields of an item. */
export type ItemFields = Pick<ReceiptItem, 'name' | 'price'>;

/** The result of parsing OCR output into line items. */
export type ParsedReceipt = {
  items: ItemFields[];
  detectedTotal?: number;
};
