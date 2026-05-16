import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Star, Check, Volume2, Eye, EyeOff, Filter } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTheme, Theme } from '../utils/theme';
import { GRAMMAR_META } from '../data/jpGrammarTypes';
import { JP_PARTICLES } from '../data/jpParticles';
import { JP_PREFIXES } from '../data/jpPrefixes';
import { JP_SUFFIXES } from '../data/jpSuffixes';
import { JP_ADVERBS } from '../data/jpAdverbs';
import { JP_CONJUNCTIONS } from '../data/jpConjunctions';
import { JP_DEMONSTRATIVES } from '../data/jpDemonstratives';
import { JP_INTERROGATIVES } from '../data/jpInterrogatives';
import type { JpGrammarItem, GrammarKind } from '../data/jpGrammarTypes';
import { useStudyStore } from '../stores/studyStore';
import { StudyStackParamList } from '../App';

type Props = NativeStackScreenProps<StudyStackParamList, 'StudyGrammarList'>;
type SortMode = 'default' | 'unmemorized' | 'favorited';

const DATA_BY_KIND: Record<GrammarKind, JpGrammarItem[]> = {
  particle: JP_PARTICLES,
  prefix: JP_PREFIXES,
  suffix: JP_SUFFIXES,
  adverb: JP_ADVERBS,
  conjunction: JP_CONJUNCTIONS,
  demonstrative: JP_DEMONSTRATIVES,
  interrogative: JP_INTERROGATIVES,
};

export default function StudyGrammarListScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const { kind } = route.params;

  const meta = GRAMMAR_META[kind];
  const allItems = useMemo(() => DATA_BY_KIND[kind] ?? [], [kind]);

  const progress = useStudyStore((s) => s.progress);
  const showPronAlways = useStudyStore((s) => s.showPronAlways);
  const showKanaAlways = useStudyStore((s) => s.showKanaAlways);
  const setShowPronAlways = useStudyStore((s) => s.setShowPronAlways);
  const setShowKanaAlways = useStudyStore((s) => s.setShowKanaAlways);
  const bumpReview = useStudyStore((s) => s.bumpReview);
  const toggleMemorized = useStudyStore((s) => s.toggleMemorized);
  const toggleFavorite = useStudyStore((s) => s.toggleFavorite);

  const [sortMode, setSortMode] = useState<SortMode>('default');

  const filtered = useMemo(() => {
    let list = [...allItems];
    if (sortMode === 'unmemorized') list = list.filter((w) => !progress[w.jp]?.memorized);
    if (sortMode === 'favorited') list = list.filter((w) => progress[w.jp]?.favorited);
    return list;
  }, [allItems, progress, sortMode]);

  const memorizedCount = allItems.filter((w) => progress[w.jp]?.memorized).length;
  const totalCount = allItems.length;

  React.useEffect(() => {
    navigation.setOptions({ title: `${meta.name} · ${memorizedCount}/${totalCount}` });
  }, [navigation, meta.name, memorizedCount, totalCount]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.topBar}>
        <View style={styles.sortRow}>
          <Pressable
            onPress={() => setSortMode('default')}
            style={[styles.sortBtn, sortMode === 'default' && styles.sortBtnActive]}
          >
            <Text style={[styles.sortText, sortMode === 'default' && styles.sortTextActive]}>전체</Text>
          </Pressable>
          <Pressable
            onPress={() => setSortMode('unmemorized')}
            style={[styles.sortBtn, sortMode === 'unmemorized' && styles.sortBtnActive]}
          >
            <Text style={[styles.sortText, sortMode === 'unmemorized' && styles.sortTextActive]}>미암기</Text>
          </Pressable>
          <Pressable
            onPress={() => setSortMode('favorited')}
            style={[styles.sortBtn, sortMode === 'favorited' && styles.sortBtnActive]}
          >
            <Text style={[styles.sortText, sortMode === 'favorited' && styles.sortTextActive]}>★</Text>
          </Pressable>
        </View>
        <View style={styles.toggleRow}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setShowKanaAlways(!showKanaAlways);
            }}
            style={[styles.toggleBtn, showKanaAlways && styles.toggleBtnActive]}
            hitSlop={6}
          >
            {showKanaAlways ? (
              <Eye size={13} color={theme.colors.primary} strokeWidth={2.4} />
            ) : (
              <EyeOff size={13} color={theme.colors.textSecondary} strokeWidth={2.4} />
            )}
            <Text style={[styles.toggleText, showKanaAlways && { color: theme.colors.primary }]}>한글 표기</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setShowPronAlways(!showPronAlways);
            }}
            style={[styles.toggleBtn, showPronAlways && styles.toggleBtnActive]}
            hitSlop={6}
          >
            {showPronAlways ? (
              <Eye size={13} color={theme.colors.primary} strokeWidth={2.4} />
            ) : (
              <EyeOff size={13} color={theme.colors.textSecondary} strokeWidth={2.4} />
            )}
            <Text style={[styles.toggleText, showPronAlways && { color: theme.colors.primary }]}>한글 발음</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.jp}
        contentContainerStyle={styles.listContent}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        renderItem={({ item }) => (
          <GrammarCard
            item={item}
            theme={theme}
            styles={styles}
            progress={progress[item.jp]}
            showKanaAlways={showKanaAlways}
            showPronAlways={showPronAlways}
            onTap={() => bumpReview(item.jp)}
            onListen={() => {
              Speech.stop();
              const phrase = item.jp.replace(/[〜~]/g, '').replace(/。$/, '');
              Speech.speak(phrase || item.jp, { language: 'ja-JP', rate: 0.9 });
              bumpReview(item.jp);
            }}
            onListenExample={() => {
              Speech.stop();
              Speech.speak(item.example_jp, { language: 'ja-JP', rate: 0.9 });
              bumpReview(item.jp);
            }}
            onToggleMemorized={() => {
              Haptics.selectionAsync().catch(() => {});
              toggleMemorized(item.jp);
            }}
            onToggleFavorite={() => {
              Haptics.selectionAsync().catch(() => {});
              toggleFavorite(item.jp);
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Filter size={28} color={theme.colors.textTertiary} strokeWidth={1.5} />
            <Text style={styles.emptyText}>해당 조건의 항목이 없습니다</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

interface GrammarCardProps {
  item: JpGrammarItem;
  theme: Theme;
  styles: ReturnType<typeof useStyles>;
  progress?: { reviewCount: number; memorized: boolean; favorited: boolean };
  showKanaAlways: boolean;
  showPronAlways: boolean;
  onTap: () => void;
  onListen: () => void;
  onListenExample: () => void;
  onToggleMemorized: () => void;
  onToggleFavorite: () => void;
}

const GrammarCard = React.memo(function GrammarCard({
  item,
  theme,
  styles,
  progress,
  showKanaAlways,
  showPronAlways,
  onTap,
  onListen,
  onListenExample,
  onToggleMemorized,
  onToggleFavorite,
}: GrammarCardProps) {
  const [pressed, setPressed] = useState(false);
  const showKana = showKanaAlways || pressed;
  const showPron = showPronAlways || pressed;
  const bothAlwaysOn = showKanaAlways && showPronAlways;
  const isMemorized = progress?.memorized ?? false;
  const isFavorited = progress?.favorited ?? false;

  return (
    <Pressable
      onPress={onTap}
      onPressIn={bothAlwaysOn ? undefined : () => setPressed(true)}
      onPressOut={bothAlwaysOn ? undefined : () => setPressed(false)}
      delayLongPress={200}
      style={[styles.card, isMemorized && styles.cardMemorized]}
    >
      <View style={styles.cardLeft}>
        <View style={styles.headerRow}>
          <Text style={[styles.jp, isMemorized && { opacity: 0.5 }]} selectable>
            {item.jp}
          </Text>
        </View>
        {(showKana || showPron) && (
          <Text style={styles.kana}>
            {showKana ? item.kana : ''}
            {showKana && showPron ? ' · ' : ''}
            {showPron ? item.ko_pron : ''}
          </Text>
        )}
        {showKana && (
          <>
            <Text style={[styles.meaning, isMemorized && { opacity: 0.5 }]} numberOfLines={2}>
              {item.meaning}
            </Text>
            <Text style={styles.usage} numberOfLines={2}>
              {item.usage}
            </Text>
          </>
        )}
        <Pressable onPress={onListenExample} style={styles.exampleBlock} hitSlop={4}>
          <Text style={styles.exampleJp} selectable>
            {item.example_jp}
          </Text>
          {showKana && (
            <Text style={styles.exampleKana}>{item.example_kana}</Text>
          )}
          {showKana && (
            <Text style={styles.exampleKo}>{item.example_ko}</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={onToggleFavorite} hitSlop={8} style={styles.actionBtn}>
          <Star
            size={18}
            color={isFavorited ? theme.colors.warning : theme.colors.textTertiary}
            fill={isFavorited ? theme.colors.warning : 'transparent'}
            strokeWidth={2}
          />
        </Pressable>
        <Pressable onPress={onListen} hitSlop={8} style={styles.actionBtn}>
          <Volume2 size={16} color={theme.colors.primary} strokeWidth={2.4} />
        </Pressable>
        <Pressable
          onPress={onToggleMemorized}
          hitSlop={8}
          style={[styles.memorizedBtn, isMemorized && styles.memorizedBtnActive]}
        >
          <Check size={14} color={isMemorized ? '#fff' : theme.colors.textSecondary} strokeWidth={3} />
        </Pressable>
      </View>
    </Pressable>
  );
});

const useStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.bgElevated,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    sortRow: { flexDirection: 'row', gap: 4 },
    sortBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme.colors.surfaceMuted,
    },
    sortBtnActive: { backgroundColor: theme.colors.primary },
    sortText: {
      fontSize: 11,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textSecondary,
    },
    sortTextActive: { color: '#fff' },
    toggleRow: { flexDirection: 'row', gap: 4 },
    toggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme.colors.surfaceMuted,
    },
    toggleBtnActive: { backgroundColor: theme.colors.primarySoft },
    toggleText: {
      fontSize: 11,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textSecondary,
    },

    listContent: { padding: 12, paddingBottom: 120 },

    card: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      gap: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    cardMemorized: { backgroundColor: theme.colors.bg },
    cardLeft: { flex: 1, gap: 4 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    jp: {
      fontSize: theme.fs(20),
      fontFamily: theme.fonts.jpBold,
      color: theme.colors.textPrimary,
    },
    kana: {
      fontSize: theme.fs(11),
      fontFamily: theme.fonts.body,
      color: theme.colors.accent,
    },
    meaning: {
      fontSize: theme.fs(13),
      fontFamily: theme.fonts.bodyMedium,
      color: theme.colors.textSecondary,
    },
    usage: {
      fontSize: theme.fs(11),
      fontFamily: theme.fonts.body,
      color: theme.colors.textTertiary,
      lineHeight: theme.fs(15),
    },
    exampleBlock: {
      marginTop: 6,
      padding: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.surfaceMuted,
      gap: 2,
    },
    exampleJp: {
      fontSize: theme.fs(13),
      fontFamily: theme.fonts.jpBold,
      color: theme.colors.textPrimary,
    },
    exampleKana: {
      fontSize: theme.fs(10),
      fontFamily: theme.fonts.body,
      color: theme.colors.accent,
    },
    exampleKo: {
      fontSize: theme.fs(11),
      fontFamily: theme.fonts.bodyMedium,
      color: theme.colors.textSecondary,
    },

    actions: { alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    actionBtn: { padding: 4 },
    memorizedBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: theme.colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    memorizedBtnActive: {
      backgroundColor: theme.colors.success,
      borderColor: theme.colors.success,
    },

    empty: { padding: 40, alignItems: 'center', gap: 8 },
    emptyText: {
      fontSize: theme.fs(13),
      fontFamily: theme.fonts.body,
      color: theme.colors.textTertiary,
    },
  });
