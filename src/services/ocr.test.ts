import {
  recognizeText as recognizeWithMLKit,
  type Rect,
  type Text,
  type TextLine,
} from '@infinitered/react-native-mlkit-text-recognition';

import { recognizeText } from '@/services/ocr';

jest.mock('@infinitered/react-native-mlkit-text-recognition', () => ({
  recognizeText: jest.fn(),
}));

const mlkit = jest.mocked(recognizeWithMLKit);

const frame = (left: number, top: number, right: number, bottom: number): Rect => ({
  left,
  top,
  right,
  bottom,
});

const textLine = (text: string, lineFrame: Rect): TextLine => ({
  text,
  frame: lineFrame,
  recognizedLanguages: [],
  elements: [],
});

/** An ML Kit result with one block per array of lines. */
const result = (...blocks: TextLine[][]): Text => ({
  text: '',
  blocks: blocks.map((lines) => ({
    text: '',
    frame: frame(0, 0, 0, 0),
    recognizedLanguages: [],
    lines,
  })),
});

describe('recognizeText', () => {
  it('returns every line of every block with its bounding box', async () => {
    mlkit.mockResolvedValue(
      result(
        [textLine('KENYÉR', frame(10, 20, 110, 50)), textLine('599', frame(300, 22, 340, 52))],
        [textLine('ÖSSZESEN', frame(10, 80, 70, 105))]
      )
    );

    const lines = await recognizeText('file:///documents/receipts/1.jpg');

    expect(mlkit).toHaveBeenCalledWith('file:///documents/receipts/1.jpg');
    expect(lines).toEqual([
      { text: 'KENYÉR', top: 20, left: 10, bottom: 50, right: 110 },
      { text: '599', top: 22, left: 300, bottom: 52, right: 340 },
      { text: 'ÖSSZESEN', top: 80, left: 10, bottom: 105, right: 70 },
    ]);
  });

  it('skips lines without a bounding box', async () => {
    mlkit.mockResolvedValue(
      result([
        textLine('no box', frame(0, 0, 0, 0)),
        textLine('flat', frame(10, 10, 50, 10)),
        textLine('ok', frame(0, 0, 10, 10)),
      ])
    );

    expect((await recognizeText('file:///r.jpg')).map((l) => l.text)).toEqual(['ok']);
  });

  it('returns no lines when no text is found', async () => {
    mlkit.mockResolvedValue(result());

    expect(await recognizeText('file:///blank.jpg')).toEqual([]);
  });

  it('fails when recognition fails', async () => {
    mlkit.mockRejectedValue(new Error('RNMLKitTextRecognitionModule - Error: bad image'));

    await expect(recognizeText('file:///broken.jpg')).rejects.toThrow('bad image');
  });
});
