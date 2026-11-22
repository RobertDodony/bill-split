import TextRecognition from '@react-native-ml-kit/text-recognition';

import type { OcrLine } from '@/lib/parse-receipt';

/** Runs on-device ML Kit text recognition and returns every line with its bounding box. */
export async function recognizeReceipt(uri: string): Promise<OcrLine[]> {
  const result = await TextRecognition.recognize(uri);
  const lines: OcrLine[] = [];
  for (const block of result.blocks) {
    for (const line of block.lines) {
      if (!line.frame) continue;
      const { top, left, width, height } = line.frame;
      lines.push({ text: line.text, top, left, bottom: top + height, right: left + width });
    }
  }
  return lines;
}
