import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';

/** expo-image's `Image`, with `className` support. */
export const Image = cssInterop(ExpoImage, { className: 'style' });
