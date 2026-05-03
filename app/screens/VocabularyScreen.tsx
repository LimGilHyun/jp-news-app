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
import * as Speech from 'expo-speech';

import { useHighlightStore } from '../stores/highlightStore';
import { isDue } from '../utils/srs';
import { Highlight, QUALITY, Quality } from '../types/article';

export default function VocabularyScreen() {
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
    setActiveReview(h);
    setRevealed(false);
  };

  const grade = async (q: Quality) => {
    if (!activeReview) return;
    await reviewHighlight(activeReview.id, q);
    // 다음 due 카드로 이동
    const remaining = highlights.filter(
      (h) => h.id !== activeReview.id && isDue(h)
    );
    if (remaining.length > 0) {
      setActiveReview(remaining[0]);
      setRevealed(false);
    } else {
      setActiveReview(null);
      Alert.alert('복습 완료', '오늘 복습할 카드를 모두 끝냈습니다.');
    }
  };

  if (activeReview) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.cardWrap}>
          <Text style={styles.cardWord}>{activeReview.selectedText}</Text>
          <Pressable
            onPress={() =>
              Speech.speak(activeReview.selectedText, { language: 'ja-JP', rate: 0.9 })
            }
            style={styles.cardSpeakBtn}
          >
            <Text style={styles.cardSpeakIcon}>🔊 발음 듣기</Text>
          </Pressable>

          {revealed ? (
            <View style={styles.cardBack}>
              {!!activeReview.reading && (
                <Text style={styles.cardReading}>{activeReview.reading}</Text>
              )}
              <Text style={styles.cardMeaning}>{activeReview.meaning ?? '(뜻 없음)'}</Text>
            </View>
          ) : (
            <Pressable onPress={() => setRevealed(true)} style={styles.revealBtn}>
              <Text style={styles.revealBtnText}>뜻 보기</Text>
            </Pressable>
          )}

          {revealed && (
            <View style={styles.gradeRow}>
              <Pressable onPress={() => grade(QUALITY.AGAIN)} style={[styles.grade, styles.gAgain]}>
                <Text style={styles.gradeText}>다시</Text>
              </Pressable>
              <Pressable onPress={() => grade(QUALITY.HARD)} style={[styles.grade, styles.gHard]}>
                <Text style={styles.gradeText}>어려움</Text>
              </Pressable>
              <Pressable onPress={() => grade(QUALITY.GOOD)} style={[styles.grade, styles.gGood]}>
                <Text style={styles.gradeText}>좋음</Text>
              </Pressable>
              <Pressable onPress={() => grade(QUALITY.EASY)} style={[styles.grade, styles.gEasy]}>
                <Text style={styles.gradeText}>쉬움</Text>
              </Pressable>
            </View>
          )}
        </View>

        <Pressable
          onPress={() => {
            setActiveReview(null);
            setRevealed(false);
          }}
          style={styles.exitBtn}
        >
          <Text style={styles.exitBtnText}>복습 종료</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const dueCount = highlights.filter((h) => isDue(h)).length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          오늘 복습할 단어 {dueCount}개 / 전체 {highlights.length}개
        </Text>
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

      {dueCount > 0 && (
        <Pressable
          onPress={() => startReview(highlights.filter((h) => isDue(h))[0])}
          style={styles.startBtn}
        >
          <Text style={styles.startBtnText}>오늘의 복습 시작</Text>
        </Pressable>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable onPress={() => startReview(item)} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowWord}>{item.selectedText}</Text>
              {!!item.reading && <Text style={styles.rowReading}>{item.reading}</Text>}
              {!!item.meaning && (
                <Text style={styles.rowMeaning} numberOfLines={1}>
                  {item.meaning}
                </Text>
              )}
            </View>
            <View style={styles.rowMeta}>
              <Text style={styles.rowMetaText}>
                다음: {new Date(item.nextReviewAt).toLocaleDateString('ko-KR')}
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
                <Text style={styles.delBtnText}>삭제</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              아직 단어장이 비어있습니다. 기사 화면에서 토큰을 길게 눌러 형광펜으로 저장해보세요.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  summary: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#dbeafe',
  },
  summaryText: { fontSize: 14, color: '#1e40af', fontWeight: '600', marginBottom: 8 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#ffffff', borderRadius: 4 },
  filterBtnActive: { backgroundColor: '#1d4ed8' },
  filterText: { fontSize: 12, color: '#475569' },
  filterTextActive: { color: 'white', fontWeight: '700' },
  startBtn: {
    margin: 12,
    paddingVertical: 14,
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    alignItems: 'center',
  },
  startBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  listContent: { paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rowWord: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  rowReading: { fontSize: 12, color: '#64748b', marginTop: 2 },
  rowMeaning: { fontSize: 13, color: '#334155', marginTop: 4 },
  rowMeta: { alignItems: 'flex-end', gap: 6 },
  rowMetaText: { fontSize: 11, color: '#94a3b8' },
  delBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#fee2e2',
    borderRadius: 4,
  },
  delBtnText: { fontSize: 11, color: '#b91c1c' },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // Review card
  cardWrap: {
    flex: 1,
    margin: 24,
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardWord: { fontSize: 48, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  cardSpeakBtn: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 24,
  },
  cardSpeakIcon: { fontSize: 14, color: '#1d4ed8', fontWeight: '600' },
  revealBtn: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  revealBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  cardBack: { alignItems: 'center', marginVertical: 16 },
  cardReading: { fontSize: 18, color: '#64748b', marginBottom: 8 },
  cardMeaning: { fontSize: 22, color: '#0f172a', textAlign: 'center' },
  gradeRow: { flexDirection: 'row', gap: 8, marginTop: 24 },
  grade: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 6 },
  gAgain: { backgroundColor: '#fee2e2' },
  gHard: { backgroundColor: '#fed7aa' },
  gGood: { backgroundColor: '#bbf7d0' },
  gEasy: { backgroundColor: '#bfdbfe' },
  gradeText: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  exitBtn: { padding: 16, alignItems: 'center' },
  exitBtnText: { color: '#64748b', fontSize: 13 },
});
