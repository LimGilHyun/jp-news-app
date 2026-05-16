import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useTheme, Theme } from '../utils/theme';

export const AD_BANNER_HEIGHT = 56;

/**
 * 광고 배너 placeholder.
 *
 * Expo Go 환경에서는 실제 AdMob 사용 불가 (네이티브 모듈 필요).
 * 프로덕션에서는 react-native-google-mobile-ads 또는 expo-ads-admob 으로 교체.
 *
 * 교체 방법:
 *   1. 패키지 설치: npx expo install react-native-google-mobile-ads
 *   2. app.json plugin 추가
 *   3. EAS build / dev client 빌드 (Expo Go 불가)
 *   4. 이 컴포넌트의 placeholder 를 BannerAd 로 교체
 */
export function AdBanner() {
  const theme = useTheme();
  const styles = useStyles(theme);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>광고 영역</Text>
      <Text style={styles.hint}>
        {Platform.OS === 'web' ? 'Web' : 'AdMob 연동은 dev build 후 활성화'}
      </Text>
    </View>
  );
}

const useStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: {
      height: AD_BANNER_HEIGHT,
      backgroundColor: theme.isDark ? '#000' : '#f4f4f5',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    label: {
      fontSize: 12,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textTertiary,
      letterSpacing: 0.4,
    },
    hint: {
      fontSize: 10,
      fontFamily: theme.fonts.body,
      color: theme.colors.textTertiary,
    },
  });
