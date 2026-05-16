import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { Play, Pause, Square, Gauge, Volume2, VolumeX } from 'lucide-react-native';

import { useTheme, Theme } from '../utils/theme';

export type TTSState = 'idle' | 'playing' | 'paused';

interface TTSPlayerProps {
  state: TTSState;
  currentIdx: number;
  totalCount: number;
  estimatedSeconds: number;
  elapsedSec: number;             // 실시간 누적 초 (200ms 간격으로 업데이트됨)
  rate: number;
  volume: number;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSeek: (idx: number) => void;
  onSeekSec?: (sec: number) => void; // 슬라이더로 초 기반 시크
  onChangeRate: (r: number) => void;
  onChangeVolume: (v: number) => void;
}

const RATES = [0.75, 1.0, 1.25, 1.5];

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TTSPlayer({
  state,
  currentIdx,
  totalCount,
  estimatedSeconds,
  elapsedSec,
  rate,
  volume,
  onPlay,
  onPause,
  onResume,
  onStop,
  onSeek,
  onSeekSec,
  onChangeRate,
  onChangeVolume,
}: TTSPlayerProps) {
  const theme = useTheme();
  const styles = useStyles(theme);

  if (state === 'idle' || totalCount === 0) return null;

  const currentSec = Math.min(elapsedSec, estimatedSeconds);
  const isPlaying = state === 'playing';

  const cycleRate = () => {
    Haptics.selectionAsync().catch(() => {});
    const idx = RATES.indexOf(rate);
    const next = RATES[(idx + 1) % RATES.length] ?? 1.0;
    onChangeRate(next);
  };

  return (
    <View style={styles.container}>
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(currentSec)}</Text>
        <Text style={styles.indexText}>
          {currentIdx + 1} / {totalCount}
        </Text>
        <Text style={styles.timeText}>{formatTime(estimatedSeconds)}</Text>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={Math.max(1, estimatedSeconds)}
        value={currentSec}
        onSlidingComplete={(v) => {
          Haptics.selectionAsync().catch(() => {});
          if (onSeekSec) onSeekSec(v);
          else onSeek(Math.round((v / estimatedSeconds) * (totalCount - 1)));
        }}
        minimumTrackTintColor={theme.colors.primary}
        maximumTrackTintColor={theme.colors.border}
        thumbTintColor={theme.colors.primary}
      />

      <View style={styles.controlsRow}>
        <Pressable onPress={cycleRate} style={styles.iconBtn} hitSlop={6}>
          <Gauge size={16} color={theme.colors.textSecondary} strokeWidth={2.4} />
          <Text style={styles.rateText}>{rate}x</Text>
        </Pressable>

        <View style={styles.mainControls}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onStop();
            }}
            style={styles.iconBtn}
            hitSlop={6}
          >
            <Square size={16} color={theme.colors.textSecondary} strokeWidth={2.4} fill={theme.colors.textSecondary} />
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              if (isPlaying) onPause();
              else if (state === 'paused') onResume();
              else onPlay();
            }}
            style={styles.playBtn}
          >
            {isPlaying ? (
              <Pause size={20} color="#fff" strokeWidth={2.5} fill="#fff" />
            ) : (
              <Play size={20} color="#fff" strokeWidth={2.5} fill="#fff" />
            )}
          </Pressable>
        </View>

        <View style={styles.volumeBlock}>
          {volume > 0 ? (
            <Volume2 size={14} color={theme.colors.textSecondary} strokeWidth={2.4} />
          ) : (
            <VolumeX size={14} color={theme.colors.textTertiary} strokeWidth={2.4} />
          )}
          <Slider
            style={styles.volumeSlider}
            minimumValue={0}
            maximumValue={1}
            step={0.05}
            value={volume}
            onSlidingComplete={(v) => onChangeVolume(v)}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
          />
        </View>
      </View>
    </View>
  );
}

const useStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 14,
      paddingTop: 8,
      paddingBottom: 10,
      backgroundColor: theme.colors.bgElevated,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      ...theme.shadows.lg,
    },
    timeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
      paddingHorizontal: 4,
    },
    timeText: {
      fontSize: 10,
      fontFamily: theme.fonts.numBold,
      color: theme.colors.textTertiary,
    },
    indexText: {
      fontSize: 11,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textSecondary,
    },
    slider: { width: '100%', height: 28 },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    iconBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: theme.colors.surfaceMuted,
    },
    rateText: {
      fontSize: 11,
      fontFamily: theme.fonts.numBold,
      color: theme.colors.textSecondary,
    },
    mainControls: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
    },
    playBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.sm,
    },
    volumeBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      width: 90,
    },
    volumeSlider: { flex: 1, height: 28 },
  });
