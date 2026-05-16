import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme, Theme } from '../../utils/theme';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
}

export function Donut({
  segments,
  size = 140,
  thickness = 14,
  centerLabel,
  centerSub,
}: DonutProps) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = Math.max(1, segments.reduce((s, x) => s + x.value, 0));

  let cumulative = 0;
  const arcs = segments.map((seg) => {
    const portion = seg.value / total;
    const dash = portion * circumference;
    const gap = circumference - dash;
    const offset = circumference * 0.25 - cumulative * circumference; // 12시 방향 시작
    cumulative += portion;
    return { ...seg, dash, gap, offset };
  });

  return (
    <View style={styles.wrap}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* 트랙 */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.surfaceMuted}
            strokeWidth={thickness}
            fill="transparent"
          />
          {arcs.map((arc, i) => (
            <Circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={arc.color}
              strokeWidth={thickness}
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={arc.offset}
              fill="transparent"
              strokeLinecap="butt"
            />
          ))}
        </Svg>
        {centerLabel != null && (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, styles.centerWrap]}
          >
            <Text style={styles.centerLabel}>{centerLabel}</Text>
            {centerSub != null && <Text style={styles.centerSub}>{centerSub}</Text>}
          </View>
        )}
      </View>

      <View style={styles.legend}>
        {segments.map((seg, i) => (
          <View key={i} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
            <Text style={styles.legendLabel}>{seg.label}</Text>
            <Text style={styles.legendValue}>{seg.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const useStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 18,
    },
    centerWrap: { alignItems: 'center', justifyContent: 'center' },
    centerLabel: {
      fontSize: 22,
      fontFamily: theme.fonts.numBlack,
      color: theme.colors.textPrimary,
      letterSpacing: -0.5,
    },
    centerSub: {
      fontSize: 10,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textTertiary,
      marginTop: 2,
    },
    legend: { flex: 1, gap: 6 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendLabel: {
      flex: 1,
      fontSize: 12,
      fontFamily: theme.fonts.bodyMedium,
      color: theme.colors.textSecondary,
    },
    legendValue: {
      fontSize: 13,
      fontFamily: theme.fonts.numBold,
      color: theme.colors.textPrimary,
    },
  });
