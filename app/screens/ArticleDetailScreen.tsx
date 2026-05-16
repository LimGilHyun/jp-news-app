import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  LayoutChangeEvent,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import {
  Volume2,
  ExternalLink,
  Languages,
  FileText,
  Save,
  ChevronLeft,
  ChevronRight,
  Type,
} from 'lucide-react-native';

import {
  TokenizedArticle,
  GrammarMatchHit,
} from '../components/TokenizedArticle';
import { TTSPlayer, TTSState } from '../components/TTSPlayer';
import {
  GrammarSection,
  QuizSection,
  VocabSection,
} from '../components/LearningTools';
import { useArticleStore } from '../stores/articleStore';
import { useHighlightStore } from '../stores/highlightStore';
import { useSettingsStore } from '../stores/settingsStore';
import { Difficulty, Token } from '../types/article';
import { RootStackParamList } from '../App';
import { useTheme, Theme } from '../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleDetail'>;

const JLPT_HUE: Record<Difficulty, { light: [string, string]; dark: [string, string] }> = {
  N5: { light: ['#bbf7d0', '#16a34a'], dark: ['#14532d', '#86efac'] },
  N4: { light: ['#bfdbfe', '#2563eb'], dark: ['#1e3a8a', '#93c5fd'] },
  N3: { light: ['#fde68a', '#ca8a04'], dark: ['#713f12', '#fde047'] },
  N2: { light: ['#fed7aa', '#ea580c'], dark: ['#7c2d12', '#fdba74'] },
  N1: { light: ['#fecaca', '#dc2626'], dark: ['#7f1d1d', '#fca5a5'] },
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  } catch {
    return iso;
  }
}

export default function ArticleDetailScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const { article, siblingIds } = route.params;
  const allArticles = useArticleStore((s) => s.articles);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const showKoTranslation = useSettingsStore((s) => s.showKoTranslation);
  const toggleKoTranslation = useSettingsStore((s) => s.toggleKoTranslation);
  const showKoReading = useSettingsStore((s) => s.showKoReading);
  const toggleKoReading = useSettingsStore((s) => s.toggleKoReading);
  const viewMode = useSettingsStore((s) => s.viewMode);
  const toggleViewMode = useSettingsStore((s) => s.toggleViewMode);
  const furiganaEnabled = useSettingsStore((s) => s.furiganaEnabled);
  const toggleFurigana = useSettingsStore((s) => s.toggleFurigana);
  // 형광펜 모드는 dragSel 의 존재로 판단 — 별도 mode state 없음
  const [dragSel, setDragSel] = useState<{
    sentenceIdx: number;
    start: number;
    end: number;
  } | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const grammarSectionYRef = useRef<number>(0);
  const [highlightGrammarIdx, setHighlightGrammarIdx] = useState<number | null>(null);

  const handleSeeRelatedGrammar = (grammarIdx: number) => {
    setHighlightGrammarIdx(grammarIdx);
    scrollRef.current?.scrollTo({
      y: Math.max(0, grammarSectionYRef.current - 16),
      animated: true,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const onLearningSectionLayout = (e: LayoutChangeEvent) => {
    grammarSectionYRef.current = e.nativeEvent.layout.y;
  };

  const markAsRead = useArticleStore((s) => s.markAsRead);
  const allHighlights = useHighlightStore((s) => s.highlights);
  const highlights = useMemo(
    () => allHighlights.filter((h) => h.articleId === article.id),
    [allHighlights, article.id]
  );
  const loadHighlights = useHighlightStore((s) => s.loadHighlights);
  const addHighlight = useHighlightStore((s) => s.addHighlight);

  useEffect(() => {
    if (!article.isRead) markAsRead(article.id);
    loadHighlights();
    return () => {
      Speech.stop();
    };
  }, [article.id, article.isRead, markAsRead, loadHighlights]);

  const handleTokenPress = (sentenceIdx: number, _token: Token, tIdx: number) => {
    // 형광펜 모드 (dragSel 존재) → 같은 문장이면 끝점 확장
    if (dragSel && dragSel.sentenceIdx === sentenceIdx) {
      setDragSel({ sentenceIdx, start: dragSel.start, end: tIdx });
      return;
    }
    // 다른 문장 탭 → 기존 선택 해제하고 일반 팝업
    if (dragSel) setDragSel(null);
    const newKey = `${sentenceIdx}-${tIdx}`;
    setSelectedKey((prev) => (prev === newKey ? null : newKey));
  };

  const handleTokenLongPress = (sentenceIdx: number, _token: Token, tIdx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedKey(null);
    setDragSel({ sentenceIdx, start: tIdx, end: tIdx });
  };

  const cancelDragSel = () => {
    setDragSel(null);
  };

  const saveHighlight = async () => {
    if (!dragSel) return;
    const sentence = article.sentences.find((s) => s.idx === dragSel.sentenceIdx);
    if (!sentence) return;
    const lo = Math.min(dragSel.start, dragSel.end);
    const hi = Math.max(dragSel.start, dragSel.end);
    const selected = sentence.tokens.slice(lo, hi + 1);
    const text = selected.map((t) => t.surface).join('');
    const reading = selected.map((t) => t.reading).join(' ');
    const meaning = selected.map((t) => t.meaning).join(' / ');
    try {
      await addHighlight({
        articleId: article.id,
        sentenceIdx: dragSel.sentenceIdx,
        startTokenIdx: lo,
        endTokenIdx: hi,
        selectedText: text,
        reading,
        meaning,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setDragSel(null);
      Alert.alert('단어장에 추가됨', `'${text}' 가 SRS 단어장에 저장되었습니다.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('저장 실패', msg);
    }
  };

  // ── TTS 플레이어 ─────────────────────────────────────
  const [ttsState, setTtsState] = useState<TTSState>('idle');
  const [ttsCurrentIdx, setTtsCurrentIdx] = useState(0);
  const [ttsRate, setTtsRate] = useState(1.0);
  const [ttsVolume, setTtsVolume] = useState(1.0);
  const [ttsElapsedSec, setTtsElapsedSec] = useState(0);
  const ttsActiveRef = useRef(false);
  const ttsCurrentIdxRef = useRef(0);
  const ttsStartedAtRef = useRef(0);
  const ttsBaseElapsedRef = useRef(0);
  // 단일 문장 듣기 모드: true면 한 문장 끝나도 다음 문장으로 advance하지 않고 idle.
  const ttsSingleModeRef = useRef(false);

  const ttsSentences = useMemo(
    () => article.sentences.filter((s) => s.text_jp.trim().length > 0),
    [article.sentences]
  );
  const ttsTotal = ttsSentences.length;

  // 문장별 발화 추정 시간 (초)
  // 0.12 → 0.18: 일본어는 한자 한 글자당 음절 수가 1~3개이고 TTS 엔진의 호흡·구두점 pause까지 포함하면
  // 글자당 ~0.18초가 실측에 가깝다. 너무 짧게 잡으면 progress bar가 음성보다 빨리 끝나 plyer가 사라짐.
  const sentenceDurations = useMemo(
    () => ttsSentences.map((s) => (s.text_jp.length * 0.18) / Math.max(0.5, ttsRate)),
    [ttsSentences, ttsRate]
  );
  const estimatedSeconds = useMemo(
    () => Math.round(sentenceDurations.reduce((a, b) => a + b, 0)),
    [sentenceDurations]
  );

  // 재생 중일 때 200ms 간격으로 elapsed 업데이트
  useEffect(() => {
    if (ttsState !== 'playing') return;
    const id = setInterval(() => {
      const delta = (Date.now() - ttsStartedAtRef.current) / 1000;
      setTtsElapsedSec(ttsBaseElapsedRef.current + delta);
    }, 200);
    return () => clearInterval(id);
  }, [ttsState]);

  const speakSentenceAt = (idx: number, elapsedOverride?: number) => {
    if (!ttsActiveRef.current) return;
    if (idx < 0 || idx >= ttsTotal) {
      // 모든 문장 재생 끝 — OS 측 음성도 명시적으로 정지해야 잔여 음성/화면 mismatch 방지
      Speech.stop();
      ttsActiveRef.current = false;
      ttsSingleModeRef.current = false;
      setTtsState('idle');
      setTtsCurrentIdx(0);
      ttsCurrentIdxRef.current = 0;
      setTtsElapsedSec(0);
      ttsBaseElapsedRef.current = 0;
      return;
    }
    const s = ttsSentences[idx];
    setTtsCurrentIdx(idx);
    ttsCurrentIdxRef.current = idx;
    // base 설정: seek로 들어온 elapsedOverride가 있으면 그 값을(슬라이더 위치 그대로) 표시,
    // 없으면 이전 문장들 누적 시간.
    ttsBaseElapsedRef.current =
      typeof elapsedOverride === 'number'
        ? elapsedOverride
        : sentenceDurations.slice(0, idx).reduce((a, b) => a + b, 0);
    ttsStartedAtRef.current = Date.now();
    setTtsElapsedSec(ttsBaseElapsedRef.current);
    let advanced = false;
    const advance = () => {
      if (advanced) return;
      advanced = true;
      if (!ttsActiveRef.current) return;
      // 단일 문장 모드면 다음 문장으로 가지 않고 즉시 종료
      if (ttsSingleModeRef.current) {
        speakSentenceAt(ttsTotal); // out-of-range → idle 처리 분기로
        return;
      }
      // 다음 문장. ref로 현재 idx 비교해서 외부 seek로 바뀐 경우는 advance 무시
      if (ttsCurrentIdxRef.current === idx) {
        speakSentenceAt(idx + 1);
      }
    };
    Speech.speak(s.text_jp, {
      language: 'ja-JP',
      rate: ttsRate * 0.95,
      volume: ttsVolume,
      onDone: advance,
      onError: advance,
    });
    // onDone 미발화 대비 fallback — 글자당 180ms × 1.5배 + 1.5초 buffer.
    // 너무 짧으면 음성이 아직 나오는데 다음 문장으로 넘어가 progress bar가 음성보다 빨리 끝나는 사고 발생.
    // onDone이 정상 발화되면 advanced=true 라서 fallback이 fire 돼도 무시됨.
    const estMs = (s.text_jp.length * 180) / Math.max(0.5, ttsRate);
    setTimeout(() => {
      if (advanced || !ttsActiveRef.current) return;
      advance();
    }, Math.round(estMs * 1.5) + 1500);
  };

  const speakAll = () => {
    Speech.stop();
    if (ttsTotal === 0) return;
    ttsSingleModeRef.current = false;
    ttsActiveRef.current = true;
    setTtsState('playing');
    speakSentenceAt(0);
  };

  // 문장별 "듣기" 버튼 — TTSPlayer가 활성화되어 시간 표기, 한 문장 끝나면 자동 정지
  const speakSingleSentence = (sentenceIdx: number) => {
    // article.sentences 기준 idx → ttsSentences(공백 문장 제외) 기준 idx로 매핑
    const ttsIdx = ttsSentences.findIndex((s) => s.idx === sentenceIdx);
    if (ttsIdx < 0) return;
    Speech.stop();
    ttsSingleModeRef.current = true;
    ttsActiveRef.current = true;
    setTtsState('playing');
    speakSentenceAt(ttsIdx);
  };

  const ttsPause = () => {
    ttsActiveRef.current = false;
    Speech.stop();
    setTtsState('paused');
  };

  const ttsResume = () => {
    ttsActiveRef.current = true;
    setTtsState('playing');
    speakSentenceAt(ttsCurrentIdxRef.current);
  };

  const ttsStop = () => {
    ttsActiveRef.current = false;
    ttsSingleModeRef.current = false;
    Speech.stop();
    setTtsState('idle');
    setTtsCurrentIdx(0);
    ttsCurrentIdxRef.current = 0;
  };

  const ttsSeek = (idx: number, elapsedOverride?: number) => {
    Speech.stop();
    // seek은 항상 전체 모드 — 슬라이더로 점프 후엔 다음 문장으로 이어서 재생되어야 자연스러움
    ttsSingleModeRef.current = false;
    ttsCurrentIdxRef.current = idx;
    setTtsCurrentIdx(idx);
    if (ttsState === 'playing') {
      ttsActiveRef.current = true;
      speakSentenceAt(idx, elapsedOverride);
    } else if (typeof elapsedOverride === 'number') {
      // 재생 중이 아니면 음성은 안 나가도 progress bar 위치는 슬라이더 따라 이동
      ttsBaseElapsedRef.current = elapsedOverride;
      setTtsElapsedSec(elapsedOverride);
    }
  };

  const openSource = () => {
    if (article.sourceUrl) {
      Linking.openURL(article.sourceUrl).catch(() => {
        Alert.alert('열기 실패', '브라우저로 원문을 열 수 없습니다.');
      });
    }
  };

  const jlptHue = article.difficulty
    ? theme.isDark
      ? JLPT_HUE[article.difficulty].dark
      : JLPT_HUE[article.difficulty].light
    : null;

  const currentSiblingIdx = useMemo(() => {
    if (!siblingIds || siblingIds.length === 0) return -1;
    return siblingIds.indexOf(article.id);
  }, [siblingIds, article.id]);

  const goSibling = (delta: -1 | 1) => {
    if (currentSiblingIdx < 0 || !siblingIds) return;
    const nextIdx = currentSiblingIdx + delta;
    if (nextIdx < 0 || nextIdx >= siblingIds.length) return;
    const nextArticle = allArticles.find((a) => a.id === siblingIds[nextIdx]);
    if (!nextArticle) return;
    Haptics.selectionAsync().catch(() => {});
    navigation.replace('ArticleDetail', { article: nextArticle, siblingIds });
  };

  const hasPrev = currentSiblingIdx > 0;
  const hasNext =
    currentSiblingIdx >= 0 && siblingIds != null && currentSiblingIdx < siblingIds.length - 1;

  const grammarMatches: GrammarMatchHit[] = useMemo(() => {
    return article.grammarPoints.flatMap((g, idx) =>
      (g.match_indices ?? []).map((m) => ({
        sentenceIdx: m.sentenceIdx,
        startTokenIdx: m.startTokenIdx,
        endTokenIdx: m.endTokenIdx,
        grammarIdx: idx,
      }))
    );
  }, [article.grammarPoints]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {article.thumbnailUrl ? (
          <Image
            source={{ uri: article.thumbnailUrl }}
            style={styles.hero}
            resizeMode="cover"
          />
        ) : null}

        <View style={styles.headerSection}>
          <View style={styles.metaRow}>
            <Text style={styles.source}>{article.source}</Text>
            {article.difficulty && jlptHue && (
              <View style={[styles.jlptBadge, { backgroundColor: jlptHue[0] }]}>
                <Text style={[styles.jlptBadgeText, { color: jlptHue[1] }]}>
                  {article.difficulty}
                </Text>
              </View>
            )}
            <Text style={styles.date}>{formatDate(article.publishedAt)}</Text>
          </View>

          <Text style={styles.titleJp} selectable>
            {article.titleJp}
          </Text>
          {article.titleKo.length > 0 && (
            <Text style={styles.titleKo} selectable>
              {article.titleKo}
            </Text>
          )}
        </View>

        <View style={styles.toolbar}>
          <Pressable onPress={speakAll} style={styles.toolBtn}>
            <Volume2 size={13} color={theme.colors.textSecondary} strokeWidth={2.4} />
            <Text style={styles.toolBtnText}>듣기</Text>
          </Pressable>

          {article.sourceUrl ? (
            <Pressable onPress={openSource} style={styles.toolBtn}>
              <ExternalLink size={13} color={theme.colors.textSecondary} strokeWidth={2.4} />
              <Text style={styles.toolBtnText}>원문</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              toggleKoTranslation();
            }}
            style={[styles.toolBtn, showKoTranslation && styles.toolBtnActive]}
          >
            <Languages
              size={13}
              color={showKoTranslation ? theme.colors.primary : theme.colors.textSecondary}
              strokeWidth={2.4}
            />
            <Text
              style={[
                styles.toolBtnText,
                showKoTranslation && styles.toolBtnTextActive,
              ]}
            >
              번역
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              toggleKoReading();
            }}
            style={[styles.toolBtn, showKoReading && styles.toolBtnActive]}
          >
            <Languages
              size={13}
              color={showKoReading ? theme.colors.primary : theme.colors.textSecondary}
              strokeWidth={2.4}
            />
            <Text
              style={[
                styles.toolBtnText,
                showKoReading && styles.toolBtnTextActive,
              ]}
            >
              발음
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              toggleFurigana();
            }}
            style={[styles.toolBtn, furiganaEnabled && styles.toolBtnActive]}
          >
            <Type
              size={13}
              color={furiganaEnabled ? theme.colors.primary : theme.colors.textSecondary}
              strokeWidth={2.4}
            />
            <Text
              style={[
                styles.toolBtnText,
                furiganaEnabled && styles.toolBtnTextActive,
              ]}
            >
              후리가나
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              toggleViewMode();
            }}
            style={[styles.toolBtn, viewMode !== 'tokenized' && styles.toolBtnActive]}
          >
            <FileText
              size={13}
              color={viewMode !== 'tokenized' ? theme.colors.primary : theme.colors.textSecondary}
              strokeWidth={2.4}
            />
            <Text
              style={[
                styles.toolBtnText,
                viewMode !== 'tokenized' && styles.toolBtnTextActive,
              ]}
            >
              {viewMode === 'tokenized' ? '학습' : viewMode === 'original' ? '간략' : '정리'}
            </Text>
          </Pressable>
        </View>

        {dragSel && (
          <View style={styles.highlightBar}>
            <Text style={styles.highlightHint}>
              끝 단어를 탭해 범위 확장 → 저장
            </Text>
            <Pressable onPress={cancelDragSel} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>취소</Text>
            </Pressable>
            <Pressable onPress={saveHighlight} style={styles.saveBtn}>
              <Save size={13} color="#fff" strokeWidth={2.5} />
              <Text style={styles.saveBtnText}>저장</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.learningSection} onLayout={onLearningSectionLayout}>
          {(article.grammarPoints?.length ?? 0) === 0 &&
          (article.keyVocab?.length ?? 0) === 0 &&
          (article.quiz?.length ?? 0) === 0 ? (
            <View style={styles.learningEmptyCard}>
              <Text style={styles.learningEmptyTitle}>학습 콘텐츠 준비 중</Text>
              <Text style={styles.learningEmptyText}>
                이 기사의 문법 · 어휘 · 퀴즈 자료가 아직 생성되지 않았습니다.
                다음 자동 수집 사이클(매일 06:00 KST)에 업데이트되거나, 관리자가 백필 작업을 실행하면 표시됩니다.
              </Text>
            </View>
          ) : (
            <>
              <GrammarSection
                items={article.grammarPoints}
                highlightIdx={highlightGrammarIdx}
                onClearHighlight={() => setHighlightGrammarIdx(null)}
                forceExpanded={viewMode === 'summary' ? true : undefined}
              />
              <VocabSection
                items={article.keyVocab}
                forceExpanded={viewMode === 'summary' ? true : undefined}
              />
              <QuizSection
                items={article.quiz}
                onSeeRelatedGrammar={handleSeeRelatedGrammar}
                forceExpanded={viewMode === 'summary' ? true : undefined}
              />
            </>
          )}
        </View>

        <View style={styles.body}>
          {viewMode === 'summary' ? (
            <View style={styles.originalCard}>
              <Text style={styles.originalLabel}>정리 — 어휘 / 문법 / 퀴즈</Text>
              <Text style={[styles.originalKoText, { fontSize: 12, marginBottom: 12 }]}>
                이 화면은 본문 없이 학습 도구만 모아 보여줍니다. 본문을 보려면 위 툴바의 "학습" 또는 "원문" 모드로 전환하세요.
              </Text>
            </View>
          ) : viewMode === 'original' ? (
            <View style={styles.originalCard}>
              <Text style={styles.originalLabel}>원문 (수집된 본문)</Text>
              <Text style={styles.originalText} selectable>
                {article.bodyJp}
              </Text>
              {article.bodyKo.length > 0 && (
                <>
                  <View style={styles.originalDivider} />
                  <Text style={styles.originalLabel}>한국어 번역</Text>
                  <Text style={styles.originalKoText} selectable>
                    {article.bodyKo}
                  </Text>
                </>
              )}
              <View style={styles.originalCopyHint}>
                <Text style={styles.originalCopyHintText}>
                  💡 길게 누르면 텍스트를 드래그해 복사할 수 있습니다
                </Text>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                if (selectedKey) setSelectedKey(null);
              }}
              style={styles.studyCard}
            >
              {grammarMatches.length > 0 && (
                <View style={styles.grammarLegend}>
                  <View style={styles.grammarLegendDash} />
                  <Text style={styles.grammarLegendText}>
                    보라색 점선: 학습할 문법 패턴 — 탭하면 자세히
                  </Text>
                </View>
              )}
              <TokenizedArticle
                sentences={article.sentences}
                showKoTranslation={showKoTranslation}
                showKoReading={showKoReading}
                highlights={highlights.map((h) => ({
                  sentenceIdx: h.sentenceIdx,
                  startTokenIdx: h.startTokenIdx,
                  endTokenIdx: h.endTokenIdx,
                }))}
                grammarMatches={dragSel ? [] : grammarMatches}
                selectedTokenKey={selectedKey}
                dragSelection={dragSel}
                activeSentenceIdx={
                  ttsState !== 'idle' && ttsSentences[ttsCurrentIdx]
                    ? ttsSentences[ttsCurrentIdx].idx
                    : null
                }
                showFurigana={furiganaEnabled}
                onTokenPress={handleTokenPress}
                onTokenLongPress={handleTokenLongPress}
                onGrammarMatchPress={handleSeeRelatedGrammar}
                onSentenceSpeak={speakSingleSentence}
              />
              {/* JLPT 색상 범례 — 본문 맨 아래 */}
              <View style={styles.jlptLegend}>
                {(['N5', 'N4', 'N3', 'N2', 'N1'] as const).map((lv) => {
                  const colors: Record<typeof lv, [string, string]> = {
                    N5: ['#16a34a', '#86efac'],
                    N4: ['#2563eb', '#93c5fd'],
                    N3: ['#ca8a04', '#fde047'],
                    N2: ['#ea580c', '#fdba74'],
                    N1: ['#dc2626', '#fca5a5'],
                  };
                  const c = theme.isDark ? colors[lv][1] : colors[lv][0];
                  return (
                    <View key={lv} style={styles.jlptLegendItem}>
                      <View style={[styles.jlptLegendBar, { backgroundColor: c }]} />
                      <Text style={[styles.jlptLegendText, { color: c }]}>{lv}</Text>
                    </View>
                  );
                })}
                <Text style={styles.jlptLegendHint}>밑줄 색상 = 난이도</Text>
              </View>
            </Pressable>
          )}
        </View>

        {currentSiblingIdx >= 0 && (siblingIds?.length ?? 0) > 1 && (
          <View style={styles.siblingNav}>
            <Pressable
              onPress={() => goSibling(-1)}
              disabled={!hasPrev}
              style={[styles.siblingBtn, !hasPrev && styles.siblingBtnDisabled]}
            >
              <ChevronLeft
                size={16}
                color={hasPrev ? theme.colors.textPrimary : theme.colors.textTertiary}
                strokeWidth={2.4}
              />
              <Text
                style={[
                  styles.siblingBtnText,
                  !hasPrev && { color: theme.colors.textTertiary },
                ]}
              >
                이전 기사
              </Text>
            </Pressable>
            <Text style={styles.siblingCounter}>
              {currentSiblingIdx + 1} / {siblingIds?.length ?? 1}
            </Text>
            <Pressable
              onPress={() => goSibling(1)}
              disabled={!hasNext}
              style={[styles.siblingBtn, !hasNext && styles.siblingBtnDisabled]}
            >
              <Text
                style={[
                  styles.siblingBtnText,
                  !hasNext && { color: theme.colors.textTertiary },
                ]}
              >
                다음 기사
              </Text>
              <ChevronRight
                size={16}
                color={hasNext ? theme.colors.textPrimary : theme.colors.textTertiary}
                strokeWidth={2.4}
              />
            </Pressable>
          </View>
        )}

        <Text style={styles.footnote} selectable>
          출처: {article.source} · {formatDate(article.publishedAt)}
        </Text>
      </ScrollView>

      <TTSPlayer
        state={ttsState}
        currentIdx={ttsCurrentIdx}
        totalCount={ttsTotal}
        estimatedSeconds={estimatedSeconds}
        elapsedSec={ttsElapsedSec}
        rate={ttsRate}
        volume={ttsVolume}
        onPlay={speakAll}
        onPause={ttsPause}
        onResume={ttsResume}
        onStop={ttsStop}
        onSeek={ttsSeek}
        onSeekSec={(sec) => {
          // 초 → 가장 가까운 문장 인덱스로 매핑. 단, progress bar는 사용자가 끈 위치(sec)
          // 그대로 표시되어야 자연스러우므로 elapsedOverride로 sec을 강제 전달.
          let acc = 0;
          let targetIdx = 0;
          for (let i = 0; i < sentenceDurations.length; i++) {
            if (acc + sentenceDurations[i] >= sec) {
              targetIdx = i;
              break;
            }
            acc += sentenceDurations[i];
            targetIdx = i + 1;
          }
          if (targetIdx >= ttsTotal) targetIdx = ttsTotal - 1;
          ttsSeek(targetIdx, sec);
        }}
        onChangeRate={(r) => {
          setTtsRate(r);
          if (ttsState === 'playing') {
            Speech.stop();
            speakSentenceAt(ttsCurrentIdxRef.current);
          }
        }}
        onChangeVolume={setTtsVolume}
      />
    </SafeAreaView>
  );
}

const useStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    scroll: { paddingBottom: 60 },
    hero: { width: '100%', height: 220, backgroundColor: theme.colors.surfaceMuted },

    headerSection: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 18,
      backgroundColor: theme.colors.bgElevated,
    },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    source: { fontSize: 12, fontWeight: '800', color: theme.colors.error, letterSpacing: 0.4 },
    jlptBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
    jlptBadgeText: { fontSize: 10, fontWeight: '800' },
    date: { fontSize: 12, color: theme.colors.textTertiary, marginLeft: 'auto' },

    titleJp: {
      fontSize: theme.fs(20),
      fontFamily: theme.fonts.jpBold,
      color: theme.colors.textPrimary,
      lineHeight: theme.fs(28),
      marginBottom: 6,
      includeFontPadding: false,
    },
    titleKo: {
      fontSize: theme.fs(13),
      fontFamily: theme.fonts.body,
      color: theme.colors.textSecondary,
      lineHeight: theme.fs(20),
      marginBottom: 14,
    },

    actionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.colors.surfaceMuted,
    },
    actionBtnText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '700' },

    toolbar: {
      flexDirection: 'row',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: theme.colors.bgElevated,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
    },
    toolBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 7,
      borderRadius: 8,
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    toolBtnActive: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
    },
    toolBtnHighlight: {
      backgroundColor: theme.colors.warningSoft,
      borderColor: theme.colors.warning,
    },
    toolBtnText: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '700' },
    toolBtnTextActive: { color: theme.colors.primary },
    toolBtnTextHighlight: { color: theme.colors.warning },

    highlightBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: theme.colors.warningSoft,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.warning,
    },
    highlightHint: { fontSize: 12, color: theme.colors.warning, flex: 1, fontWeight: '600' },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
    },
    saveBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
    cancelBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.colors.surfaceMuted,
      marginRight: 6,
    },
    cancelBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },

    body: { padding: 16 },
    studyCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 18,
      ...theme.shadows.sm,
    },
    grammarLegend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
      marginBottom: 10,
      borderRadius: 10,
      backgroundColor: theme.colors.accentSoft,
    },
    grammarLegendDash: {
      width: 24,
      height: 0,
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.accent,
      borderStyle: 'dashed' as const,
    },
    grammarLegendText: {
      flex: 1,
      fontSize: 11,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.accent,
    },
    jlptLegend: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 8,
      marginTop: 16,
      borderRadius: 10,
      backgroundColor: theme.colors.surfaceMuted,
    },
    jlptLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    jlptLegendBar: {
      width: 14,
      height: 2,
      borderRadius: 1,
    },
    jlptLegendText: {
      fontSize: 10,
      fontFamily: theme.fonts.numBold,
    },
    jlptLegendHint: {
      flex: 1,
      textAlign: 'right',
      fontSize: 10,
      fontFamily: theme.fonts.bodyMedium,
      color: theme.colors.textTertiary,
    },
    originalCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 20,
      ...theme.shadows.sm,
    },
    originalLabel: {
      fontSize: 11,
      color: theme.colors.textTertiary,
      fontWeight: '800',
      marginBottom: 10,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    originalText: {
      fontSize: theme.fs(16),
      fontFamily: theme.fonts.jp,
      lineHeight: theme.fs(28),
      color: theme.colors.textPrimary,
      includeFontPadding: false,
    },
    originalDivider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 18 },
    originalKoText: {
      fontSize: theme.fs(14),
      lineHeight: theme.fs(24),
      color: theme.colors.textSecondary,
    },
    originalCopyHint: {
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    originalCopyHintText: {
      fontSize: 11,
      color: theme.colors.textTertiary,
      fontWeight: '500',
    },

    learningSection: { paddingHorizontal: 16, paddingTop: 4 },
    learningEmptyCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      gap: 6,
    },
    learningEmptyTitle: {
      fontSize: theme.fs(13),
      fontFamily: theme.fonts.bodyBlack,
      color: theme.colors.textPrimary,
    },
    learningEmptyText: {
      fontSize: theme.fs(12),
      lineHeight: theme.fs(17),
      fontFamily: theme.fonts.body,
      color: theme.colors.textSecondary,
    },

    siblingNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 16,
      marginTop: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      ...theme.shadows.sm,
    },
    siblingBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 999,
    },
    siblingBtnDisabled: { opacity: 0.5 },
    siblingBtnText: {
      fontSize: 13,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textPrimary,
    },
    siblingCounter: {
      fontSize: 11,
      fontFamily: theme.fonts.numBold,
      color: theme.colors.textTertiary,
    },

    footnote: {
      marginTop: 24,
      fontSize: 11,
      color: theme.colors.textTertiary,
      textAlign: 'center',
    },
  });
