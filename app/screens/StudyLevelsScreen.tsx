import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ArrowUpRight,
  Sparkles,
  Plane,
  Coffee,
  MessageCircle,
  Zap,
  Globe,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme, Theme } from '../utils/theme';
import { ALL_STUDY_WORDS, STUDY_LEVEL_META } from '../data/jlptStudyWords';
import { GRAMMAR_META, GrammarKind } from '../data/jpGrammarTypes';
import { JP_PARTICLES } from '../data/jpParticles';
import { JP_PREFIXES } from '../data/jpPrefixes';
import { JP_SUFFIXES } from '../data/jpSuffixes';
import { JP_ADVERBS } from '../data/jpAdverbs';
import { JP_CONJUNCTIONS } from '../data/jpConjunctions';
import { JP_DEMONSTRATIVES } from '../data/jpDemonstratives';
import { JP_INTERROGATIVES } from '../data/jpInterrogatives';
import { SENTENCE_META, SentenceKind } from '../data/jpSentenceTypes';
import { JP_TRAVEL_SENTENCES } from '../data/jpTravelSentences';
import { JP_SITUATION_SENTENCES } from '../data/jpSituationSentences';
import { JP_FREQUENT_SENTENCES } from '../data/jpFrequentSentences';
import { JP_SLANG_SENTENCES } from '../data/jpSlangSentences';
import { JP_INTERNET_SENTENCES } from '../data/jpInternetSentences';
import { useStudyStore } from '../stores/studyStore';
import { Difficulty } from '../types/article';
import { StudyStackParamList } from '../App';

type Nav = NativeStackNavigationProp<StudyStackParamList>;

const LEVELS: Difficulty[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
const GRAMMAR_KINDS: GrammarKind[] = [
  'particle',
  'prefix',
  'suffix',
  'adverb',
  'conjunction',
  'demonstrative',
  'interrogative',
];
const SENTENCE_KINDS: SentenceKind[] = ['travel', 'situation', 'frequent', 'slang', 'internet'];

const GRAMMAR_DATA: Record<GrammarKind, { jp: string }[]> = {
  particle: JP_PARTICLES,
  prefix: JP_PREFIXES,
  suffix: JP_SUFFIXES,
  adverb: JP_ADVERBS,
  conjunction: JP_CONJUNCTIONS,
  demonstrative: JP_DEMONSTRATIVES,
  interrogative: JP_INTERROGATIVES,
};
const SENTENCE_DATA: Record<SentenceKind, { jp: string }[]> = {
  travel: JP_TRAVEL_SENTENCES,
  situation: JP_SITUATION_SENTENCES,
  frequent: JP_FREQUENT_SENTENCES,
  slang: JP_SLANG_SENTENCES,
  internet: JP_INTERNET_SENTENCES,
};

const SENTENCE_ICON: Record<SentenceKind, typeof Plane> = {
  travel: Plane,
  situation: Coffee,
  frequent: MessageCircle,
  slang: Zap,
  internet: Globe,
};

export default function StudyLevelsScreen() {
  const theme = useTheme();
  const styles = useStyles(theme);
  const navigation = useNavigation<Nav>();
  const progress = useStudyStore((s) => s.progress);

  // 전체 진행 상태 집계
  const heroStats = useMemo(() => {
    const allItems = [
      ...LEVELS.flatMap((lv) => ALL_STUDY_WORDS[lv]),
      ...GRAMMAR_KINDS.flatMap((k) => GRAMMAR_DATA[k]),
      ...SENTENCE_KINDS.flatMap((k) => SENTENCE_DATA[k]),
    ];
    const total = allItems.length;
    const memorized = allItems.filter((w) => progress[w.jp]?.memorized).length;
    const pct = total > 0 ? Math.round((memorized / total) * 100) : 0;
    return { total, memorized, pct };
  }, [progress]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* === Hero === */}
        <View style={styles.heroHeader}>
          <Text style={styles.heroEyebrow}>STUDY</Text>
          <Text style={styles.heroTitle}>학습</Text>
        </View>
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Sparkles size={18} color={theme.colors.primary} strokeWidth={2.4} />
          </View>
          <View style={styles.heroBody}>
            <Text style={styles.heroLabel}>외운 항목</Text>
            <View style={styles.heroNumRow}>
              <Text style={styles.heroNum}>{heroStats.memorized}</Text>
              <Text style={styles.heroDenom}>/ {heroStats.total}</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.heroPct}>{heroStats.pct}%</Text>
            </View>
            <View style={styles.heroTrack}>
              <View style={[styles.heroFill, { width: `${heroStats.pct}%` }]} />
            </View>
          </View>
        </View>

        {/* === 카드 미리보기 진입 (임시) === */}
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            navigation.navigate('CardPreview');
          }}
          style={({ pressed }) => [
            styles.cardPreviewCta,
            pressed && { opacity: 0.85 },
          ]}
        >
          <LinearGradient
            colors={[theme.colors.heroGradient[0], theme.colors.heroGradient[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardPreviewCtaInner}
          >
            <View style={styles.cardPreviewIconWrap}>
              <Sparkles size={18} color="#fff" strokeWidth={2.6} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardPreviewTitle}>수집 카드 미리보기</Text>
              <Text style={styles.cardPreviewSub}>
                지브리 톤 N5 단어 10장 · 디자인 데모
              </Text>
            </View>
            <ArrowUpRight size={18} color="#fff" strokeWidth={2.4} />
          </LinearGradient>
        </Pressable>

        {/* === JLPT 단어 === */}
        <SectionHeader theme={theme} title="JLPT 단어" caption="5 LEVELS" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hScroll}
        >
          {LEVELS.map((lv) => {
            const words = ALL_STUDY_WORDS[lv];
            const total = words.length;
            const memorized = words.filter((w) => progress[w.jp]?.memorized).length;
            const meta = STUDY_LEVEL_META[lv];
            const pct = total > 0 ? Math.round((memorized / total) * 100) : 0;
            return (
              <Pressable
                key={lv}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  navigation.navigate('StudyCard', { level: lv });
                }}
                style={({ pressed }) => [styles.levelTile, pressed && { opacity: 0.92 }]}
              >
                <LinearGradient
                  colors={meta.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.levelTileBg}
                />
                <View style={styles.levelTileTopRow}>
                  <Text style={styles.levelTileLevel}>{meta.name}</Text>
                  <View style={styles.levelTileArrow}>
                    <ArrowUpRight size={12} color="#fff" strokeWidth={2.6} />
                  </View>
                </View>
                <Text style={styles.levelTileCount}>
                  {memorized}<Text style={styles.levelTileTotal}>/{total}</Text>
                </Text>
                <View style={styles.levelTileTrack}>
                  <View style={[styles.levelTileFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.levelTilePct}>{pct}%</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* === 문법 요소 === */}
        <SectionHeader theme={theme} title="문법 요소" caption="GRAMMAR" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hScroll}
        >
          {GRAMMAR_KINDS.map((kind) => {
            const meta = GRAMMAR_META[kind];
            const items = GRAMMAR_DATA[kind];
            const total = items.length;
            const memorized = items.filter((w) => progress[w.jp]?.memorized).length;
            const pct = total > 0 ? Math.round((memorized / total) * 100) : 0;
            return (
              <Pressable
                key={kind}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  navigation.navigate('StudyGrammarList', { kind });
                }}
                style={({ pressed }) => [styles.gramTile, pressed && { opacity: 0.92 }]}
              >
                <LinearGradient
                  colors={meta.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gramAccent}
                />
                <Text style={styles.gramName}>{meta.name}</Text>
                <Text style={styles.gramCount}>
                  {memorized}<Text style={styles.gramTotal}>/{total}</Text>
                </Text>
                <View style={styles.gramTrack}>
                  <View style={[styles.gramFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.gramPct}>{pct}%</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* === 문장 학습 === */}
        <SectionHeader theme={theme} title="문장 학습" caption="SENTENCES" />
        <View style={{ gap: 10 }}>
          {SENTENCE_KINDS.map((kind) => {
            const meta = SENTENCE_META[kind];
            const items = SENTENCE_DATA[kind];
            const total = items.length;
            const memorized = items.filter((w) => progress[w.jp]?.memorized).length;
            const pct = total > 0 ? Math.round((memorized / total) * 100) : 0;
            const Icon = SENTENCE_ICON[kind];
            return (
              <Pressable
                key={kind}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  navigation.navigate('StudySentenceList', { kind });
                }}
                style={({ pressed }) => [styles.sentTile, pressed && { opacity: 0.95 }]}
              >
                <LinearGradient
                  colors={meta.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sentIconWrap}
                >
                  <Icon size={22} color="#fff" strokeWidth={2.4} />
                </LinearGradient>
                <View style={styles.sentBody}>
                  <View style={styles.sentTitleRow}>
                    <Text style={styles.sentName}>{meta.name}</Text>
                    <ArrowUpRight size={16} color={theme.colors.textTertiary} strokeWidth={2.4} />
                  </View>
                  <Text style={styles.sentDesc} numberOfLines={1}>
                    {meta.description}
                  </Text>
                  <View style={styles.sentBottomRow}>
                    <Text style={styles.sentCount}>
                      {memorized}<Text style={styles.sentTotal}> / {total}</Text>
                    </Text>
                    <View style={styles.sentTrack}>
                      <View style={[styles.sentFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.sentPct}>{pct}%</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ theme, title, caption }: { theme: Theme; title: string; caption: string }) {
  const styles = useStyles(theme);
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionDivider} />
      <Text style={styles.sectionCaption}>{caption}</Text>
    </View>
  );
}

const useStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    scroll: { paddingTop: 8, paddingBottom: 140 },

    // Hero
    heroHeader: { paddingHorizontal: 20, marginTop: 4, marginBottom: 14 },
    heroEyebrow: {
      fontSize: 11,
      fontFamily: theme.fonts.numBold,
      color: theme.colors.textTertiary,
      letterSpacing: 2,
      marginBottom: 2,
    },
    heroTitle: {
      fontSize: theme.fs(28),
      fontFamily: theme.fonts.bodyBlack,
      color: theme.colors.textPrimary,
      letterSpacing: -0.6,
    },
    heroCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginHorizontal: 16,
      padding: 16,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      marginBottom: 14,
    },

    cardPreviewCta: {
      marginHorizontal: 16,
      marginBottom: 22,
      borderRadius: 18,
      overflow: 'hidden',
      ...theme.shadows.md,
    },
    cardPreviewCtaInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    cardPreviewIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.22)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardPreviewTitle: {
      fontSize: theme.fs(14),
      fontFamily: theme.fonts.bodyBlack,
      color: '#fff',
      letterSpacing: -0.2,
    },
    cardPreviewSub: {
      fontSize: 11,
      fontFamily: theme.fonts.bodyMedium,
      color: 'rgba(255,255,255,0.85)',
      marginTop: 2,
    },
    heroIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroBody: { flex: 1 },
    heroLabel: {
      fontSize: 11,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textTertiary,
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    heroNumRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    heroNum: {
      fontSize: theme.fs(28),
      fontFamily: theme.fonts.numBlack,
      color: theme.colors.textPrimary,
      letterSpacing: -1,
    },
    heroDenom: {
      fontSize: theme.fs(14),
      fontFamily: theme.fonts.numBold,
      color: theme.colors.textTertiary,
    },
    heroPct: {
      fontSize: theme.fs(14),
      fontFamily: theme.fonts.numBlack,
      color: theme.colors.primary,
    },
    heroTrack: {
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.colors.surfaceMuted,
      marginTop: 8,
      overflow: 'hidden',
    },
    heroFill: { height: '100%', borderRadius: 3, backgroundColor: theme.colors.primary },

    // Section header
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: theme.fs(17),
      fontFamily: theme.fonts.bodyBlack,
      color: theme.colors.textPrimary,
      letterSpacing: -0.3,
    },
    sectionDivider: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    sectionCaption: {
      fontSize: 10,
      fontFamily: theme.fonts.numBold,
      color: theme.colors.textTertiary,
      letterSpacing: 1.6,
    },

    // 수평 스크롤 (JLPT 레벨)
    hScroll: { paddingHorizontal: 16, paddingRight: 24, gap: 10, marginBottom: 28 },
    levelTile: {
      width: 116,
      height: 142,
      marginRight: 10,
      borderRadius: 18,
      padding: 14,
      overflow: 'hidden',
      justifyContent: 'space-between',
    },
    levelTileBg: { ...StyleSheet.absoluteFillObject },
    levelTileTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    levelTileLevel: {
      fontSize: theme.fs(20),
      fontFamily: theme.fonts.numBlack,
      color: '#fff',
      letterSpacing: -0.6,
    },
    levelTileArrow: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(255,255,255,0.22)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    levelTileCount: {
      fontSize: theme.fs(20),
      fontFamily: theme.fonts.numBlack,
      color: '#fff',
      letterSpacing: -0.5,
    },
    levelTileTotal: {
      fontSize: theme.fs(12),
      fontFamily: theme.fonts.numBold,
      color: 'rgba(255,255,255,0.7)',
    },
    levelTileTrack: {
      height: 3,
      borderRadius: 2,
      backgroundColor: 'rgba(255,255,255,0.25)',
      overflow: 'hidden',
    },
    levelTileFill: { height: '100%', borderRadius: 2, backgroundColor: '#fff' },
    levelTilePct: {
      fontSize: 10,
      fontFamily: theme.fonts.numBold,
      color: 'rgba(255,255,255,0.9)',
      marginTop: 4,
    },

    // 수평 스크롤 타일 (문법)
    gramTile: {
      width: 124,
      height: 134,
      marginRight: 10,
      borderRadius: 16,
      padding: 14,
      paddingTop: 18,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      justifyContent: 'space-between',
    },
    gramAccent: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 4,
    },
    gramName: {
      fontSize: theme.fs(14),
      fontFamily: theme.fonts.bodyBlack,
      color: theme.colors.textPrimary,
      letterSpacing: -0.3,
    },
    gramCount: {
      fontSize: theme.fs(20),
      fontFamily: theme.fonts.numBlack,
      color: theme.colors.textPrimary,
      letterSpacing: -0.5,
    },
    gramTotal: {
      fontSize: theme.fs(12),
      fontFamily: theme.fonts.numBold,
      color: theme.colors.textTertiary,
    },
    gramTrack: {
      height: 3,
      borderRadius: 2,
      backgroundColor: theme.colors.surfaceMuted,
      overflow: 'hidden',
    },
    gramFill: { height: '100%', borderRadius: 2, backgroundColor: theme.colors.primary },
    gramPct: {
      fontSize: 10,
      fontFamily: theme.fonts.numBold,
      color: theme.colors.textTertiary,
      marginTop: 2,
    },

    // 풀폭 카드 (문장)
    sentTile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginHorizontal: 16,
      padding: 14,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    sentIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sentBody: { flex: 1, gap: 4 },
    sentTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sentName: {
      fontSize: theme.fs(15),
      fontFamily: theme.fonts.bodyBlack,
      color: theme.colors.textPrimary,
      letterSpacing: -0.3,
    },
    sentDesc: {
      fontSize: theme.fs(11),
      fontFamily: theme.fonts.body,
      color: theme.colors.textSecondary,
    },
    sentBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    sentCount: {
      fontSize: theme.fs(12),
      fontFamily: theme.fonts.numBlack,
      color: theme.colors.textPrimary,
    },
    sentTotal: {
      fontSize: theme.fs(11),
      fontFamily: theme.fonts.numBold,
      color: theme.colors.textTertiary,
    },
    sentTrack: {
      flex: 1,
      height: 3,
      borderRadius: 2,
      backgroundColor: theme.colors.surfaceMuted,
      overflow: 'hidden',
    },
    sentFill: { height: '100%', borderRadius: 2, backgroundColor: theme.colors.primary },
    sentPct: {
      fontSize: 10,
      fontFamily: theme.fonts.numBold,
      color: theme.colors.textTertiary,
      minWidth: 28,
      textAlign: 'right',
    },
  });
