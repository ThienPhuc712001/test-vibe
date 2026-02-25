const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@': './src',
};

config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

module.exports = config;