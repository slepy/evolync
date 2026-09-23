module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // NOTE: `react-native-reanimated/plugin` has to be listed last.
      'react-native-reanimated/plugin',
    ],
    overrides: [
      {
        exclude: /node_modules/,
        plugins: [
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          ['@babel/plugin-transform-class-properties', { loose: true }],
        ],
      },
    ],
  };
};
