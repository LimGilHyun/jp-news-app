import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// expo-navigation-bar는 새 패키지라 일부 환경(Expo Go·번들 캐시 미반영 등)에서 모듈 로드가
// 실패할 수 있다. 실패 시 학습 화면 자체가 크래시 나는 걸 막기 위해 안전하게 require.
let NavigationBar: {
  setVisibilityAsync?: (v: 'visible' | 'hidden') => Promise<unknown>;
  setBehaviorAsync?: (v: 'overlay-swipe' | 'inset-swipe' | 'inset-touch') => Promise<unknown>;
} = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  NavigationBar = require('expo-navigation-bar');
} catch {
  // 모듈 미설치/번들 미반영 — 시스템 nav bar 숨김 기능만 비활성, 학습 화면은 정상 동작
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  ListChecks,
  Check,
  HelpCircle,
  X,
  Sparkles,
  Shuffle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme, Theme } from '../utils/theme';
import { ALL_STUDY_WORDS, STUDY_LEVEL_META } from '../data/jlptStudyWords';
import type { JlptStudyWord } from '../data/jlptStudyTypes';
import { useStudyStore } from '../stores/studyStore';
import type { CardStatus } from '../stores/studyStore';
import { useUiStore } from '../stores/uiStore';
import { applyAction, countByStatus, sortBySrsPriority } from '../utils/srsQueue';
import {
  conjugateIAdjective,
  conjugateVerb,
  isIAdjective,
  isVerb,
} from '../utils/conjugate';
import { StudyStackParamList } from '../App';

type Props = NativeStackScreenProps<StudyStackParamList, 'StudyCard'>;

const BATCH_SIZE = 20;

function buildBatch(
  allWords: JlptStudyWord[],
  progress: Record<string, any>,
  excludeJps: Set<string>
): JlptStudyWord[] {
  const sorted = sortBySrsPriority(allWords, progress);
  const unseen = sorted.filter((w) => !excludeJps.has(w.jp));
  const pool = unseen.length >= BATCH_SIZE ? unseen : sorted;
  return pool.slice(0, Math.min(BATCH_SIZE, pool.length));
}

// "나, 저" / "보다 / 만나다" 처럼 콤마·슬래시로 묶인 의미를 분리해 여러 뜻을 모두 표시한다.
function splitMeanings(meaning: string): string[] {
  if (!meaning) return [];
  return meaning
    .split(/\s*(?:[,，、/]|\s\/\s)\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// 예문 텍스트에서 단어가 등장하는 부분을 볼드 처리해 강조한다.
// jp 매칭이 없으면 kana 매칭도 시도 (예: 예문이 가나만 있는 경우).
function renderHighlightedExample(
  text: string,
  jp: string | undefined,
  kana: string | undefined,
  baseStyle: any,
  boldStyle: any,
  keyPrefix: string
): React.ReactNode {
  if (!text) return null;
  const candidates = [jp, kana].filter((s): s is string => !!s && text.includes(s));
  if (candidates.length === 0) {
    return (
      <Text style={baseStyle} selectable>
        {text}
      </Text>
    );
  }
  // 가장 긴 후보부터 사용 (kana만 매칭되더라도 jp가 더 정확하므로)
  const target = candidates.sort((a, b) => b.length - a.length)[0];
  const parts = text.split(target);
  return (
    <Text style={baseStyle} selectable>
      {parts.map((part, i) => (
        <React.Fragment key={`${keyPrefix}-${i}`}>
          {part}
          {i < parts.length - 1 && <Text style={boldStyle}>{target}</Text>}
        </React.Fragment>
      ))}
    </Text>
  );
}

// 마지막 본 시간을 사람이 읽기 쉬운 상대 시간으로 (방금 / 5분 전 / 어제 / 3일 전 ...)
function formatRelativeTime(iso?: string): string {
  if (!iso) return '';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const diffSec = Math.max(0, (Date.now() - t) / 1000);
  if (diffSec < 60) return '방금';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}일 전`;
  if (diffSec < 86400 * 30) return `${Math.floor(diffSec / (86400 * 7))}주 전`;
  return `${Math.floor(diffSec / (86400 * 30))}개월 전`;
}

// 단어에 명시된 example_jp가 없을 때 pos 기반으로 자연스러운 예문을 만들어 학습 시 보여준다.
// 정확한 의미 분석은 LLM 영역이라 어렵지만, 사용 맥락 + TTS 발음 학습엔 충분.
function getEffectiveExample(word: JlptStudyWord): {
  jp: string;
  kana: string;
  ko: string;
} {
  if (word.example_jp) {
    return {
      jp: word.example_jp,
      kana: word.example_kana ?? '',
      ko: word.example_ko ?? '',
    };
  }
  // 첫 번째 의미만 추출 (콤마/한자 표기 제거)
  const baseMeaning = (word.meaning ?? '')
    .split(/[,、/(]/)[0]
    .replace(/\s+/g, ' ')
    .trim();
  const pos = (word.pos ?? '명사').trim();

  if (pos === '인사' || pos === '응답' || pos.includes('감탄')) {
    return {
      jp: `${word.jp}！`,
      kana: `${word.kana}！`,
      ko: `${baseMeaning}!`,
    };
  }
  if (pos === '동사' || pos.includes('동사')) {
    return {
      jp: `毎日${word.jp}。`,
      kana: `まいにち${word.kana}。`,
      ko: `매일 ${baseMeaning}.`,
    };
  }
  if (pos === '형용사' || pos.includes('형용사')) {
    return {
      jp: `とても${word.jp}です。`,
      kana: `とても${word.kana}です。`,
      ko: `매우 ${baseMeaning}.`,
    };
  }
  if (pos === '부사' || pos.includes('부사')) {
    return {
      jp: `${word.jp}笑った。`,
      kana: `${word.kana}わらった。`,
      ko: `${baseMeaning} 웃었다.`,
    };
  }
  if (pos === '조사' || pos.includes('조사')) {
    return {
      jp: `これ${word.jp}。`,
      kana: `これ${word.kana}。`,
      ko: `이거${baseMeaning}.`,
    };
  }
  // 기본: 명사 — 'これは〜です。' 패턴
  return {
    jp: `これは${word.jp}です。`,
    kana: `これは${word.kana}です。`,
    ko: `이것은 ${baseMeaning}입니다.`,
  };
}

// 여러 맥락의 예문을 반환 (pos별 1~2개). 첫 항목은 `getEffectiveExample`과 동일.
function getMultipleExamples(word: JlptStudyWord): Array<{
  jp: string;
  kana: string;
  ko: string;
}> {
  const main = getEffectiveExample(word);
  const baseMeaning = (word.meaning ?? '').split(/[,、/(]/)[0].trim();
  const pos = (word.pos ?? '명사').trim();
  const out = [main];

  // 명시된 예문이 있는 경우 → 자동 생성된 두 번째 예문도 함께 보여주면 학습 효과 ↑
  if (word.example_jp) {
    out.push({
      jp: `これは${word.jp}です。`,
      kana: `これは${word.kana}です。`,
      ko: `이것은 ${baseMeaning}입니다.`,
    });
    return out;
  }

  if (pos === '명사' || (!pos.includes('동사') && !pos.includes('형용사') && !pos.includes('부사'))) {
    out.push({
      jp: `${word.jp}が好きです。`,
      kana: `${word.kana}がすきです。`,
      ko: `${baseMeaning}을(를) 좋아합니다.`,
    });
  } else if (pos.includes('동사')) {
    out.push({
      jp: `今日${word.jp}。`,
      kana: `きょう${word.kana}。`,
      ko: `오늘 ${baseMeaning}.`,
    });
  } else if (pos.includes('형용사')) {
    out.push({
      jp: `この本は${word.jp}です。`,
      kana: `このほんは${word.kana}です。`,
      ko: `이 책은 ${baseMeaning}.`,
    });
  } else if (pos.includes('부사')) {
    out.push({
      jp: `${word.jp}走る。`,
      kana: `${word.kana}はしる。`,
      ko: `${baseMeaning} 달린다.`,
    });
  }
  return out;
}

export default function StudyCardScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const { level } = route.params;

  const meta = STUDY_LEVEL_META[level];
  const allWords = useMemo(() => ALL_STUDY_WORDS[level] ?? [], [level]);

  const progress = useStudyStore((s) => s.progress);
  const setStatus = useStudyStore((s) => s.setStatus);
  const resetSessionStatuses = useStudyStore((s) => s.resetSessionStatuses);
  const cardTtsEnabled = useStudyStore((s) => s.cardTtsEnabled);
  const setCardTtsEnabled = useStudyStore((s) => s.setCardTtsEnabled);
  const setTabBarHidden = useUiStore((s) => s.setTabBarHidden);
  const setAdHidden = useUiStore((s) => s.setAdHidden);

  // 진입 시 첫 배치 (BATCH_SIZE개)만 로드
  const [queue, setQueue] = useState<JlptStudyWord[]>(() =>
    buildBatch(allWords, progress, new Set())
  );
  const [idx, setIdx] = useState(0);
  const [finished, setFinished] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  // 누적적으로 본 단어 (다음 배치 로드 시 제외용)
  const seenJpsRef = useRef<Set<string>>(new Set(queue.map((w) => w.jp)));

  const rotation = useSharedValue(0);

  const card = queue[idx];
  // 색별 카운트는 전체 단어 기준 (학습 진척 추적)
  const counts = useMemo(() => countByStatus(allWords, progress), [allWords, progress]);
  const answered = counts.unknown + counts.fuzzy + counts.known;
  const totalPct = allWords.length > 0 ? Math.round((answered / allWords.length) * 100) : 0;

  // === 탭바 + 광고 + 안드로이드 시스템 네비게이션 바 모두 숨김 ===
  useFocusEffect(
    useCallback(() => {
      setTabBarHidden(true);
      setAdHidden(true);
      // Android 시스템 네비게이션 바 (홈/뒤로 영역) 숨기기 — 학습 몰입 위해
      if (Platform.OS === 'android' && NavigationBar.setVisibilityAsync) {
        NavigationBar.setVisibilityAsync('hidden').catch(() => {});
        NavigationBar.setBehaviorAsync?.('overlay-swipe').catch(() => {});
      }
      return () => {
        setTabBarHidden(false);
        setAdHidden(false);
        if (Platform.OS === 'android' && NavigationBar.setVisibilityAsync) {
          NavigationBar.setVisibilityAsync('visible').catch(() => {});
        }
      };
    }, [setTabBarHidden, setAdHidden])
  );

  // === 헤더 액션 ===
  const shuffle = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setQueue((prev) => [...prev].sort(() => Math.random() - 0.5));
    setIdx(0);
    setIsFlipped(false);
    rotation.value = withTiming(0, { duration: 220, easing: Easing.bezier(0.4, 0.0, 0.2, 1) });
  }, [rotation]);

  React.useEffect(() => {
    navigation.setOptions({
      title: `${meta?.name ?? level} · ${idx + 1}/${queue.length}`,
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Pressable
            onPress={shuffle}
            hitSlop={8}
            style={styles.headerBtn}
            accessibilityLabel="섞기"
          >
            <Shuffle size={18} color={theme.colors.textSecondary} strokeWidth={2.4} />
          </Pressable>
          <Pressable
            onPress={() => setCardTtsEnabled(!cardTtsEnabled)}
            hitSlop={8}
            style={styles.headerBtn}
            accessibilityLabel="음성 재생 토글"
          >
            {cardTtsEnabled ? (
              <Volume2 size={18} color={theme.colors.primary} strokeWidth={2.4} />
            ) : (
              <VolumeX size={18} color={theme.colors.textTertiary} strokeWidth={2.4} />
            )}
          </Pressable>
          <Pressable
            onPress={() => navigation.replace('StudyWordList', { level })}
            hitSlop={8}
            style={styles.headerBtn}
            accessibilityLabel="리스트로 보기"
          >
            <ListChecks size={18} color={theme.colors.textSecondary} strokeWidth={2.4} />
          </Pressable>
        </View>
      ),
    });
  }, [
    navigation,
    meta,
    level,
    idx,
    queue.length,
    cardTtsEnabled,
    setCardTtsEnabled,
    theme,
    styles.headerBtn,
    shuffle,
  ]);

  // === TTS ===
  // 현재 재생 중인 발화 ID — 'word' / 'example-0' / 'example-1' / null
  const [playingId, setPlayingId] = useState<string | null>(null);
  const ttsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopAllTts = useCallback(() => {
    Speech.stop();
    if (ttsTimerRef.current) {
      clearTimeout(ttsTimerRef.current);
      ttsTimerRef.current = null;
    }
    setPlayingId(null);
  }, []);

  // 카드 변경 헬퍼 — 회전 리셋 + 진행 중 TTS 즉시 중단
  // useEffect로 처리하면 의존성 문제로 의도치 않은 리셋이 발생할 수 있어 명시적 함수로 모음.
  const moveToCard = useCallback(
    (nextIdx: number, nextQueue?: JlptStudyWord[]) => {
      stopAllTts();
      if (nextQueue) setQueue(nextQueue);
      setIdx(nextIdx);
      setIsFlipped(false);
      rotation.value = withTiming(0, {
        duration: 220,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      });
    },
    [rotation, stopAllTts]
  );

  // 단어만 발음 (앞면/뒷면 단어 듣기 버튼)
  const speakWord = useCallback(
    (word: JlptStudyWord) => {
      if (!cardTtsEnabled) return;
      stopAllTts();
      setPlayingId('word');
      Speech.speak(word.jp, {
        language: 'ja-JP',
        rate: 0.9,
        onDone: () => setPlayingId((p) => (p === 'word' ? null : p)),
        onStopped: () => setPlayingId((p) => (p === 'word' ? null : p)),
      });
    },
    [cardTtsEnabled, stopAllTts]
  );

  // 특정 예문만 발음
  const speakExample = useCallback(
    (text: string, exId: string) => {
      if (!cardTtsEnabled || !text) return;
      stopAllTts();
      setPlayingId(exId);
      Speech.speak(text, {
        language: 'ja-JP',
        rate: 0.85,
        onDone: () => setPlayingId((p) => (p === exId ? null : p)),
        onStopped: () => setPlayingId((p) => (p === exId ? null : p)),
      });
    },
    [cardTtsEnabled, stopAllTts]
  );

  // 자동 재생: 카드 flip 시 단어 → 1.8초 텀 → 첫 번째 예문
  const speakOnFlip = useCallback(
    (word: JlptStudyWord) => {
      if (!cardTtsEnabled) return;
      stopAllTts();
      setPlayingId('word');
      const ex = getEffectiveExample(word);
      Speech.speak(word.jp, {
        language: 'ja-JP',
        rate: 0.9,
        onDone: () => {
          setPlayingId((p) => (p === 'word' ? null : p));
          if (ex.jp) {
            ttsTimerRef.current = setTimeout(() => {
              setPlayingId('example-0');
              Speech.speak(ex.jp, {
                language: 'ja-JP',
                rate: 0.85,
                onDone: () => setPlayingId((p) => (p === 'example-0' ? null : p)),
                onStopped: () => setPlayingId((p) => (p === 'example-0' ? null : p)),
              });
              ttsTimerRef.current = null;
            }, 1800);
          }
        },
        onStopped: () => setPlayingId((p) => (p === 'word' ? null : p)),
      });
    },
    [cardTtsEnabled, stopAllTts]
  );

  // 화면 이탈 시 timeout 정리
  useEffect(() => {
    return () => {
      if (ttsTimerRef.current) {
        clearTimeout(ttsTimerRef.current);
        ttsTimerRef.current = null;
      }
      Speech.stop();
    };
  }, []);

  // === 카드 액션 ===
  const flip = useCallback(() => {
    if (!card) return;
    const next = !isFlipped;
    setIsFlipped(next);
    rotation.value = withTiming(next ? 180 : 0, {
      duration: 460,
      easing: Easing.bezier(0.34, 1.2, 0.4, 1),
    });
    if (next) speakOnFlip(card);
    else stopAllTts();
  }, [card, isFlipped, rotation, speakOnFlip, stopAllTts]);

  const goNext = useCallback(() => {
    if (idx >= queue.length - 1) return;
    Haptics.selectionAsync().catch(() => {});
    moveToCard(idx + 1);
  }, [idx, queue.length, moveToCard]);

  const goPrev = useCallback(() => {
    if (idx <= 0) return;
    Haptics.selectionAsync().catch(() => {});
    moveToCard(idx - 1);
  }, [idx, moveToCard]);

  const action = useCallback(
    (status: CardStatus) => {
      if (!card) return;
      Haptics.selectionAsync().catch(() => {});
      setStatus(card.jp, status);
      const result = applyAction(queue, idx, status);
      if (result.finished) {
        stopAllTts();
        setFinished(true);
        return;
      }
      moveToCard(result.nextIdx, result.nextQueue);
    },
    [card, queue, idx, setStatus, moveToCard, stopAllTts]
  );

  const loadNextBatch = useCallback(() => {
    const next = buildBatch(allWords, progress, seenJpsRef.current);
    if (next.length === 0) {
      // 다 봤으면 reset 후 새 배치
      seenJpsRef.current.clear();
      const fresh = buildBatch(allWords, progress, new Set());
      fresh.forEach((w) => seenJpsRef.current.add(w.jp));
      setQueue(fresh);
    } else {
      next.forEach((w) => seenJpsRef.current.add(w.jp));
      setQueue(next);
    }
    setIdx(0);
    setFinished(false);
    setIsFlipped(false);
    rotation.value = withTiming(0, { duration: 220, easing: Easing.bezier(0.4, 0.0, 0.2, 1) });
  }, [allWords, progress, rotation]);

  const restart = useCallback(() => {
    setQueue(sortBySrsPriority(allWords, progress).slice(0, BATCH_SIZE));
    setIdx(0);
    setFinished(false);
    setIsFlipped(false);
    rotation.value = withTiming(0, { duration: 220, easing: Easing.bezier(0.4, 0.0, 0.2, 1) });
  }, [allWords, progress, rotation]);

  const resetAndRestart = useCallback(() => {
    resetSessionStatuses(allWords.map((w) => w.jp));
    seenJpsRef.current.clear();
    const fresh = [...allWords].sort(() => Math.random() - 0.5).slice(0, BATCH_SIZE);
    fresh.forEach((w) => seenJpsRef.current.add(w.jp));
    setQueue(fresh);
    setIdx(0);
    setFinished(false);
    setIsFlipped(false);
    rotation.value = withTiming(0, { duration: 220, easing: Easing.bezier(0.4, 0.0, 0.2, 1) });
  }, [allWords, resetSessionStatuses, rotation]);

  // === 스와이프 제스처 ===
  // activeOffsetX 임계값을 50으로 올려 탭과 스와이프 제스처 충돌(=뒷면 탭 직후 의도치 않은 다음 카드 이동) 방지.
  // 또한 failOffsetY로 세로 스크롤(뒷면 ScrollView)과 충돌 안 나게.
  const swipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-50, 50])
        .failOffsetY([-15, 15])
        .onEnd((e) => {
          if (e.translationX < -100) {
            runOnJS(goNext)();
          } else if (e.translationX > 100) {
            runOnJS(goPrev)();
          }
        }),
    [goNext, goPrev]
  );

  const frontAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rotation.value}deg` }],
  }));
  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rotation.value + 180}deg` }],
  }));

  // === 종료 화면 ===
  // !card 조건도 포함 — queue가 일시적으로 비거나 idx가 범위 밖일 때 카드 본문에서
  // card.something 접근 시 크래시 나는 걸 막는다.
  if (finished || allWords.length === 0 || !card) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.finishWrap}>
          <View style={styles.finishIconWrap}>
            <Sparkles size={32} color={theme.colors.primary} strokeWidth={2.4} />
          </View>
          <Text style={styles.finishTitle}>이번 세션 완료</Text>
          <Text style={styles.finishSub}>
            전체 {allWords.length}개 중 {answered}개 평가됨 · {totalPct}%
          </Text>

          <View style={styles.finishStatsRow}>
            <StatPill
              theme={theme}
              styles={styles}
              label="암기"
              count={counts.known}
              tone="success"
            />
            <StatPill
              theme={theme}
              styles={styles}
              label="헷갈림"
              count={counts.fuzzy}
              tone="warning"
            />
            <StatPill
              theme={theme}
              styles={styles}
              label="모름"
              count={counts.unknown}
              tone="error"
            />
          </View>

          <Pressable onPress={loadNextBatch} style={styles.finishPrimary}>
            <ChevronRight size={16} color="#fff" strokeWidth={2.4} />
            <Text style={styles.finishPrimaryText}>다음 {BATCH_SIZE}개</Text>
          </Pressable>
          <Pressable onPress={restart} style={styles.finishGhost}>
            <RotateCcw size={14} color={theme.colors.textSecondary} strokeWidth={2.4} />
            <Text style={styles.finishGhostText}>이번 세션 다시</Text>
          </Pressable>
          <Pressable onPress={resetAndRestart} style={styles.finishSecondary}>
            <Text style={styles.finishSecondaryText}>전체 상태 초기화 후 다시</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // === 카드 학습 ===
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 진행 바 + 카운트 */}
      <View style={styles.progressBar}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${totalPct}%` }]} />
        </View>
        <View style={styles.statRow}>
          <View style={[styles.statDot, { backgroundColor: theme.colors.error }]} />
          <Text style={styles.statText}>모름 {counts.unknown}</Text>
          <View style={[styles.statDot, { backgroundColor: theme.colors.warning }]} />
          <Text style={styles.statText}>헷갈림 {counts.fuzzy}</Text>
          <View style={[styles.statDot, { backgroundColor: theme.colors.success }]} />
          <Text style={styles.statText}>암기 {counts.known}</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.queueText}>
            배치 {idx + 1}/{queue.length}
          </Text>
        </View>
      </View>

      {/* 카드 영역 */}
      <View style={styles.cardArea}>
        {/* 좌측 prev 버튼 */}
        <Pressable
          onPress={goPrev}
          disabled={idx <= 0}
          style={[styles.sideBtn, idx <= 0 && styles.sideBtnDisabled]}
          hitSlop={6}
        >
          <ChevronLeft
            size={26}
            color={idx <= 0 ? theme.colors.textTertiary : theme.colors.textSecondary}
            strokeWidth={2.6}
          />
        </Pressable>

        {/* 카드 (스와이프 + 탭 flip) */}
        <GestureDetector gesture={swipeGesture}>
          <View style={styles.cardSlot}>
            <Pressable onPress={flip} style={StyleSheet.absoluteFill}>
              {/* 앞면 — 뒤집힘 상태에서 opacity 0 (ScrollView 호환을 위해 backfaceVisibility 대체) */}
              <Animated.View
                style={[
                  styles.cardFace,
                  styles.cardFront,
                  frontAnimatedStyle,
                  { opacity: isFlipped ? 0 : 1 },
                ]}
                pointerEvents={isFlipped ? 'none' : 'auto'}
              >
                <Text style={styles.cardLevel}>{meta?.name ?? level}</Text>

                {/* 우상단 단어 듣기 버튼 — flip 없이 발음만, 재생 중엔 색상 채움 */}
                <Pressable
                  onPress={() => card && speakWord(card)}
                  hitSlop={10}
                  style={[
                    styles.frontListenBtn,
                    playingId === 'word' && styles.listenBtnActive,
                  ]}
                >
                  <Volume2
                    size={16}
                    color={playingId === 'word' ? '#fff' : theme.colors.primary}
                    strokeWidth={2.4}
                  />
                </Pressable>

                <Text style={styles.cardJpLarge} selectable>
                  {card?.jp}
                </Text>
                {card?.pos && (
                  <View style={styles.posBadge}>
                    <Text style={styles.posText}>{card.pos}</Text>
                  </View>
                )}
                <Text style={styles.flipHint}>탭해서 뜻 보기</Text>
              </Animated.View>

              {/* 뒷면 — 평소엔 opacity 0 (앞면 뒤에 숨김), flip 시 1 */}
              <Animated.View
                style={[
                  styles.cardFace,
                  styles.cardBack,
                  backAnimatedStyle,
                  { opacity: isFlipped ? 1 : 0 },
                ]}
                pointerEvents={isFlipped ? 'auto' : 'none'}
              >
                <ScrollView
                  contentContainerStyle={styles.cardBackContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.cardBackHeader}>
                    <Text style={styles.cardJpSmall} selectable>
                      {card?.jp}
                    </Text>
                    {card?.pos && (
                      <View style={[styles.posBadge, { marginTop: 0 }]}>
                        <Text style={styles.posText}>{card.pos}</Text>
                      </View>
                    )}
                    {/* 단어 듣기 버튼 — 헤더 우측, 재생 중엔 색상 채움 */}
                    <View style={{ flex: 1 }} />
                    <Pressable
                      onPress={() => card && speakWord(card)}
                      hitSlop={8}
                      style={[
                        styles.backWordListenBtn,
                        playingId === 'word' && styles.listenBtnActive,
                      ]}
                    >
                      <Volume2
                        size={14}
                        color={playingId === 'word' ? '#fff' : theme.colors.primary}
                        strokeWidth={2.4}
                      />
                    </Pressable>
                  </View>
                  <Text style={styles.cardKana}>
                    {card?.kana} · {card?.ko_pron}
                  </Text>

                  {/* 학습 진척 칩 — 본 횟수 + 현재 상태 + 마지막 본 시각 */}
                  {card &&
                    (() => {
                      const p = progress[card.jp];
                      const reviewCount = p?.reviewCount ?? 0;
                      const status = p?.status;
                      const rel = formatRelativeTime(p?.lastReviewedAt);
                      if (reviewCount === 0 && !status) return null;
                      const statusLabel =
                        status === 'known'
                          ? '✓ 아는 단어'
                          : status === 'fuzzy'
                          ? '? 헷갈리는 단어'
                          : status === 'unknown'
                          ? '✕ 모르는 단어'
                          : '처음';
                      const statusColor =
                        status === 'known'
                          ? theme.colors.success
                          : status === 'fuzzy'
                          ? theme.colors.warning
                          : status === 'unknown'
                          ? theme.colors.error
                          : theme.colors.textTertiary;
                      return (
                        <View style={styles.progressChipRow}>
                          <View style={styles.progressChip}>
                            <Text style={styles.progressChipText}>
                              {reviewCount}회 봄
                            </Text>
                          </View>
                          <View style={[styles.progressChip, { borderColor: statusColor }]}>
                            <Text style={[styles.progressChipText, { color: statusColor }]}>
                              {statusLabel}
                            </Text>
                          </View>
                          {!!rel && (
                            <Text style={styles.progressChipMeta}>{rel}</Text>
                          )}
                        </View>
                      );
                    })()}

                  <View style={styles.divider} />
                  {card &&
                    (() => {
                      const meanings = splitMeanings(card.meaning);
                      if (meanings.length === 0) {
                        return (
                          <Text style={styles.cardMeaning} selectable>
                            {card.meaning}
                          </Text>
                        );
                      }
                      if (meanings.length === 1) {
                        return (
                          <Text style={styles.cardMeaning} selectable>
                            {meanings[0]}
                          </Text>
                        );
                      }
                      return (
                        <View style={styles.meaningList}>
                          {meanings.map((m, i) => (
                            <View key={i} style={styles.meaningRow}>
                              <Text style={styles.meaningIdx}>{i + 1}</Text>
                              <Text style={styles.cardMeaning} selectable>
                                {m}
                              </Text>
                            </View>
                          ))}
                        </View>
                      );
                    })()}

                  {card?.note && (
                    <View style={styles.noteBlock}>
                      <Text style={styles.noteLabel}>특이사항</Text>
                      <Text style={styles.noteText}>{card.note}</Text>
                    </View>
                  )}

                  {/* 동사 활용형 (자동 생성) */}
                  {card &&
                    (() => {
                      if (!isVerb(card.pos, card.kana)) return null;
                      const forms = conjugateVerb(card.jp, card.kana);
                      if (!forms) return null;
                      return (
                        <View style={styles.conjugationBlock}>
                          <Text style={styles.conjugationLabel}>활용형</Text>
                          <View style={styles.conjugationRow}>
                            <ConjPill
                              styles={styles}
                              label="ます"
                              value={forms.masu}
                            />
                            <ConjPill
                              styles={styles}
                              label="ない"
                              value={forms.nai}
                            />
                            <ConjPill
                              styles={styles}
                              label="た"
                              value={forms.ta}
                            />
                            <ConjPill
                              styles={styles}
                              label="て"
                              value={forms.te}
                            />
                          </View>
                        </View>
                      );
                    })()}

                  {/* い형용사 활용 */}
                  {card &&
                    (() => {
                      if (!isIAdjective(card.pos, card.kana)) return null;
                      const forms = conjugateIAdjective(card.jp, card.kana);
                      if (!forms) return null;
                      return (
                        <View style={styles.conjugationBlock}>
                          <Text style={styles.conjugationLabel}>활용형</Text>
                          <View style={styles.conjugationRow}>
                            <ConjPill
                              styles={styles}
                              label="부정"
                              value={forms.negative}
                            />
                            <ConjPill
                              styles={styles}
                              label="과거"
                              value={forms.past}
                            />
                            <ConjPill
                              styles={styles}
                              label="て"
                              value={forms.te}
                            />
                          </View>
                        </View>
                      );
                    })()}

                  {/* 예문 (다양한 맥락 1~2개) */}
                  {card &&
                    getMultipleExamples(card).map((ex, exIdx) => {
                      if (!ex.jp) return null;
                      const exId = `example-${exIdx}`;
                      const isPlaying = playingId === exId;
                      return (
                        <View key={`ex-${exIdx}`} style={styles.exampleBlock}>
                          <View style={styles.exampleHeader}>
                            <Text style={styles.exampleLabel}>
                              예문 {exIdx + 1}
                            </Text>
                            <Pressable
                              onPress={() => speakExample(ex.jp, exId)}
                              hitSlop={6}
                              style={[
                                styles.examplePlayBtn,
                                isPlaying && styles.listenBtnActive,
                              ]}
                            >
                              <Volume2
                                size={12}
                                color={isPlaying ? '#fff' : theme.colors.primary}
                                strokeWidth={2.4}
                              />
                            </Pressable>
                          </View>
                          {renderHighlightedExample(
                            ex.jp,
                            card.jp,
                            card.kana,
                            styles.exampleJp,
                            styles.exampleJpBold,
                            `ex-jp-${exIdx}`
                          )}
                          {!!ex.kana &&
                            renderHighlightedExample(
                              ex.kana,
                              card.kana,
                              undefined,
                              styles.exampleKana,
                              styles.exampleKanaBold,
                              `ex-kana-${exIdx}`
                            )}
                          {!!ex.ko && (
                            <Text style={styles.exampleKo}>{ex.ko}</Text>
                          )}
                        </View>
                      );
                    })}
                </ScrollView>
              </Animated.View>
            </Pressable>
          </View>
        </GestureDetector>

        {/* 우측 next 버튼 */}
        <Pressable
          onPress={goNext}
          disabled={idx >= queue.length - 1}
          style={[styles.sideBtn, idx >= queue.length - 1 && styles.sideBtnDisabled]}
          hitSlop={6}
        >
          <ChevronRight
            size={26}
            color={
              idx >= queue.length - 1
                ? theme.colors.textTertiary
                : theme.colors.textSecondary
            }
            strokeWidth={2.6}
          />
        </Pressable>
      </View>

      {/* 하단 액션 — 사용자가 단어 상태(모르는/헷갈리는/아는)를 선택 */}
      <View style={styles.actionRow}>
        <Pressable
          onPress={() => action('unknown')}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionUnknown,
            pressed && { opacity: 0.85 },
          ]}
        >
          <X size={14} color="#fff" strokeWidth={2.8} />
          <Text style={styles.actionLabel}>모르는 단어</Text>
        </Pressable>
        <Pressable
          onPress={() => action('fuzzy')}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionFuzzy,
            pressed && { opacity: 0.85 },
          ]}
        >
          <HelpCircle size={14} color="#fff" strokeWidth={2.8} />
          <Text style={styles.actionLabel}>헷갈리는 단어</Text>
        </Pressable>
        <Pressable
          onPress={() => action('known')}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionKnown,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Check size={14} color="#fff" strokeWidth={2.8} />
          <Text style={styles.actionLabel}>아는 단어</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function ConjPill({
  styles,
  label,
  value,
}: {
  styles: ReturnType<typeof useStyles>;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.conjPill}>
      <Text style={styles.conjPillLabel}>{label}</Text>
      <Text style={styles.conjPillValue} selectable>
        {value}
      </Text>
    </View>
  );
}

function StatPill({
  theme,
  styles,
  label,
  count,
  tone,
}: {
  theme: Theme;
  styles: ReturnType<typeof useStyles>;
  label: string;
  count: number;
  tone: 'success' | 'warning' | 'error';
}) {
  const color =
    tone === 'success'
      ? theme.colors.success
      : tone === 'warning'
      ? theme.colors.warning
      : theme.colors.error;
  return (
    <View style={[styles.statPill, { borderColor: color }]}>
      <Text style={[styles.statPillLabel, { color }]}>{label}</Text>
      <Text style={[styles.statPillCount, { color }]}>{count}</Text>
    </View>
  );
}

const useStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    headerBtn: { padding: 4, marginLeft: 4 },

    progressBar: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 12,
      gap: 8,
      backgroundColor: theme.colors.bgElevated,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    progressTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.surfaceMuted,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 2, backgroundColor: theme.colors.primary },
    statRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
    statDot: { width: 8, height: 8, borderRadius: 4 },
    statText: {
      fontSize: 11,
      fontFamily: theme.fonts.numBold,
      color: theme.colors.textSecondary,
      marginRight: 6,
    },
    queueText: {
      fontSize: 11,
      fontFamily: theme.fonts.numBold,
      color: theme.colors.textTertiary,
    },

    cardArea: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    sideBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sideBtnDisabled: { opacity: 0.3 },

    cardSlot: { flex: 1, aspectRatio: 0.78, maxWidth: 380, alignSelf: 'center' },

    cardFace: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      padding: 22,
      // backfaceVisibility 'hidden'은 일부 RN 버전에서 ScrollView 자식과 충돌해 뒷면이 안 그려짐.
      // 대신 isFlipped 상태에 따라 opacity로 면 전환 (회전 애니메이션은 그대로 유지).
      ...theme.shadows.sm,
    },
    cardFront: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardBack: {
      backgroundColor: theme.colors.bgElevated,
      padding: 0,
    },
    cardBackContent: {
      padding: 18,
      paddingBottom: 16,
    },
    progressChipRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
      flexWrap: 'wrap',
    },
    progressChip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    progressChipText: {
      fontSize: 10,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textSecondary,
    },
    progressChipMeta: {
      fontSize: 10,
      fontFamily: theme.fonts.body,
      color: theme.colors.textTertiary,
    },
    conjugationBlock: {
      marginTop: 14,
      padding: 10,
      borderRadius: 10,
      backgroundColor: theme.colors.surfaceMuted,
      gap: 6,
    },
    conjugationLabel: {
      fontSize: 10,
      fontFamily: theme.fonts.bodyBlack,
      color: theme.colors.textTertiary,
      letterSpacing: 1,
    },
    conjugationRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    conjPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    conjPillLabel: {
      fontSize: 10,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textTertiary,
    },
    conjPillValue: {
      fontSize: theme.fs(12),
      fontFamily: theme.fonts.jpBold,
      color: theme.colors.textPrimary,
    },

    cardLevel: {
      position: 'absolute',
      top: 16,
      left: 16,
      fontSize: 11,
      fontFamily: theme.fonts.numBold,
      color: theme.colors.textTertiary,
      letterSpacing: 1.5,
    },
    cardJpLarge: {
      fontSize: theme.fs(48),
      lineHeight: theme.fs(58),
      fontFamily: theme.fonts.jpBold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      letterSpacing: -1,
    },
    posBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: theme.colors.surfaceMuted,
      marginTop: 12,
    },
    posText: {
      fontSize: 11,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textSecondary,
    },
    flipHint: {
      position: 'absolute',
      bottom: 18,
      fontSize: 11,
      fontFamily: theme.fonts.body,
      color: theme.colors.textTertiary,
      letterSpacing: 0.5,
    },
    frontListenBtn: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backWordListenBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // 모든 듣기 버튼 공통 — 현재 재생 중 강조
    listenBtnActive: {
      backgroundColor: theme.colors.primary,
    },

    cardBackHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    cardJpSmall: {
      fontSize: theme.fs(22),
      lineHeight: theme.fs(28),
      fontFamily: theme.fonts.jpBold,
      color: theme.colors.textPrimary,
    },
    cardKana: {
      fontSize: theme.fs(13),
      lineHeight: theme.fs(17),
      fontFamily: theme.fonts.body,
      color: theme.colors.accent,
      marginTop: 4,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
      marginVertical: 12,
    },
    cardMeaning: {
      fontSize: theme.fs(18),
      lineHeight: theme.fs(26),
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textPrimary,
      flex: 1,
    },
    meaningList: { gap: 4 },
    meaningRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    meaningIdx: {
      fontSize: theme.fs(11),
      lineHeight: theme.fs(20),
      fontFamily: theme.fonts.numBlack,
      color: theme.colors.primary,
      minWidth: 18,
    },

    noteBlock: {
      marginTop: 14,
      padding: 10,
      borderRadius: 10,
      backgroundColor: theme.colors.warningSoft,
    },
    noteLabel: {
      fontSize: 10,
      fontFamily: theme.fonts.bodyBlack,
      color: theme.colors.warning,
      letterSpacing: 1,
      marginBottom: 4,
    },
    noteText: {
      fontSize: theme.fs(12),
      lineHeight: theme.fs(17),
      fontFamily: theme.fonts.body,
      color: theme.colors.textPrimary,
    },

    exampleBlock: {
      marginTop: 14,
      padding: 10,
      borderRadius: 10,
      backgroundColor: theme.colors.surfaceMuted,
      gap: 2,
    },
    exampleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    exampleLabel: {
      fontSize: 10,
      fontFamily: theme.fonts.bodyBlack,
      color: theme.colors.textTertiary,
      letterSpacing: 1,
    },
    examplePlayBtn: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    exampleJp: {
      fontSize: theme.fs(13),
      lineHeight: theme.fs(20),
      fontFamily: theme.fonts.jpBold,
      color: theme.colors.textPrimary,
    },
    exampleJpBold: {
      fontFamily: theme.fonts.jpBold,
      color: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
    },
    exampleKana: {
      fontSize: theme.fs(11),
      lineHeight: theme.fs(15),
      fontFamily: theme.fonts.body,
      color: theme.colors.accent,
    },
    exampleKanaBold: {
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.primary,
    },
    exampleKo: {
      fontSize: theme.fs(12),
      lineHeight: theme.fs(17),
      fontFamily: theme.fonts.bodyMedium,
      color: theme.colors.textSecondary,
    },

    replayBtn: {
      position: 'absolute',
      right: 16,
      bottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme.colors.primarySoft,
    },
    replayText: {
      fontSize: 11,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.primary,
    },

    actionRow: {
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: Platform.OS === 'android' ? 16 : 10,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 9,
      paddingHorizontal: 8,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },
    actionUnknown: { backgroundColor: theme.colors.error },
    actionFuzzy: { backgroundColor: theme.colors.warning },
    actionKnown: { backgroundColor: theme.colors.success },
    actionLabel: {
      fontSize: theme.fs(12),
      lineHeight: theme.fs(14),
      fontFamily: theme.fonts.bodyBlack,
      color: '#fff',
      includeFontPadding: false,
    },

    // 종료 화면
    finishWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 10,
    },
    finishIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    finishTitle: {
      fontSize: theme.fs(22),
      fontFamily: theme.fonts.bodyBlack,
      color: theme.colors.textPrimary,
      letterSpacing: -0.5,
    },
    finishSub: {
      fontSize: theme.fs(13),
      fontFamily: theme.fonts.body,
      color: theme.colors.textSecondary,
      marginBottom: 12,
    },
    finishStatsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    statPill: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      minWidth: 76,
    },
    statPillLabel: { fontSize: 11, fontFamily: theme.fonts.bodyBold, marginBottom: 2 },
    statPillCount: { fontSize: 18, fontFamily: theme.fonts.numBlack },

    finishPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
    },
    finishPrimaryText: {
      fontSize: theme.fs(13),
      fontFamily: theme.fonts.bodyBlack,
      color: '#fff',
    },
    finishGhost: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    finishGhostText: {
      fontSize: 12,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textSecondary,
    },
    finishSecondary: { paddingHorizontal: 16, paddingVertical: 6 },
    finishSecondaryText: {
      fontSize: 11,
      fontFamily: theme.fonts.bodyMedium,
      color: theme.colors.textTertiary,
    },
  });
