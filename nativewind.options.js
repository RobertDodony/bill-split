/**
 * NativeWind compiler options, shared by Metro (metro.config.js) and the Jest setup
 * (jest/nativewind.globalSetup.js), so tests resolve classNames exactly like the app does.
 */
const nativewindOptions = {
  input: './src/global.css',
  // 1rem = 16px, so Tailwind's spacing scale maps to pixels as on the web (`p-4` = 16px).
  inlineRem: 16,
};

module.exports = { nativewindOptions };
