module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Rewrites `react-native-paper` imports to the components actually used, to keep the bundle small.
    env: { production: { plugins: ['react-native-paper/babel'] } },
  };
};
