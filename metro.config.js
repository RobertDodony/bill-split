// https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const { nativewindOptions } = require('./nativewind.options');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, nativewindOptions);
