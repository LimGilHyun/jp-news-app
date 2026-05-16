import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../App';
import { useTheme } from '../utils/theme';
import { useSettingsStore } from '../stores/settingsStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const FLOATING_WORDS: Array<{ jp: string; ruby: string; ko: string }> = [
  { jp: '勉強', ruby: 'べんきょう', ko: '공부' },
  { jp: '新聞', ruby: 'しんぶん', ko: '신문' },
  { jp: '今日', ruby: 'きょう', ko: '오늘' },
  { jp: '言葉', ruby: 'ことば', ko: '말' },
  { jp: '学ぶ', ruby: 'まなぶ', ko: '배우다' },
];

const FLOATING_POSITIONS = [
  { top: 80, left: 24, transform: [{ rotate: '-6deg' }] },
  { top: 150, right: 20, transform: [{ rotate: '4deg' }] },
  { bottom: 220, left: 16, transform: [{ rotate: '-3deg' }] },
  { bottom: 150, right: 28, transform: [{ rotate: '7deg' }] },
  { top: 260, left: 40, transform: [{ rotate: '2deg' }] },
];

export default function WelcomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const onboarded = useSettingsStore((s) => s.onboarded);
  const fade = useRef(new Animated.Value(0)).current;
  const scaleKanji = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleKanji, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    const t = setTimeout(() => {
      navigation.replace(onboarded ? 'MainTabs' : 'Onboarding');
    }, 2000);
    return () => clearTimeout(t);
  }, [fade, scaleKanji, navigation, onboarded]);

  const heroGradient = theme.isDark
    ? (['#1e1b4b', '#312e81', '#4c1d95'] as const)
    : (['#fce7f3', '#ddd6fe', '#dbeafe'] as const);

  const floatingBg = theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)';
  const floatingBorder = theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)';

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={heroGradient} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.container}>
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {FLOATING_WORDS.map((w, i) => (
            <Animated.View
              key={i}
              style={[
                styles.floatingCard,
                FLOATING_POSITIONS[i],
                {
                  opacity: fade,
                  backgroundColor: floatingBg,
                  borderColor: floatingBorder,
                },
              ]}
            >
              <Text style={[styles.floatingRuby, { color: theme.colors.accent }]}>{w.ruby}</Text>
              <Text style={[styles.floatingJp, { color: theme.colors.textPrimary }]}>{w.jp}</Text>
              <Text style={[styles.floatingKo, { color: theme.colors.textTertiary }]}>{w.ko}</Text>
            </Animated.View>
          ))}
        </View>

        <Animated.View
          style={[
            styles.content,
            { opacity: fade, transform: [{ scale: scaleKanji }] },
          ]}
        >
          <View style={[styles.brandPill, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)' }]}>
            <Text style={[styles.brandPillText, { color: theme.colors.textSecondary }]}>
              毎日のニュースで · 매일의 뉴스로
            </Text>
          </View>

          <View style={styles.kanjiBlock}>
            <Text style={[styles.kanjiRuby, { color: theme.colors.accent }]}>にほんご</Text>
            <Text style={[styles.kanji, { color: theme.colors.textPrimary }]}>日本語</Text>
            <Text style={[styles.kanjiSub, { color: theme.colors.primary }]}>
              일본어 공부, 오늘부터
            </Text>
          </View>

          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            NHK 뉴스로 단어 · 문법 · 발음 · 퀴즈까지
          </Text>

          <View style={styles.dotRow}>
            <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
            <View style={[styles.dot, { backgroundColor: theme.colors.borderStrong }]} />
            <View style={[styles.dot, { backgroundColor: theme.colors.borderStrong }]} />
          </View>
        </Animated.View>

        <Text style={[styles.footer, { color: theme.colors.textTertiary }]}>
          잠시만 기다려 주세요
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCard: {
    position: 'absolute',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 76,
    alignItems: 'center',
  },
  floatingRuby: { fontSize: 9, fontWeight: '600' },
  floatingJp: { fontSize: 17, fontFamily: 'NotoSansJP_700Bold', marginVertical: 1 },
  floatingKo: { fontSize: 10, fontWeight: '500' },

  content: { alignItems: 'center', paddingHorizontal: 32 },

  brandPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 22,
  },
  brandPillText: { fontSize: 12, fontWeight: '600' },

  kanjiBlock: { alignItems: 'center', marginBottom: 18 },
  kanjiRuby: { fontSize: 13, letterSpacing: 4, marginBottom: 4, fontWeight: '600' },
  kanji: {
    fontSize: 56,
    fontFamily: 'NotoSansJP_700Bold',
    letterSpacing: 2,
  },
  kanjiSub: { fontSize: 15, fontWeight: '700', marginTop: 12 },

  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
  },

  dotRow: { flexDirection: 'row', gap: 6, marginTop: 28 },
  dot: { width: 6, height: 6, borderRadius: 3 },

  footer: {
    position: 'absolute',
    bottom: 30,
    fontSize: 11,
  },
});
