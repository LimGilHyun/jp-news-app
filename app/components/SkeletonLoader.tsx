// Reanimated 4가 Expo Go SDK 54 환경에서 동작 안 하므로 정적 회색 박스로 대체
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme, Theme } from '../utils/theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle | ViewStyle[];
}

export function Skeleton({ width = '100%', height = 14, borderRadius = 8, style }: SkeletonProps) {
  const theme = useTheme();
  const baseColor = theme.isDark ? '#27272a' : '#e5e7eb';

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: baseColor,
          opacity: 0.7,
        },
        style,
      ]}
    />
  );
}

export function ArticleCardSkeleton() {
  const theme = useTheme();
  const styles = useStyles(theme);
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={160} borderRadius={0} />
      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Skeleton width={48} height={12} borderRadius={4} />
          <Skeleton width={32} height={16} borderRadius={4} />
        </View>
        <Skeleton width="92%" height={18} borderRadius={6} style={{ marginBottom: 6 }} />
        <Skeleton width="70%" height={14} borderRadius={6} style={{ marginBottom: 12 }} />
        <View style={styles.footerRow}>
          <Skeleton width={56} height={20} borderRadius={6} />
          <Skeleton width={56} height={20} borderRadius={6} />
          <Skeleton width={56} height={20} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

export function HeroCardSkeleton() {
  const theme = useTheme();
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 16,
        padding: 22,
        borderRadius: 24,
        backgroundColor: theme.colors.surface,
      }}
    >
      <Skeleton width={120} height={22} borderRadius={11} style={{ marginBottom: 12 }} />
      <Skeleton width={88} height={50} borderRadius={10} style={{ marginBottom: 8 }} />
      <Skeleton width={140} height={14} borderRadius={6} style={{ marginBottom: 14 }} />
      <Skeleton width="100%" height={6} borderRadius={3} />
    </View>
  );
}

const useStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
      ...theme.shadows.sm,
    },
    body: { padding: 16 },
    metaRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    footerRow: { flexDirection: 'row', gap: 8 },
  });
