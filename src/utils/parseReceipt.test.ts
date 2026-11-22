import type { OcrLine } from '@/types/ocr';
import { groupIntoRows, parseReceipt, parseReceiptRows } from '@/utils/parseReceipt';

/** An OCR line of height 20 starting at `top`. */
const line = (text: string, top: number, left = 0): OcrLine => ({
  text,
  top,
  bottom: top + 20,
  left,
  right: left + text.length * 10,
});

const items = (rows: string[]) => parseReceiptRows(rows).items;

describe('groupIntoRows', () => {
  it('joins lines on the same visual row from left to right', () => {
    const rows = groupIntoRows([line('1 299', 12, 300), line('KENYÉR', 10, 0)]);
    expect(rows).toEqual(['KENYÉR 1 299']);
  });

  it('orders rows from top to bottom', () => {
    const rows = groupIntoRows([line('TEJ 329', 50), line('KENYÉR 599', 10), line('VAJ 899', 90)]);
    expect(rows).toEqual(['KENYÉR 599', 'TEJ 329', 'VAJ 899']);
  });

  it('keeps lines that only slightly overlap vertically on separate rows', () => {
    const rows = groupIntoRows([line('KENYÉR', 0), line('599', 15, 300)]);
    expect(rows).toEqual(['KENYÉR', '599']);
  });

  it('trims text, collapses whitespace and drops empty rows', () => {
    const rows = groupIntoRows([line('  KENYÉR   FÉLBARNA ', 0), line('   ', 50)]);
    expect(rows).toEqual(['KENYÉR FÉLBARNA']);
  });

  it('returns no rows for no lines', () => {
    expect(groupIntoRows([])).toEqual([]);
  });
});

describe('parseReceiptRows', () => {
  describe('where the items start', () => {
    it('ignores everything above the NYUGTA heading', () => {
      const result = parseReceiptRows([
        'LIDL MAGYARORSZÁG BT.',
        '1037 BUDAPEST RÁDL ÁROK 6',
        'ÜZLET: 333',
        '----- NYUGTA -----',
        'KENYÉR 599',
      ]);
      expect(result.items).toEqual([{ name: 'KENYÉR', price: 599 }]);
    });

    it('finds the heading in any case and despite one misread letter', () => {
      expect(items(['SHOP 1', 'Nyugta', 'KENYÉR 599'])).toEqual([{ name: 'KENYÉR', price: 599 }]);
      expect(items(['SHOP 1', '- NYUGIA -', 'KENYÉR 599'])).toEqual([
        { name: 'KENYÉR', price: 599 },
      ]);
      expect(items(['SHOP 1', 'NYUGT', 'KENYÉR 599'])).toEqual([{ name: 'KENYÉR', price: 599 }]);
    });

    it('does not mistake a similar word for the heading', () => {
      expect(items(['1066 Budapest Nyugati tér 1', 'KENYÉR 599'])).toEqual([
        { name: '1066 Budapest Nyugati tér', price: 1 },
        { name: 'KENYÉR', price: 599 },
      ]);
    });

    it('starts below the tax number when the heading is unreadable', () => {
      expect(items(['SHOP STREET 6', 'ADÓSZÁM: 21588017-2-44', 'KENYÉR 599'])).toEqual([
        { name: 'KENYÉR', price: 599 },
      ]);
    });

    it('reads every row when there is neither', () => {
      expect(items(['KENYÉR 599', 'TEJ 329'])).toHaveLength(2);
    });
  });

  describe('items', () => {
    it('reads names and prices', () => {
      expect(items(['KENYÉR 599', 'TEJ 2,8% 1L 329 B00', 'KÁVÉ 1 450 Ft'])).toEqual([
        { name: 'KENYÉR', price: 599 },
        { name: 'TEJ 2,8% 1L', price: 329 },
        { name: 'KÁVÉ', price: 1450 },
      ]);
    });

    it('reads decimal prices and discounts', () => {
      expect(items(['COFFEE 3,50 EUR', 'KEDVEZMÉNY -150', 'ENGEDMÉNY -552e C00'])).toEqual([
        { name: 'COFFEE', price: 3.5 },
        { name: 'KEDVEZMÉNY', price: -150 },
        { name: 'ENGEDMÉNY', price: -552 },
      ]);
    });

    it('strips the VAT code printed before the name, including common misreads', () => {
      const names = items([
        'B00 Trappista 639',
        'BOO Tej 329',
        'CO0 Vaj 899',
        '(00 Sajt 1299',
        'BŰ0 Alma 199',
      ]).map((i) => i.name);
      expect(names).toEqual(['Trappista', 'Tej', 'Vaj', 'Sajt', 'Alma']);
    });

    it('strips the VAT code printed after the price', () => {
      expect(items(['ISANA TUSFÜRDŐ 255 C00', 'ZEWA 2 760 COO', 'SAJT 1299 A'])).toEqual([
        { name: 'ISANA TUSFÜRDŐ', price: 255 },
        { name: 'ZEWA', price: 2760 },
        { name: 'SAJT', price: 1299 },
      ]);
    });

    it('strips markers, dot leaders and separators around the name', () => {
      const names = items(['! ISANA 255', 'KENYÉR ..... 599', 'VAJ: 899', 'SAJT * 1299']).map(
        (i) => i.name
      );
      expect(names).toEqual(['ISANA', 'KENYÉR', 'VAJ', 'SAJT']);
    });

    it('keeps a size at the end of a name as part of the name', () => {
      expect(items(['COCA COLA 0,5l', '459', 'PEPSI 1,5 L', '529'])).toEqual([
        { name: 'COCA COLA 0,5l', price: 459 },
        { name: 'PEPSI 1,5 L', price: 529 },
      ]);
    });

    it('joins a name with a price on the following row', () => {
      expect(items(['CSIRKEMELL FILÉ', '1 899'])).toEqual([
        { name: 'CSIRKEMELL FILÉ', price: 1899 },
      ]);
    });

    it('takes a weighed item’s price from the quantity row below its name', () => {
      expect(
        items([
          'C00 Banán kg',
          '0,712 KG * 399 Ft/KG 284',
          'C00 SZŐLŐ',
          '2,04 KG × 799 Ft/KG 1 630',
        ])
      ).toEqual([
        { name: 'Banán kg', price: 284 },
        { name: 'SZŐLŐ', price: 1630 },
      ]);
    });

    it('skips a quantity row that has no name above it', () => {
      expect(items(['2 DB X 255 Ft', 'ISANA 510'])).toEqual([{ name: 'ISANA', price: 510 }]);
    });

    it('skips article number lines, notes in brackets and column headings', () => {
      expect(
        items([
          'Menny. Me. Egységár Érték',
          'CIKKSZ M: 40471 1 DB X 255 Ft',
          'ISANA 255',
          'ENGEDMÉNY -50',
          '[11.02 A 20% ISANA]',
          '100',
        ])
      ).toEqual([
        { name: 'ISANA', price: 255 },
        { name: 'ENGEDMÉNY', price: -50 },
      ]);
    });

    it('skips tax, subtotal and other non-item rows', () => {
      expect(
        items([
          'KENYÉR 599',
          'RÉSZÖSSZEG 599',
          'ÁFA 27% 127',
          'KEREKÍTÉS -1',
          'AP A12345678',
          'TEL. 06 1 234 5678',
          'TEJ 329',
        ])
      ).toEqual([
        { name: 'KENYÉR', price: 599 },
        { name: 'TEJ', price: 329 },
      ]);
    });

    it('only matches skip keywords at the start of a word', () => {
      expect(items(['POSTCARD 300', 'CARD 300'])).toEqual([{ name: 'POSTCARD', price: 300 }]);
    });

    it('drops a wrapped name when a skipped row comes in between', () => {
      expect(items(['CSIRKEMELL', 'ÁFA', '1 899'])).toEqual([]);
    });

    it('drops rows whose name is mostly digits or symbols', () => {
      expect(items(['12345 678', '**** 100', '#1 200'])).toEqual([]);
    });

    it('does not carry a non-text row over as a wrapped name', () => {
      expect(items(['*****', '599'])).toEqual([]);
    });
  });

  describe('the total', () => {
    it('reads the total and ignores everything after it', () => {
      expect(
        parseReceiptRows(['KENYÉR 599', 'ÖSSZESEN: 928 Ft', 'Göngyöleg: 3 550 Ft', 'FIZETENDŐ 930'])
      ).toEqual({ items: [{ name: 'KENYÉR', price: 599 }], detectedTotal: 928 });
    });

    it('reads a total printed on the row below the keyword', () => {
      expect(parseReceiptRows(['KENYÉR 599', 'ÖSSZESEN:', '-------', '599 Ft'])).toEqual({
        items: [{ name: 'KENYÉR', price: 599 }],
        detectedTotal: 599,
      });
    });

    it('stops at a payment line when the total row was not readable', () => {
      expect(
        parseReceiptRows(['KENYÉR 599', 'WYZESEN; [01 Ft', 'VISA: 599 Ft', 'TID 1234 5678'])
      ).toEqual({
        items: [{ name: 'KENYÉR', price: 599 }],
        detectedTotal: undefined,
      });
      for (const payment of [
        'Bankkártya: 599',
        'KÉSZPÉNZ 1000',
        'Göngyöleg: 50 Ft',
        'MASTERCARD 599',
      ]) {
        expect(items(['KENYÉR 599', payment, 'TEJ 329'])).toEqual([{ name: 'KENYÉR', price: 599 }]);
      }
    });

    it('does not take a payment amount for the total', () => {
      expect(parseReceiptRows(['ÖSSZESEN:', 'BANKKÁRTYA: 599 Ft']).detectedTotal).toBeUndefined();
    });

    it('gives up on the total two rows below the keyword', () => {
      const result = parseReceiptRows([
        'KENYÉR 599',
        'ÖSSZESEN:',
        '-----',
        '-----',
        '599',
        'TEJ 329',
      ]);
      expect(result).toEqual({ items: [{ name: 'KENYÉR', price: 599 }], detectedTotal: undefined });
    });

    it('reads a later total keyword that has the amount', () => {
      expect(parseReceiptRows(['TOTAL', 'TOTAL 500']).detectedTotal).toBe(500);
    });

    it('only treats a keyword at the start of a row as the total', () => {
      expect(parseReceiptRows(['FOLYÉKONY TOTAL CLEAN 899']).items).toEqual([
        { name: 'FOLYÉKONY TOTAL CLEAN', price: 899 },
      ]);
    });

    it('is undefined without a total row', () => {
      expect(parseReceiptRows(['KENYÉR 599']).detectedTotal).toBeUndefined();
      expect(parseReceiptRows(['ÖSSZESEN']).detectedTotal).toBeUndefined();
    });
  });

  it('returns nothing for no rows', () => {
    expect(parseReceiptRows([])).toEqual({ items: [], detectedTotal: undefined });
  });
});

describe('parseReceipt', () => {
  it('groups OCR lines into rows and parses them', () => {
    const result = parseReceipt([
      line('ÖSSZESEN', 100, 0),
      line('928', 101, 300),
      line('KENYÉR', 20, 0),
      line('599', 21, 300),
      line('NYUGTA', 0, 100),
      line('TEJ', 60, 0),
      line('329', 59, 300),
    ]);
    expect(result).toEqual({
      items: [
        { name: 'KENYÉR', price: 599 },
        { name: 'TEJ', price: 329 },
      ],
      detectedTotal: 928,
    });
  });
});
