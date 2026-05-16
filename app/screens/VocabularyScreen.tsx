import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Volume2, Trash2, Sparkles, X } from 'lucide-react-native';

import { useHighlightStore } from '../stores/highlightStore';
import { isDue } from '../utils/srs';
import { Highlight, QUALITY, Quality } from '../types/article';
import { useTheme, Theme } from '../utils/theme';

export default function VocabularyScreen() {
  const theme = useTheme();
  const styles = useStyles(theme);
  const highlights = useHighlightStore((s) => s.highlights);
  const loadHighlights = useHighlightStore((s) => s.loadHighlights);
  const removeHighlight = useHighlightStore((s) => s.removeHighlight);
  const reviewHighlight = useHighlightStore((s) => s.reviewHighlight);

  const [filter, setFilter] = useState<'all' | 'due'>('due');
  const [activeReview, setActiveReview] = useState<Highlight | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    loadHighlights();
  }, [loadHighlights]);

  const filtered = useMemo(() => {
    if (filter === 'all') return highlights;
    return highlights.filter((h) => isDue(h));
  }, [highlights, filter]);

  const startReview = (h: Highlight) => {
    Haptics.selectionAsync().catch(() => {});
    setActiveReview(h);
    setRevealed(false);
  };

  const grade = async (q: Quality) => {
    if (!activeReview) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await reviewHighlight(activeReview.id, q);
    const remaining = highlights.filter(
      (h) => h.id !== activeReview.id && isDue(h)
    );
    if (remaining.length > 0) {
      setActiveReview(remaining[0]);
      setRevealed(false);
    } else {
      setActiveReview(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('복습 완료', '오늘 복습할 카드를 모두 끝냈습니다.');
    }
  };

  if (activeReview) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.cardWrap}>
          <Pressable
            onPress={() => {
              setActiveReview(null);
              setRevealed(false);
            }}
            style={styles.closeBtn}
            hitSlop={10}
          >
            <X size={20} color={theme.colors.textTertiary} strokeWidth={2.4} />
          </Pressable>

          <Text style={styles.cardWord} selectable>
            {activeReview.selectedText}
          </Text>
          <Pressable
            onPress={() =>
              Speech.speak(activeReview.selectedText, { language: 'ja-JP', rate: 0.9 })
            }
            style={styles.cardSpeakBtn}
          >
            <Volume2 size={14} color={theme.colors.primary} strokeWidth={2.4} />
            <Text style={styles.cardSpeakIcon}>발음 듣기</Text>
          </Pressable>

          {revealed ? (
            <View style={styles.cardBack}>
              {!!activeReview.reading && (
                <Text style={styles.cardReading} selectable>
                  {activeReview.reading}
                </Text>
              )}
              <Text style={styles.cardMeaning} selectable>
                {activeReview.meaning ?? '(뜻 없음)'}
              </Text>
            </View>
          ) : (
            <Pressable onPress={() => setRevealed(true)} style={styles.revealBtn}>
              <Text style={styles.revealBtnText}>뜻 보기</Text>
            </Pressable>
          )}

          {revealed && (
            <View style={styles.gradeRow}>
              <Pressable
                onPress={() => grade(QUALITY.AGAIN)}
                style={[styles.grade, { backgroundColor: theme.colors.errorSoft }]}
              >
                <Text style={[styles.gradeText, { color: theme.colors.error }]}>다시</Text>
              </Pressable>
              <Pressable
                onPress={() => grade(QUALITY.HARD)}
                style={[styles.grade, { backgroundColor: theme.colors.warningSoft }]}
              >
                <Text style={[styles.gradeText, { color: theme.colors.warning }]}>어려움</Text>
              </Pressable>
              <Pressable
                onPress={() => grade(QUALITY.GOOD)}
                style={[styles.grade, { backgroundColor: theme.colors.successSoft }]}
              >
                <Text style={[styles.gradeText, { color: theme.colors.success }]}>좋음</Text>
              </Pressable>
              <Pressable
                onPress={() => grade(QUALITY.EASY)}
                style={[styles.grade, { backgroundColor: theme.colors.primarySoft }]}
              >
                <Text style={[styles.gradeText, { color: theme.colors.primary }]}>쉬움</Text>
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const dueCount = highlights.filter((h) => isDue(h)).length;
  const totalCount = highlights.length;
  const progress = totalCount > 0 ? Math.round(((totalCount - dueCount) / totalCount) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.heroWrap}>
              <LinearGradient
                colors={theme.colors.heroGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hero}
              >
                <View style={styles.heroPill}>
                  <Sparkles size={12} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.heroPillText}>SRS 복습</Text>
                </View>
                <Text style={styles.heroNumber}>{dueCount}</Text>
                <Text style={styles.heroLabel}>오늘 복습할 단어</Text>
                {totalCount > 0 && (
                  <>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.heroSub}>
                      전체 {totalCount}개 · {progress}% 학습 중
                    </Text>
                  </>
                )}
              </LinearGradient>
            </View>

            {dueCount > 0 && (
              <Pressable
                onPress={() => startReview(highlights.filter((h) => isDue(h))[0])}
                style={styles.startBtn}
              >
                <Sparkles size={16} color="#fff" strokeWidth={2.5} />
                <Text style={styles.startBtnText}>오늘의 복습 시작하기</Text>
              </Pressable>
            )}

            <View style={styles.filterRow}>
              <Pressable
                onPress={() => setFilter('due')}
                style={[styles.filterBtn, filter === 'due' && styles.filterBtnActive]}
              >
                <Text style={[styles.filterText, filter === 'due' && styles.filterTextActive]}>
                  오늘 할 것
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setFilter('all')}
                style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
              >
                <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                  전체
                </Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => startReview(item)} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowWord} selectable>
                {item.selectedText}
              </Text>
              {!!item.reading && (
                <Text style={styles.rowReading} selectable>
                  {item.reading}
                </Text>
              )}
              {!!item.meaning && (
                <Text style={styles.rowMeaning} numberOfLines={1} selectable>
                  {item.meaning}
                </Text>
              )}
            </View>
            <View style={styles.rowMeta}>
              <Text style={styles.rowMetaText}>
                {new Date(item.nextReviewAt).toLocaleDateString('ko-KR', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <Pressable
                onPress={() =>
                  Alert.alert('삭제', `'${item.selectedText}'을 단어장에서 삭제할까요?`, [
                    { text: '취소' },
                    { text: '삭제', style: 'destructive', onPress: () => removeHighlight(item.id) },
                  ])
                }
                hitSlop={8}
                style={styles.delBtn}
              >
                <Trash2 size={14} color={theme.colors.error} strokeWidth={2.4} />
              </Pressable>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Sparkles size={36} color={theme.colors.textTertiary} strokeWidth={1.5} />
            <Text style={styles.emptyText}>
              아직 단어장이 비어있습니다.{'\n'}
              기사 화면에서 토큰을 길게 눌러 형광펜으로 저장해보세요.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const useStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },

    heroWrap: { paddingHorizontal: 16, paddingTop: 16 },
    hero: {
      borderRadius: 24,
      paddingHorizontal: 22,
      paddingVertical: 22,
      ...theme.shadows.lg,
    },
    heroPill: {
      flexDirection: 'row',
      alignSelf: 'flex-start',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.22)',
      marginBottom: 10,
    },
    heroPillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    heroNumber: {
      fontSize: theme.fs(56),
      fontFamily: theme.fonts.numBlack,
      color: '#fff',
      letterSpacing: -1.5,
      lineHeight: theme.fs(64),
    },
    heroLabel: {
      fontSize: theme.fs(14),
      color: 'rgba(255,255,255,0.92)',
      fontWeight: '700',
      marginBottom: 14,
    },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(255,255,255,0.22)',
      overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
    heroSub: {
      marginTop: 8,
      color: 'rgba(255,255,255,0.85)',
      fontSize: 12,
      fontWeight: '600',
    },

    startBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginTop: 12,
      paddingVertical: 16,
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      ...theme.shadows.md,
    },
    startBtnText: { color: 'white', fontSize: theme.fs(15), fontWeight: '800' },

    filterRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 8,
    },
    filterBtn: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      backgroundColor: theme.colors.surface,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterBtnActive: {
      backgroundColor: theme.colors.textPrimary,
      borderColor: theme.colors.textPrimary,
    },
    filterText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '700' },
    filterTextActive: { color: theme.colors.bg, fontWeight: '700' },

    listContent: { paddingBottom: 120 },

    row: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginHorizontal: 16,
      marginTop: 8,
      borderRadius: 16,
      ...theme.shadows.sm,
    },
    rowWord: {
      fontSize: theme.fs(18),
      fontFamily: theme.fonts.jpBold,
      color: theme.colors.textPrimary,
    },
    rowReading: {
      fontSize: theme.fs(11),
      color: theme.colors.textTertiary,
      marginTop: 2,
    },
    rowMeaning: {
      fontSize: theme.fs(13),
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    rowMeta: { alignItems: 'flex-end', gap: 8 },
    rowMetaText: { fontSize: 10, color: theme.colors.textTertiary, fontWeight: '600' },
    delBtn: {
      padding: 6,
      backgroundColor: theme.colors.errorSoft,
      borderRadius: 8,
    },

    empty: { padding: 40, alignItems: 'center', gap: 12, marginTop: 20 },
    emptyText: {
      color: theme.colors.textSecondary,
      fontSize: theme.fs(13),
      textAlign: 'center',
      lineHeight: theme.fs(20),
    },

    cardWrap: {
      flex: 1,
      margin: 20,
      padding: 28,
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.lg,
    },
    closeBtn: {
      position: 'absolute',
      top: 16,
      right: 16,
      padding: 6,
    },
    cardWord: {
      fontSize: theme.fs(48),
      fontFamily: theme.fonts.jpBold,
      color: theme.colors.textPrimary,
      marginBottom: 12,
    },
    cardSpeakBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      marginBottom: 24,
    },
    cardSpeakIcon: {
      fontSize: theme.fs(13),
      color: theme.colors.primary,
      fontWeight: '700',
    },
    revealBtn: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: 999,
    },
    revealBtnText: { color: 'white', fontSize: theme.fs(15), fontWeight: '800' },
    cardBack: { alignItems: 'center', marginVertical: 16 },
    cardReading: {
      fontSize: theme.fs(16),
      color: theme.colors.textTertiary,
      marginBottom: 8,
    },
    cardMeaning: {
      fontSize: theme.fs(20),
      color: theme.colors.textPrimary,
      textAlign: 'center',
      fontWeight: '600',
    },
    gradeRow: { flexDirection: 'row', gap: 8, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' },
    grade: {
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 12,
      minWidth: 64,
      alignItems: 'center',
    },
    gradeText: { fontSize: 13, fontWeight: '800' },
  });
