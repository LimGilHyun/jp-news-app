import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Star, Check, Volume2, Eye, EyeOff, Filter } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTheme, Theme } from '../utils/theme';
import { ALL_STUDY_WORDS, STUDY_LEVEL_META } from '../data/jlptStudyWords';
import type { JlptStudyWord } from '../data/jlptStudyTypes';
import { useStudyStore } from '../stores/studyStore';
import { StudyStackParamList } from '../App';

type Props = NativeStackScreenProps<StudyStackParamList, 'StudyWordList'>;

type SortMode = 'default' | 'unmemorized' | 'favorited';

export default function StudyWordListScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const { level } = route.params;

  const meta = STUDY_LEVEL_META[level as 'N5'];
  const allWords = useMemo(() => ALL_STUDY_WORDS[level as 'N5'] ?? [], [level]);

  const progress = useStudyStore((s) => s.progress);
  const showPronAlways = useStudyStore((s) => s.showPronAlways);
  const showKanaAlways = useStudyStore((s) => s.showKanaAlways);
  const setShowPronAlways = useStudyStore((s) => s.setShowPronAlways);
  const setShowKanaAlways = useStudyStore((s) => s.setShowKanaAlways);
  const bumpReview = useStudyStore((s) => s.bumpReview);
  const toggleMemorized = useStudyStore((s) => s.toggleMemorized);
  const toggleFavorite = useStudyStore((s) => s.toggleFavorite);

  const [sortMode, setSortMode] = useState<SortMode>('default');

  const filteredWords = useMemo(() => {
    let list = [...allWords];
    if (sortMode === 'unmemorized') list = list.filter((w) => !progress[w.jp]?.memorized);
    if (sortMode === 'favorited') list = list.filter((w) => progress[w.jp]?.favorited);
    return list;
  }, [allWords, progress, sortMode]);

  const memorizedCount = allWords.filter((w) => progress[w.jp]?.memorized).length;
  const totalCount = allWords.length;

  React.useEffect(() => {
    navigation.setOptions({ title: `${meta.name} · ${memorizedCount}/${totalCount}` });
  }, [navigation, meta.name, memorizedCount, totalCount]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 상단 컨트롤 */}
      <View style={styles.topBar}>
        <View style={styles.sortRow}>
          <Pressable
            onPress={() => setSortMode('default')}
            style={[styles.sortBtn, sortMode === 'default' && styles.sortBtnActive]}
          >
            <Text style={[styles.sortText, sortMode === 'default' && styles.sortTextActive]}>
              전체
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSortMode('unmemorized')}
            style={[styles.sortBtn, sortMode === 'unmemorized' && styles.sortBtnActive]}
          >
            <Text style={[styles.sortText, sortMode === 'unmemorized' && styles.sortTextActive]}>
              미암기
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSortMode('favorited')}
            style={[styles.sortBtn, sortMode === 'favorited' && styles.sortBtnActive]}
          >
            <Text style={[styles.sortText, sortMode === 'favorited' && styles.sortTextActive]}>
              ★
            </Text>
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
            <Text
              style={[
                styles.toggleText,
                showKanaAlways && { color: theme.colors.primary },
              ]}
            >
              한글 표기
            </Text>
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
            <Text
              style={[
                styles.toggleText,
                showPronAlways && { color: theme.colors.primary },
              ]}
            >
              한글 발음
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filteredWords}
        keyExtractor={(item) => item.jp}
        contentContainerStyle={styles.listContent}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        renderItem={({ item }) => (
          <WordCard
            word={item}
            theme={theme}
            styles={styles}
            progress={progress[item.jp]}
            showKanaAlways={showKanaAlways}
            showPronAlways={showPronAlways}
            onTap={() => bumpReview(item.jp)}
            onLongPress={() => bumpReview(item.jp)}
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
            <Text style={styles.emptyText}>해당 조건의 단어가 없습니다</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

interface WordCardProps {
  word: JlptStudyWord;
  theme: Theme;
  styles: ReturnType<typeof useStyles>;
  progress?: { reviewCount: number; memorized: boolean; favorited: boolean };
  showKanaAlways: boolean;
  showPronAlways: boolean;
  onTap: () => void;
  onLongPress: () => void;
  onListen: () => void;
  onToggleMemorized: () => void;
  onToggleFavorite: () => void;
}

const WordCard = React.memo(function WordCard({
  word,
  theme,
  styles,
  progress,
  showKanaAlways,
  showPronAlways,
  onTap,
  onLongPress,
  onListen,
  onToggleMemorized,
  onToggleFavorite,
}: WordCardProps) {
  const [pressed, setPressed] = useState(false);
  const showKana = showKanaAlways || pressed;
  const showPron = showPronAlways || pressed;
  const bothAlwaysOn = showKanaAlways && showPronAlways;
  const isMemorized = progress?.memorized ?? false;
  const isFavorited = progress?.favorited ?? false;
  const reviewCount = progress?.reviewCount ?? 0;

  return (
    <Pressable
      onPress={onTap}
      onPressIn={bothAlwaysOn ? undefined : () => setPressed(true)}
      onPressOut={bothAlwaysOn ? undefined : () => setPressed(false)}
      onLongPress={onLongPress}
      delayLongPress={200}
      style={[styles.wordCard, isMemorized && styles.wordCardMemorized]}
    >
      {/* 좌측: 일본어 + 한글 표기/발음 (조건부) */}
      <View style={styles.wordLeft}>
        <View style={styles.wordHeader}>
          <Text style={[styles.wordJp, isMemorized && { opacity: 0.5 }]} selectable>
            {word.jp}
          </Text>
          {word.pos && (
            <View style={styles.posBadge}>
              <Text style={styles.posText}>{word.pos}</Text>
            </View>
          )}
        </View>
        {(showKana || showPron) && (
          <Text style={styles.wordKana}>
            {showKana ? word.kana : ''}
            {showKana && showPron ? ' · ' : ''}
            {showPron ? word.ko_pron : ''}
          </Text>
        )}
        {showKana && (
          <Text style={[styles.wordMeaning, isMemorized && { opacity: 0.5 }]} numberOfLines={2}>
            {word.meaning}
          </Text>
        )}
        {reviewCount > 0 && (
          <Text style={styles.wordReviewText}>{reviewCount}회 봄</Text>
        )}
      </View>

      {/* 우측: 액션 */}
      <View style={styles.wordActions}>
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
          <Check
            size={14}
            color={isMemorized ? '#fff' : theme.colors.textSecondary}
            strokeWidth={3}
          />
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

    wordCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginBottom: 6,
      gap: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    wordCardMemorized: { backgroundColor: theme.colors.bg },

    wordLeft: { flex: 1, gap: 1 },
    wordHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    wordJp: {
      fontSize: theme.fs(18),
      lineHeight: theme.fs(22),
      fontFamily: theme.fonts.jpBold,
      color: theme.colors.textPrimary,
    },
    posBadge: {
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
      backgroundColor: theme.colors.surfaceMuted,
    },
    posText: {
      fontSize: 9,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textTertiary,
    },
    wordKana: {
      fontSize: theme.fs(11),
      lineHeight: theme.fs(14),
      fontFamily: theme.fonts.body,
      color: theme.colors.accent,
    },
    wordMeaning: {
      fontSize: theme.fs(12),
      lineHeight: theme.fs(15),
      fontFamily: theme.fonts.bodyMedium,
      color: theme.colors.textSecondary,
    },
    wordReviewText: {
      fontSize: 9,
      lineHeight: 11,
      fontFamily: theme.fonts.numBold,
      color: theme.colors.textTertiary,
      marginTop: 1,
    },

    wordActions: { alignItems: 'center', justifyContent: 'space-between', gap: 8 },
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
