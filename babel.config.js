module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated plugin 제거: 우리 코드는 worklet 사용 안 함 (Expo Go SDK 54 호환성)
  };
};
