import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Star, Check, Volume2, Eye, EyeOff, Filter } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTheme, Theme } from '../utils/theme';
import { SENTENCE_META } from '../data/jpSentenceTypes';
import type { JpSentence, SentenceKind } from '../data/jpSentenceTypes';
import { JP_TRAVEL_SENTENCES } from '../data/jpTravelSentences';
import { JP_SITUATION_SENTENCES } from '../data/jpSituationSentences';
import { JP_FREQUENT_SENTENCES } from '../data/jpFrequentSentences';
import { JP_SLANG_SENTENCES } from '../data/jpSlangSentences';
import { JP_INTERNET_SENTENCES } from '../data/jpInternetSentences';
import { useStudyStore } from '../stores/studyStore';
import { StudyStackParamList } from '../App';

type Props = NativeStackScreenProps<StudyStackParamList, 'StudySentenceList'>;
type SortMode = 'default' | 'unmemorized' | 'favorited';

const DATA_BY_KIND: Record<SentenceKind, JpSentence[]> = {
  travel: JP_TRAVEL_SENTENCES,
  situation: JP_SITUATION_SENTENCES,
  frequent: JP_FREQUENT_SENTENCES,
  slang: JP_SLANG_SENTENCES,
  internet: JP_INTERNET_SENTENCES,
};

export default function StudySentenceListScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const { kind } = route.params;

  const meta = SENTENCE_META[kind];
  const allItems = useMemo(() => DATA_BY_KIND[kind] ?? [], [kind]);
  const categories = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach((s) => set.add(s.category));
    return Array.from(set);
  }, [allItems]);

  const progress = useStudyStore((s) => s.progress);
  const showPronAlways = useStudyStore((s) => s.showPronAlways);
  const showKanaAlways = useStudyStore((s) => s.showKanaAlways);
  const setShowPronAlways = useStudyStore((s) => s.setShowPronAlways);
  const setShowKanaAlways = useStudyStore((s) => s.setShowKanaAlways);
  const bumpReview = useStudyStore((s) => s.bumpReview);
  const toggleMemorized = useStudyStore((s) => s.toggleMemorized);
  const toggleFavorite = useStudyStore((s) => s.toggleFavorite);

  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...allItems];
    if (activeCategory) list = list.filter((s) => s.category === activeCategory);
    if (sortMode === 'unmemorized') list = list.filter((s) => !progress[s.jp]?.memorized);
    if (sortMode === 'favorited') list = list.filter((s) => progress[s.jp]?.favorited);
    return list;
  }, [allItems, progress, sortMode, activeCategory]);

  const memorizedCount = allItems.filter((s) => progress[s.jp]?.memorized).length;
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

      {/* 카테고리 칩 (가로 스크롤) */}
      <View style={styles.categoryWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <Pressable
            onPress={() => setActiveCategory(null)}
            style={[styles.catBtn, activeCategory === null && styles.catBtnActive]}
          >
            <Text style={[styles.catText, activeCategory === null && styles.catTextActive]}>전체</Text>
          </Pressable>
          {categories.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[styles.catBtn, activeCategory === cat && styles.catBtnActive]}
            >
              <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.jp}
        contentContainerStyle={styles.listContent}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        renderItem={({ item }) => (
          <SentenceCard
            item={item}
            theme={theme}
            styles={styles}
            progress={progress[item.jp]}
            showKanaAlways={showKanaAlways}
            showPronAlways={showPronAlways}
            onTap={() => bumpReview(item.jp)}
            onListen={() => {
              Speech.stop();
              Speech.speak(item.jp, { language: 'ja-JP', rate: 0.9 });
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
            <Text style={styles.emptyText}>해당 조건의 문장이 없습니다</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

interface SentenceCardProps {
  item: JpSentence;
  theme: Theme;
  styles: ReturnType<typeof useStyles>;
  progress?: { reviewCount: number; memorized: boolean; favorited: boolean };
  showKanaAlways: boolean;
  showPronAlways: boolean;
  onTap: () => void;
  onListen: () => void;
  onToggleMemorized: () => void;
  onToggleFavorite: () => void;
}

const SentenceCard = React.memo(function SentenceCard({
  item,
  theme,
  styles,
  progress,
  showKanaAlways,
  showPronAlways,
  onTap,
  onListen,
  onToggleMemorized,
  onToggleFavorite,
}: SentenceCardProps) {
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
        <View style={styles.tagRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
        </View>
        <Text style={[styles.jp, isMemorized && { opacity: 0.5 }]} selectable>
          {item.jp}
        </Text>
        {showKana && (
          <Text style={styles.kana}>{item.kana}</Text>
        )}
        {showPron && (
          <Text style={styles.koPron}>{item.ko_pron}</Text>
        )}
        {showKana && (
          <Text style={[styles.ko, isMemorized && { opacity: 0.5 }]}>{item.ko}</Text>
        )}
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

    categoryWrap: {
      backgroundColor: theme.colors.bgElevated,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    categoryScroll: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
    catBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme.colors.surfaceMuted,
      marginRight: 6,
    },
    catBtnActive: { backgroundColor: theme.colors.primary },
    catText: {
      fontSize: 12,
      fontFamily: theme.fonts.bodyMedium,
      color: theme.colors.textSecondary,
    },
    catTextActive: { color: '#fff', fontFamily: theme.fonts.bodyBold },

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
    tagRow: { flexDirection: 'row', marginBottom: 2 },
    categoryBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: theme.colors.surfaceMuted,
    },
    categoryBadgeText: {
      fontSize: 10,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textTertiary,
    },
    jp: {
      fontSize: theme.fs(15),
      fontFamily: theme.fonts.jpBold,
      color: theme.colors.textPrimary,
      lineHeight: theme.fs(22),
    },
    kana: {
      fontSize: theme.fs(11),
      fontFamily: theme.fonts.body,
      color: theme.colors.accent,
    },
    koPron: {
      fontSize: theme.fs(11),
      fontFamily: theme.fonts.body,
      color: theme.colors.textSecondary,
    },
    ko: {
      fontSize: theme.fs(13),
      fontFamily: theme.fonts.bodyMedium,
      color: theme.colors.textSecondary,
      marginTop: 2,
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
