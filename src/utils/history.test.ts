import { makeItem, makeReceiptSummary } from '@/test-utils/fixtures';
import { groupHistory } from '@/utils/history';

const DAY = 24 * 60 * 60 * 1000;
const NOV_3 = new Date(2026, 10, 3).getTime();
const NOV_26 = new Date(2026, 10, 26).getTime();

describe('groupHistory', () => {
  it('puts open receipts first, then each settlement in the order given', () => {
    const receipts = [
      makeReceiptSummary({ id: 4, settlement_id: null }),
      makeReceiptSummary({ id: 3, settlement_id: 2 }),
      makeReceiptSummary({ id: 2, settlement_id: 1 }),
      makeReceiptSummary({ id: 1, settlement_id: 1 }),
    ];
    const settlements = [
      { id: 2, settled_at: NOV_26 },
      { id: 1, settled_at: NOV_3 },
    ];

    const sections = groupHistory(receipts, [], settlements);

    expect(sections.map((s) => [s.key, s.title, s.data.map((r) => r.id)])).toEqual([
      ['open', 'Open', [4]],
      ['2', 'Settled 2026. 11. 26.', [3]],
      ['1', 'Settled 2026. 11. 03.', [2, 1]],
    ]);
  });

  it('says who owes whom for the open receipts', () => {
    const receipts = [makeReceiptSummary({ id: 1, paid_by: 'R', settlement_id: null })];
    const items = [makeItem({ receipt_id: 1, price: 1000, r_share: 25 })];

    const [open] = groupHistory(receipts, items, []);

    expect(open?.summary).toBe('K owes R 750');
  });

  it('says who paid whom for each settlement, from its own receipts only', () => {
    const receipts = [
      makeReceiptSummary({ id: 2, paid_by: 'K', settlement_id: 2 }),
      makeReceiptSummary({ id: 1, paid_by: 'R', settlement_id: 1 }),
    ];
    const items = [
      makeItem({ id: 1, receipt_id: 1, price: 1000, r_share: 50 }),
      makeItem({ id: 2, receipt_id: 2, price: 900, r_share: 100 / 3 }),
    ];
    const settlements = [
      { id: 2, settled_at: NOV_3 + DAY },
      { id: 1, settled_at: NOV_3 },
    ];

    const sections = groupHistory(receipts, items, settlements);

    expect(sections.map((s) => s.summary)).toEqual(['R paid K 300', 'K paid R 500']);
  });

  it('has no open section when everything is settled', () => {
    const receipts = [makeReceiptSummary({ id: 1, settlement_id: 1 })];

    const sections = groupHistory(receipts, [], [{ id: 1, settled_at: NOV_3 }]);

    expect(sections.map((s) => s.key)).toEqual(['1']);
  });

  it('leaves out a settlement whose receipts were all deleted', () => {
    const receipts = [makeReceiptSummary({ id: 1, settlement_id: 1 })];
    const settlements = [
      { id: 2, settled_at: NOV_26 },
      { id: 1, settled_at: NOV_3 },
    ];

    expect(groupHistory(receipts, [], settlements).map((s) => s.key)).toEqual(['1']);
  });

  it('is empty without receipts', () => {
    expect(groupHistory([], [], [])).toEqual([]);
  });
});
