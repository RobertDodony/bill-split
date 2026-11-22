import { recognizeText as recognizeWithMLKit } from '@infinitered/react-native-mlkit-text-recognition';

import type { OcrLine } from '@/types/ocr';

/**
 * Runs on-device ML Kit text recognition (Latin script) and returns every line with its bounding
 * box, in pixels of the upright image: EXIF rotation is applied before recognition.
 *
 * `uri` must be a local `file://` URI.
 */
export async function recognizeText(uri: string): Promise<OcrLine[]> {
  const result = await recognizeWithMLKit(uri);
  const lines: OcrLine[] = [];
  for (const block of result.blocks) {
    for (const line of block.lines) {
      const { top, left, bottom, right } = line.frame;
      // A line ML Kit couldn't place comes back with an empty (all-zero) frame.
      if (right <= left || bottom <= top) {
        continue;
      }
      lines.push({ text: line.text, top, left, bottom, right });
    }
  }
  return lines;
}
