import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { useTheme, Theme } from '../../utils/theme';

export interface BarDatum {
  label: string;
  value: number;
  isToday?: boolean;
}

interface BarChartProps {
  data: BarDatum[];
  height?: number;
  goalLine?: number;
  showValues?: boolean;
  compact?: boolean;
}

export function BarChart({
  data,
  height = 180,
  goalLine,
  showValues = true,
  compact = false,
}: BarChartProps) {
  const theme = useTheme();
  const styles = useStyles(theme);

  const { maxVal, normalizedGoal } = useMemo(() => {
    const valueMax = Math.max(0, ...data.map((d) => d.value));
    const candidate = goalLine != null ? Math.max(valueMax, goalLine) : valueMax;
    const padded = candidate === 0 ? 10 : Math.ceil(candidate * 1.15);
    return {
      maxVal: padded,
      normalizedGoal: goalLine != null ? goalLine / padded : null,
    };
  }, [data, goalLine]);

  const containerHeight = height + 28;

  return (
    <View style={[styles.wrap, { height: containerHeight }]}>
      <View style={[styles.barsRow, { height }]}>
        {data.map((d, i) => {
          const ratio = maxVal === 0 ? 0 : d.value / maxVal;
          const barHeight = Math.max(d.value > 0 ? 4 : 0, ratio * (height - 24));
          const fillColor = d.isToday
            ? theme.colors.primary
            : theme.colors.borderStrong;
          return (
            <View key={i} style={styles.barCol}>
              {showValues && d.value > 0 && (
                <Text
                  style={[
                    styles.barValue,
                    d.isToday && { color: theme.colors.primary },
                  ]}
                  numberOfLines={1}
                >
                  {d.value}
                </Text>
              )}
              <View
                style={{
                  width: compact ? 8 : 14,
                  height: barHeight,
                  borderRadius: compact ? 4 : 6,
                  backgroundColor: fillColor,
                }}
              />
            </View>
          );
        })}

        {normalizedGoal != null && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: (1 - normalizedGoal) * (height - 24) + 18,
              height: 1,
              borderTopWidth: 1,
              borderTopColor: theme.colors.warning,
              borderStyle: 'dashed',
            }}
          />
        )}
      </View>
      <View style={styles.labelsRow}>
        {data.map((d, i) => (
          <Text
            key={i}
            style={[
              styles.barLabel,
              d.isToday && { color: theme.colors.primary, fontFamily: theme.fonts.bodyBold },
            ]}
            numberOfLines={1}
          >
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const useStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: { width: '100%' },
    barsRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
    },
    barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
    barValue: {
      fontSize: 9,
      fontFamily: theme.fonts.numBold,
      color: theme.colors.textSecondary,
    },
    labelsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 6,
      paddingHorizontal: 4,
    },
    barLabel: {
      flex: 1,
      textAlign: 'center',
      fontSize: 9,
      fontFamily: theme.fonts.bodyMedium,
      color: theme.colors.textTertiary,
    },
  });
