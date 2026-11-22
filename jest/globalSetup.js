/**
 * Compiles `src/global.css` with Tailwind and NativeWind once per test run, the same way Metro
 * does for the app, so `className`s resolve to real styles in tests.
 */
const fs = require('node:fs');
const path = require('node:path');

const { cssToReactNativeRuntimeOptions } = require('nativewind/dist/metro/common');
const postcss = require('postcss');
const { cssToReactNativeRuntime } = require('react-native-css-interop/css-to-rn');
const tailwindcss = require('tailwindcss');

const { nativewindOptions } = require('../nativewind.options');
const { COMPILED_STYLES_PATH } = require('./nativewindStyles');

module.exports = async function compileNativewindStyles() {
  const root = path.join(__dirname, '..');
  const input = path.resolve(root, nativewindOptions.input);

  // The NativeWind Tailwind preset emits native styles only when it knows the target OS.
  const previousOS = process.env.NATIVEWIND_OS;
  process.env.NATIVEWIND_OS = 'ios';
  try {
    const { css } = await postcss([
      tailwindcss({ config: path.join(root, 'tailwind.config.ts') }),
    ]).process(fs.readFileSync(input, 'utf8'), { from: input });

    const compiled = cssToReactNativeRuntime(css, {
      ...cssToReactNativeRuntimeOptions,
      inlineRem: nativewindOptions.inlineRem,
    });

    fs.mkdirSync(path.dirname(COMPILED_STYLES_PATH), { recursive: true });
    fs.writeFileSync(COMPILED_STYLES_PATH, JSON.stringify(compiled));
  } finally {
    process.env.NATIVEWIND_OS = previousOS;
  }
};
