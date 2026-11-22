const path = require('node:path');

/** Where the Jest global setup writes the compiled NativeWind styles for the test files to load. */
const COMPILED_STYLES_PATH = path.join(
  __dirname,
  '..',
  'node_modules',
  '.cache',
  'nativewind-jest',
  'styles.json'
);

module.exports = { COMPILED_STYLES_PATH };
