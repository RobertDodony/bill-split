/**
 * Runs before each test file: loads the styles compiled by `globalSetup.js` into the NativeWind
 * runtime.
 */
const fs = require('node:fs');

const { injectData } = require('react-native-css-interop/dist/runtime/native/styles');

const { COMPILED_STYLES_PATH } = require('./nativewindStyles');

injectData(JSON.parse(fs.readFileSync(COMPILED_STYLES_PATH, 'utf8')));

// The app registers React Native's core components (View, Text, …) for `className` on first
// render, but NativeWind skips that when NODE_ENV is "test", so do it here. Registering touches
// React Native's deprecated ImageBackground, which warns; that warning is not about our code.
const warn = console.warn;
console.warn = (message, ...args) => {
  if (typeof message === 'string' && message.startsWith('ImageBackground is deprecated')) return;
  warn(message, ...args);
};
require('react-native-css-interop/dist/runtime/components');
console.warn = warn;
