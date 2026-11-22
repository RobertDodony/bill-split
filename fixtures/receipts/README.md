# Receipt fixtures

Real receipts used by `src/utils/parseReceipt.fixtures.test.ts`. Each receipt is a photo
(`<id>.jpg`) and a JSON file (`<id>.json`). The test picks up every JSON file in this folder
automatically.

```jsonc
{
  "description": "What makes this receipt interesting for the parser.",
  "image": "12681.jpg",
  // The receipt row by row, as printed. A row with columns (name, price, VAT code) is an array.
  "rows": ["ADÓSZÁM: 21588017-2-44", ["-----", "NYUGTA", "-----"], ["B00 Trappista light", "639"]],
  // Optional: raw OCR output captured from the app (see below).
  "ocrLines": [{ "text": "B00 Trappista light", "top": 812, "bottom": 850, "left": 210, "right": 690 }],
  // What the parser should return. The item prices must add up to the total.
  "expected": {
    "items": [{ "name": "Trappista light", "price": 639 }],
    "detectedTotal": 639
  }
}
```

For each receipt the test checks that:

- the expected items add up to the printed total (this catches transcription mistakes),
- the parser reads the expected result from `rows`,
- it reads the same from simulated OCR lines (columns split, photo slightly rotated),
- if `ocrLines` is present, it reads the same from that real OCR output.

## Adding a receipt

1. Copy the photo here as `<id>.jpg`.
2. Write `<id>.json` with the rows and the expected items and total.
3. Optionally, capture what ML Kit actually reads: start the dev server with
   `EXPO_PUBLIC_LOG_OCR=1 yarn expo start`, scan the photo in the app, and paste the JSON logged
   after `[scanReceipt] OCR lines:` into `ocrLines`.
4. Run `yarn test parseReceipt`.

The photos show real purchases, including payment terminal IDs. Don't add receipts you wouldn't
want in the repository.
