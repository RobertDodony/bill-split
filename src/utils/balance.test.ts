import { makeItem } from '@/test-utils/fixtures';
import type { Person, ReceiptItem } from '@/types/receipt';
import { canSettle, describeNet, isReceiptComplete, summarizeBalance } from '@/utils/balance';

const receipt = (paidBy: Person | null, items: ReceiptItem[]) => ({ paid_by: paidBy, items });

/** `formatPrice` groups thousands with a no-break space; compare with plain spaces. */
const plainSpaces = (s: string) => s.replace(/\s/g, ' ');

describe('summarizeBalance', () => {
  it('is all zeros without receipts', () => {
    expect(summarizeBalance([])).toEqual({ receiptCount: 0, completeCount: 0, r: 0, k: 0, net: 0 });
  });

  it('has K owe R their part of a receipt R paid', () => {
    const summary = summarizeBalance([receipt('R', [makeItem({ price: 1000, r_share: 50 })])]);

    expect(summary).toEqual({ receiptCount: 1, completeCount: 1, r: 500, k: 500, net: 500 });
  });

  it('has R owe K their part of a receipt K paid', () => {
    const summary = summarizeBalance([receipt('K', [makeItem({ price: 900, r_share: 100 / 3 })])]);

    expect(summary).toMatchObject({ r: 300, k: 600, net: -300 });
  });

  it('nets out receipts paid by different people', () => {
    const summary = summarizeBalance([
      receipt('R', [
        makeItem({ id: 1, price: 1000, r_share: 50 }),
        makeItem({ id: 2, price: 400, r_share: 100 }),
      ]),
      receipt('K', [makeItem({ id: 3, price: 900, r_share: 100 / 3 })]),
    ]);

    // K owes R 500 for the first receipt, R owes K 300 for the second.
    expect(summary).toMatchObject({
      receiptCount: 2,
      completeCount: 2,
      r: 1200,
      k: 1100,
      net: 200,
    });
  });

  it('counts a receipt without a payer in the totals but not in what is owed', () => {
    const summary = summarizeBalance([receipt(null, [makeItem({ price: 1000, r_share: 50 })])]);

    expect(summary).toEqual({ receiptCount: 1, completeCount: 0, r: 500, k: 500, net: 0 });
  });

  it('leaves unsplit items out of the totals', () => {
    const summary = summarizeBalance([
      receipt('R', [
        makeItem({ id: 1, price: 1000, r_share: 50 }),
        makeItem({ id: 2, price: 700, r_share: null }),
      ]),
    ]);

    expect(summary).toEqual({ receiptCount: 1, completeCount: 0, r: 500, k: 500, net: 500 });
  });

  it('rounds away floating-point noise', () => {
    const summary = summarizeBalance([
      receipt('R', [makeItem({ id: 1, price: 0.1, r_share: 0 })]),
      receipt('R', [makeItem({ id: 2, price: 0.2, r_share: 0 })]),
    ]);

    expect(summary).toMatchObject({ k: 0.3, net: 0.3 });
  });
});

describe('isReceiptComplete', () => {
  it('needs a payer', () => {
    expect(isReceiptComplete(receipt(null, [makeItem({ r_share: 50 })]))).toBe(false);
  });

  it('needs every item split', () => {
    expect(
      isReceiptComplete(
        receipt('K', [makeItem({ id: 1, r_share: 50 }), makeItem({ id: 2, r_share: null })])
      )
    ).toBe(false);
  });

  it('is true once paid for and fully split', () => {
    expect(isReceiptComplete(receipt('R', [makeItem({ r_share: 0 })]))).toBe(true);
  });

  it('is true for a receipt with no items once it has a payer', () => {
    expect(isReceiptComplete(receipt('K', []))).toBe(true);
  });
});

describe('canSettle', () => {
  const summary = { receiptCount: 3, completeCount: 3, r: 0, k: 0, net: 0 };

  it('is true when every open receipt is complete', () => {
    expect(canSettle(summary)).toBe(true);
  });

  it('is false while a receipt is unfinished', () => {
    expect(canSettle({ ...summary, completeCount: 2 })).toBe(false);
  });

  it('is false with nothing open', () => {
    expect(canSettle({ ...summary, receiptCount: 0, completeCount: 0 })).toBe(false);
  });
});

describe('describeNet', () => {
  it('says K owes R when the net is positive', () => {
    expect(plainSpaces(describeNet(4550))).toBe('K owes R 4 550');
  });

  it('says R owes K when the net is negative', () => {
    expect(describeNet(-300.5)).toBe('R owes K 300,5');
  });

  it('says all square at zero, including floating-point leftovers', () => {
    expect(describeNet(0)).toBe('All square');
    expect(describeNet(-0.001)).toBe('All square');
  });
});
