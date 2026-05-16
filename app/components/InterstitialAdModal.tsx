import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';

import { useTheme, Theme } from '../utils/theme';

const CLOSE_DELAY_MS = 3000; // 광고 표시 후 닫기 활성화까지 대기 시간 (실제 인터스티셜 표준)

/**
 * 전면 인터스티셜 광고 placeholder.
 *
 * Expo Go에서는 실제 AdMob 인터스티셜 사용 불가 (네이티브 모듈 필요).
 * 프로덕션 dev build에서는 react-native-google-mobile-ads의 InterstitialAd로 교체.
 *
 * 교체 위치: 이 파일의 placeholder UI를 InterstitialAd.show() 호출로 변경하고
 *  visible/onClose 처리만 그대로 유지하면 됨.
 */
export function InterstitialAdModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const [closableAfter, setClosableAfter] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const opened = Date.now();
    setClosableAfter(opened + CLOSE_DELAY_MS);
    const tick = setInterval(() => {
      // 강제 리렌더로 닫기 버튼 활성화 시점 갱신
      setClosableAfter((prev) => prev);
    }, 500);
    return () => clearInterval(tick);
  }, [visible]);

  const now = Date.now();
  const remainSec = Math.max(0, Math.ceil((closableAfter - now) / 1000));
  const canClose = remainSec === 0;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={canClose ? onClose : undefined}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>광고</Text>
          <Pressable
            onPress={canClose ? onClose : undefined}
            style={[styles.closeBtn, !canClose && styles.closeBtnDisabled]}
            hitSlop={8}
          >
            {canClose ? (
              <X size={18} color={theme.colors.textPrimary} strokeWidth={2.4} />
            ) : (
              <Text style={styles.countdown}>{remainSec}</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>광고 영역</Text>
          <Text style={styles.sub}>
            {Platform.OS === 'web'
              ? 'Web 환경에서는 광고가 표시되지 않습니다.'
              : 'AdMob 인터스티셜은 dev build 후 활성화됩니다.'}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            앱이 닫혔다가 다시 열릴 때 표시되는 placeholder입니다.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bg,
      paddingTop: Platform.OS === 'android' ? 28 : 56,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerLabel: {
      fontSize: 11,
      fontFamily: theme.fonts.numBold,
      color: theme.colors.textTertiary,
      letterSpacing: 1.6,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeBtnDisabled: { opacity: 0.5 },
    countdown: {
      fontSize: 13,
      fontFamily: theme.fonts.numBlack,
      color: theme.colors.textSecondary,
    },
    body: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingHorizontal: 24,
    },
    title: {
      fontSize: theme.fs(20),
      fontFamily: theme.fonts.bodyBlack,
      color: theme.colors.textPrimary,
    },
    sub: {
      fontSize: theme.fs(12),
      fontFamily: theme.fonts.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    footer: {
      paddingHorizontal: 24,
      paddingVertical: 24,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 11,
      fontFamily: theme.fonts.body,
      color: theme.colors.textTertiary,
      textAlign: 'center',
    },
  });
