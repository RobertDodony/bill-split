/**
 * Native code that can't run under Jest.
 */

// ML Kit text recognition runs on the device only; its module looks up the native side as soon
// as it's imported. Tests that need OCR results set `recognizeText`'s return value themselves.
jest.mock('@infinitered/react-native-mlkit-text-recognition', () => ({
  recognizeText: jest.fn(),
}));

// The slider's JS wraps its events in native ones (`onRNCSliderValueChange`, …). Stand in a plain
// host element that carries the props as given, so tests can read `value` and fire `valueChange`
// / `slidingComplete` on it.
jest.mock('@react-native-community/slider', () => ({
  __esModule: true,
  default: (props) => require('react').createElement('Slider', props),
}));
