/** One line of recognized text with its bounding box, in image pixels. */
export type OcrLine = {
  text: string;
  top: number;
  bottom: number;
  left: number;
  right: number;
};
