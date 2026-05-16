import React, { memo, useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Speech from 'expo-speech';
import { Volume2 } from 'lucide-react-native';

import { Sentence, Token, Pos } from '../types/article';
import { useResponsive } from '../utils/responsive';
import { useTheme, Theme } from '../utils/theme';
import { lookupJlpt, jlptUnderlineColor } from '../utils/jlptLookup';

// 두 개 독립 토글: 번역(text_ko)과 발음(reading 결합)을 각각 켤 수 있음.
// 둘 다 true면 두 줄 모두 표시.

const POS_LABEL: Record<Pos, string> = {
  noun: '명사',
  verb: '동사',
  adjective: '형용사',
  adverb: '부사',
  particle: '조사',
  symbol: '기호',
  other: '기타',
};

// 조사·기호 surface → 한국어 의미 안전망.
// LLM이 가끔 token_meanings에서 조사를 건너뛰어 인덱스가 한 칸씩 밀린 채 저장된 기사가 있어,
// pos가 particle일 때는 LLM이 채운 의미가 잘못된 경우가 많으므로 surface 기반으로 강제 표시한다.
const PARTICLE_FALLBACK: Record<string, string> = {
  は: '은/는 (주제)',
  が: '이/가 (주격)',
  を: '을/를',
  に: '에 / 에게',
  へ: '~로 / 에 (방향)',
  で: '에서 / 로 (수단)',
  と: '와/과',
  の: '의 / ~것',
  も: '도',
  や: '~이나',
  か: '~까? (의문)',
  から: '부터 / 에서',
  まで: '까지',
  より: '보다',
  ね: '~죠 / ~네요',
  よ: '~요',
  な: '~네 / 종조사',
  わ: '~네 (감탄)',
  さ: '~말이지',
  ぞ: '~다 (강조)',
  ぜ: '~다 (강조)',
  しか: '~밖에',
  だけ: '~만 / ~뿐',
  ばかり: '~만 / ~정도',
  ほど: '~정도',
  くらい: '~정도',
  ぐらい: '~정도',
  など: '~등',
  こそ: '~야말로',
  さえ: '~조차',
  でも: '~라도',
  って: '~라고',
};

function resolveTokenMeaning(token: Token): string {
  if (token.pos === 'symbol') return '';
  if (token.pos === 'particle') {
    const fallback = PARTICLE_FALLBACK[token.surface];
    if (fallback) return fallback;
  }
  return token.meaning ?? '';
}

function posColors(theme: Theme): Record<Pos, { bg: string; fg: string }> {
  return theme.isDark
    ? {
        noun: { bg: '#1e3a8a', fg: '#93c5fd' },
        verb: { bg: '#14532d', fg: '#86efac' },
        adjective: { bg: '#713f12', fg: '#fde68a' },
        adverb: { bg: '#3b0764', fg: '#c4b5fd' },
        particle: { bg: '#27272a', fg: '#a1a1aa' },
        symbol: { bg: '#27272a', fg: '#71717a' },
        other: { bg: '#27272a', fg: '#a1a1aa' },
      }
    : {
        noun: { bg: '#dbeafe', fg: '#1e40af' },
        verb: { bg: '#dcfce7', fg: '#166534' },
        adjective: { bg: '#fef3c7', fg: '#92400e' },
        adverb: { bg: '#ede9fe', fg: '#5b21b6' },
        particle: { bg: '#f3f4f6', fg: '#4b5563' },
        symbol: { bg: '#f3f4f6', fg: '#9ca3af' },
        other: { bg: '#f3f4f6', fg: '#4b5563' },
      };
}

function katakanaToHiragana(s: string): string {
  if (!s) return '';
  let out = '';
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    if (code >= 0x30a1 && code <= 0x30f6) out += String.fromCharCode(code - 0x60);
    else out += ch;
  }
  return out;
}

function isAllKana(s: string): boolean {
  if (!s) return true;
  return /^[぀-ゟ゠-ヿー\s]+$/.test(s);
}

interface Layout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TokenChipProps {
  token: Token;
  sentenceIdx: number;
  tokenIdx: number;
  isSelected: boolean;
  isHighlighted: boolean;
  isInDragRange: boolean;
  grammarMatchIdx: number | null;
  showFurigana: boolean;
  onPress: (sentenceIdx: number, token: Token, tokenIdx: number) => void;
  onLongPress: (sentenceIdx: number, token: Token, tokenIdx: number) => void;
  onLayout: (tokenIdx: number, layout: Layout) => void;
  styles: ReturnType<typeof useStyles>;
  theme: Theme;
}

const TokenChip = memo(function TokenChip({
  token,
  sentenceIdx,
  tokenIdx,
  isSelected,
  isHighlighted,
  isInDragRange,
  grammarMatchIdx,
  showFurigana: showFuriganaProp,
  onPress,
  onLongPress,
  onLayout,
  styles,
  theme,
}: TokenChipProps) {
  const handlePress = useCallback(() => {
    if (token.pos === 'symbol') return;
    onPress(sentenceIdx, token, tokenIdx);
  }, [token, sentenceIdx, tokenIdx, onPress]);

  const handleLongPress = useCallback(() => {
    if (token.pos === 'symbol') return;
    onLongPress(sentenceIdx, token, tokenIdx);
  }, [token, sentenceIdx, tokenIdx, onLongPress]);

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { x, y, width, height } = e.nativeEvent.layout;
      onLayout(tokenIdx, { x, y, width, height });
    },
    [tokenIdx, onLayout]
  );

  const showFurigana =
    showFuriganaProp &&
    token.reading_kana &&
    !isAllKana(token.surface) &&
    token.pos !== 'symbol';
  const hiragana = showFurigana ? katakanaToHiragana(token.reading_kana!) : '';
  const katakana = showFurigana ? token.reading_kana! : '';

  // JLPT 단어 사전 매칭 → 색상 밑줄 (grammar match underline 우선)
  const jlptLevel = lookupJlpt(token);
  const jlptColor = jlptUnderlineColor(jlptLevel, theme.isDark);
  const showJlptUnderline = jlptColor && grammarMatchIdx === null;

  return (
    <Pressable
      onLayout={handleLayout}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={300}
      android_ripple={{ color: theme.colors.primarySoft, borderless: false }}
      style={[
        styles.tokenCol,
        isHighlighted && styles.tokenHighlighted,
        isInDragRange && styles.tokenInDrag,
        isSelected && styles.tokenSelected,
        grammarMatchIdx !== null && styles.tokenGrammarMatch,
      ]}
    >
      {showFurigana ? (
        <View style={styles.rubyBlock}>
          <Text style={styles.rubyHira}>{hiragana}</Text>
          <Text style={styles.rubyKata}>{katakana}</Text>
        </View>
      ) : (
        <View style={styles.rubySpacer} />
      )}
      <Text
        style={[
          styles.surface,
          showJlptUnderline && {
            borderBottomWidth: 2,
            borderBottomColor: jlptColor,
            paddingBottom: 1,
          },
        ]}
      >
        {token.surface}
      </Text>
    </Pressable>
  );
});

interface SentenceBlockProps {
  sentence: Sentence;
  showKoTranslation: boolean;
  showKoReading: boolean;
  selectedTokenKey: string | null;
  highlightRanges: Array<{ start: number; end: number }>;
  grammarHits: Array<{ startTokenIdx: number; endTokenIdx: number; grammarIdx: number }>;
  dragRange: { start: number; end: number } | null;
  isActive: boolean;
  showFurigana: boolean;
  onTokenPress: (sentenceIdx: number, token: Token, tokenIdx: number) => void;
  onTokenLongPress: (sentenceIdx: number, token: Token, tokenIdx: number) => void;
  onGrammarMatchPress?: (grammarIdx: number) => void;
  onSentenceSpeak?: (sentenceIdx: number) => void;
  styles: ReturnType<typeof useStyles>;
  theme: Theme;
  posColorMap: Record<Pos, { bg: string; fg: string }>;
}

const SentenceBlock = memo(function SentenceBlock({
  sentence,
  showKoTranslation,
  showKoReading,
  selectedTokenKey,
  highlightRanges,
  grammarHits,
  dragRange,
  isActive,
  showFurigana: showFuriganaProp,
  onTokenPress,
  onTokenLongPress,
  onGrammarMatchPress,
  onSentenceSpeak,
  styles,
  theme,
  posColorMap,
}: SentenceBlockProps) {
  const [layouts, setLayouts] = useState<Record<number, Layout>>({});
  const [rowWidth, setRowWidth] = useState(0);
  const { popupWidth } = useResponsive();

  const handleTokenLayout = useCallback((idx: number, layout: Layout) => {
    setLayouts((prev) => {
      const old = prev[idx];
      if (
        old &&
        old.x === layout.x &&
        old.y === layout.y &&
        old.width === layout.width &&
        old.height === layout.height
      ) {
        return prev;
      }
      return { ...prev, [idx]: layout };
    });
  }, []);

  const handleRowLayout = useCallback((e: LayoutChangeEvent) => {
    setRowWidth(e.nativeEvent.layout.width);
  }, []);

  const speak = useCallback(() => {
    if (onSentenceSpeak) {
      // 부모(ArticleDetailScreen)에 위임 — TTSPlayer가 활성화되어 시간 표기.
      onSentenceSpeak(sentence.idx);
      return;
    }
    Speech.stop();
    Speech.speak(sentence.text_jp, { language: 'ja-JP', rate: 0.95 });
  }, [sentence.text_jp, sentence.idx, onSentenceSpeak]);

  const isHighlighted = useCallback(
    (idx: number) => highlightRanges.some((r) => idx >= r.start && idx <= r.end),
    [highlightRanges]
  );

  const isInDrag = useCallback(
    (idx: number) =>
      !!dragRange &&
      idx >= Math.min(dragRange.start, dragRange.end) &&
      idx <= Math.max(dragRange.start, dragRange.end),
    [dragRange]
  );

  const grammarMatchAt = useCallback(
    (idx: number): number | null => {
      const hit = grammarHits.find(
        (h) => idx >= h.startTokenIdx && idx <= h.endTokenIdx
      );
      return hit ? hit.grammarIdx : null;
    },
    [grammarHits]
  );

  const handleTokenPressWrapped = useCallback(
    (sIdx: number, token: Token, tIdx: number) => {
      const grammarIdx = grammarMatchAt(tIdx);
      if (grammarIdx !== null && onGrammarMatchPress) {
        onGrammarMatchPress(grammarIdx);
        return;
      }
      onTokenPress(sIdx, token, tIdx);
    },
    [grammarMatchAt, onGrammarMatchPress, onTokenPress]
  );

  const koreanReading = useMemo(
    () =>
      sentence.tokens
        .filter((t) => t.pos !== 'symbol')
        .map((t) => t.reading || '')
        .filter((r) => r.length > 0)
        .join(' '),
    [sentence.tokens]
  );

  const selectedTokenInThisSentence = useMemo(() => {
    if (!selectedTokenKey) return null;
    const [sIdx, tIdx] = selectedTokenKey.split('-').map(Number);
    if (sIdx !== sentence.idx) return null;
    const token = sentence.tokens[tIdx];
    return token ? { token, tokenIdx: tIdx } : null;
  }, [selectedTokenKey, sentence.idx, sentence.tokens]);

  const popupStyle = useMemo(() => {
    if (!selectedTokenInThisSentence) return null;
    const layout = layouts[selectedTokenInThisSentence.tokenIdx];
    if (!layout) return null;
    let left = layout.x + layout.width * 0.5;
    const top = layout.y + layout.height + 6;
    if (rowWidth > 0 && left + popupWidth > rowWidth) {
      left = Math.max(0, rowWidth - popupWidth);
    }
    return { left, top, width: popupWidth };
  }, [selectedTokenInThisSentence, layouts, rowWidth, popupWidth]);

  return (
    <View style={[styles.sentenceBlock, isActive && styles.sentenceBlockActive]}>
      <View style={styles.tokenRow} onLayout={handleRowLayout}>
        {sentence.tokens.map((token, tIdx) => (
          <TokenChip
            key={`${sentence.idx}-${tIdx}`}
            token={token}
            sentenceIdx={sentence.idx}
            tokenIdx={tIdx}
            isSelected={selectedTokenKey === `${sentence.idx}-${tIdx}`}
            isHighlighted={isHighlighted(tIdx)}
            isInDragRange={isInDrag(tIdx)}
            grammarMatchIdx={grammarMatchAt(tIdx)}
            showFurigana={showFuriganaProp}
            onPress={handleTokenPressWrapped}
            onLongPress={onTokenLongPress}
            onLayout={handleTokenLayout}
            styles={styles}
            theme={theme}
          />
        ))}

        {selectedTokenInThisSentence && popupStyle && (
          <View style={[styles.tokenPopup, popupStyle]} pointerEvents="box-none">
            <View style={styles.popupTip} pointerEvents="none" />
            <View style={styles.popupHeader} pointerEvents="none">
              <Text style={styles.popupSurface} numberOfLines={1}>
                {selectedTokenInThisSentence.token.surface}
              </Text>
              <View
                style={[
                  styles.posBadge,
                  { backgroundColor: posColorMap[selectedTokenInThisSentence.token.pos].bg },
                ]}
              >
                <Text
                  style={[
                    styles.posBadgeText,
                    { color: posColorMap[selectedTokenInThisSentence.token.pos].fg },
                  ]}
                >
                  {POS_LABEL[selectedTokenInThisSentence.token.pos]}
                </Text>
              </View>
            </View>
            {selectedTokenInThisSentence.token.reading.length > 0 && (
              <Text style={styles.popupReading} numberOfLines={1}>
                {selectedTokenInThisSentence.token.reading}
              </Text>
            )}
            {(() => {
              const m = resolveTokenMeaning(selectedTokenInThisSentence.token);
              return m.length > 0 ? (
                <Text style={styles.popupMeaning} numberOfLines={2}>
                  {m}
                </Text>
              ) : null;
            })()}
            <Pressable
              onPress={() => {
                Speech.stop();
                Speech.speak(selectedTokenInThisSentence.token.surface, {
                  language: 'ja-JP',
                  rate: 0.8,
                });
              }}
              hitSlop={6}
              style={styles.popupSpeakBtn}
            >
              <Volume2 size={11} color="#fff" strokeWidth={2.5} />
              <Text style={styles.popupSpeakText}>듣기</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* 한글 표시 — 번역/발음 각각 독립. 둘 다 켜져 있으면 둘 다 보여줌 */}
      {showKoReading && koreanReading.length > 0 && (
        <Text style={styles.koReading} selectable>
          {koreanReading}
        </Text>
      )}

      {showKoTranslation && sentence.text_ko.length > 0 && (
        <Text style={styles.koTranslation} selectable>
          {sentence.text_ko}
        </Text>
      )}

      <Pressable onPress={speak} hitSlop={8} style={styles.ttsBtn}>
        <Volume2 size={11} color={theme.colors.primary} strokeWidth={2.5} />
        <Text style={styles.ttsIcon}>듣기</Text>
      </Pressable>
    </View>
  );
});

export interface GrammarMatchHit {
  sentenceIdx: number;
  startTokenIdx: number;
  endTokenIdx: number;
  grammarIdx: number;
}

interface TokenizedArticleProps {
  sentences: Sentence[];
  showKoTranslation?: boolean;
  showKoReading?: boolean;
  highlights?: Array<{ sentenceIdx: number; startTokenIdx: number; endTokenIdx: number }>;
  grammarMatches?: GrammarMatchHit[];
  selectedTokenKey?: string | null;
  dragSelection?: { sentenceIdx: number; start: number; end: number } | null;
  activeSentenceIdx?: number | null;
  showFurigana?: boolean;
  onTokenPress: (sentenceIdx: number, token: Token, tokenIdx: number) => void;
  onTokenLongPress: (sentenceIdx: number, token: Token, tokenIdx: number) => void;
  onGrammarMatchPress?: (grammarIdx: number) => void;
  onSentenceSpeak?: (sentenceIdx: number) => void;
}

function TokenizedArticleBase({
  sentences,
  showKoTranslation = false,
  showKoReading = false,
  highlights = [],
  grammarMatches = [],
  selectedTokenKey = null,
  dragSelection = null,
  activeSentenceIdx = null,
  showFurigana: showFuriganaProp = true,
  onTokenPress,
  onTokenLongPress,
  onGrammarMatchPress,
  onSentenceSpeak,
}: TokenizedArticleProps) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const posColorMap = useMemo(() => posColors(theme), [theme]);

  return (
    <View style={styles.container}>
      {sentences.map((sentence) => {
        const ranges = highlights
          .filter((h) => h.sentenceIdx === sentence.idx)
          .map((h) => ({ start: h.startTokenIdx, end: h.endTokenIdx }));
        const sentenceGrammarHits = grammarMatches.filter(
          (m) => m.sentenceIdx === sentence.idx
        );
        const drag =
          dragSelection && dragSelection.sentenceIdx === sentence.idx
            ? { start: dragSelection.start, end: dragSelection.end }
            : null;
        return (
          <SentenceBlock
            key={sentence.idx}
            sentence={sentence}
            showKoTranslation={showKoTranslation}
            showKoReading={showKoReading}
            selectedTokenKey={selectedTokenKey}
            highlightRanges={ranges}
            grammarHits={sentenceGrammarHits}
            dragRange={drag}
            isActive={activeSentenceIdx === sentence.idx}
            showFurigana={showFuriganaProp}
            onTokenPress={onTokenPress}
            onTokenLongPress={onTokenLongPress}
            onGrammarMatchPress={onGrammarMatchPress}
            onSentenceSpeak={onSentenceSpeak}
            styles={styles}
            theme={theme}
            posColorMap={posColorMap}
          />
        );
      })}
    </View>
  );
}

export const TokenizedArticle = memo(TokenizedArticleBase);

const useStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { paddingTop: 4 },
    sentenceBlock: {
      marginBottom: 4,
      paddingHorizontal: 6,
      paddingTop: 2,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      borderRadius: 8,
    },
    sentenceBlockActive: {
      backgroundColor: theme.colors.primarySoft,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    tokenRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-end',
      minHeight: 40,
    },
    tokenCol: {
      paddingHorizontal: 1,
      paddingVertical: 1,
      marginRight: 0,
      marginBottom: 2,
      borderRadius: 4,
      alignItems: 'center',
    },
    rubyBlock: { alignItems: 'center', minHeight: 18 },
    rubySpacer: { height: 18 },
    rubyHira: { fontSize: theme.fs(9), lineHeight: theme.fs(11), color: theme.colors.accent },
    rubyKata: { fontSize: 8, lineHeight: 10, color: theme.colors.textTertiary },
    surface: {
      fontSize: theme.fs(17),
      lineHeight: theme.fs(24),
      color: theme.colors.textPrimary,
      fontFamily: theme.fonts.jp,
      marginTop: 1,
      // Android: 한자 글리프 ascent가 가나보다 크게 잡히는 폰트 padding 제거 → 시각적 크기 일관
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    tokenSelected: { backgroundColor: theme.colors.primarySoft },
    tokenHighlighted: { backgroundColor: theme.colors.highlightBg },
    tokenInDrag: { backgroundColor: theme.colors.warningSoft },
    tokenGrammarMatch: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.accent,
      borderStyle: 'dashed' as const,
    },

    tokenPopup: {
      position: 'absolute',
      backgroundColor: theme.isDark ? '#0f0f12' : '#1e293b',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      ...theme.shadows.lg,
      zIndex: 100,
    },
    popupTip: {
      position: 'absolute',
      top: -6,
      left: 14,
      width: 12,
      height: 12,
      backgroundColor: theme.isDark ? '#0f0f12' : '#1e293b',
      transform: [{ rotate: '45deg' }],
    },
    popupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      marginBottom: 4,
    },
    popupSurface: {
      fontSize: theme.fs(14),
      fontFamily: theme.fonts.jpBold,
      color: '#ffffff',
      flex: 1,
    },
    posBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    posBadgeText: { fontSize: 9, fontWeight: '700' },
    popupReading: { fontSize: theme.fs(11), color: '#93c5fd', marginBottom: 2 },
    popupMeaning: { fontSize: theme.fs(13), color: '#f1f5f9', fontWeight: '500' },
    popupSpeakBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: theme.colors.primary,
      borderRadius: 6,
    },
    popupSpeakText: { fontSize: 11, color: '#ffffff', fontWeight: '700' },

    koReading: {
      fontSize: theme.fs(12),
      lineHeight: theme.fs(20),
      color: theme.colors.textTertiary,
      marginTop: 10,
      fontStyle: 'italic',
    },
    koTranslation: {
      fontSize: theme.fs(13),
      lineHeight: theme.fs(22),
      color: theme.colors.textSecondary,
      marginTop: 8,
      paddingLeft: 10,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    ttsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      marginTop: 10,
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 999,
    },
    ttsIcon: { fontSize: 11, color: theme.colors.primary, fontWeight: '700' },
  });
