/**
 * Native code that can't run under Jest.
 */

// NativeWind loads Reanimated. Use the mocks the packages ship (the same ones
// `expo-router/testing-library` uses).
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// ML Kit text recognition runs on the device only; its module looks up the native side as soon
// as it's imported. Tests that need OCR results set `recognizeText`'s return value themselves.
jest.mock('@infinitered/react-native-mlkit-text-recognition', () => ({
  recognizeText: jest.fn(),
}));
