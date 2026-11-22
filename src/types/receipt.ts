/** A row of the `receipts` table. */
export type Receipt = {
  id: number;
  created_at: number;
  image_uri: string | null;
  detected_total: number | null;
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
};

/** The user-editable fields of an item. */
export type ItemFields = Pick<ReceiptItem, 'name' | 'price'>;

/** The result of parsing OCR output into line items. */
export type ParsedReceipt = {
  items: ItemFields[];
  detectedTotal?: number;
};
