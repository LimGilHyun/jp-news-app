import React, { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Speech from 'expo-speech';

import { Sentence, Token } from '../types/article';

const skipReading = (pos: Token['pos']) => pos === 'symbol' || pos === 'particle';

interface TokenChipProps {
  token: Token;
  isSelected: boolean;
  isHighlighted: boolean;
  isInDragRange: boolean;
  onPress: (token: Token) => void;
  onLongPress: (token: Token) => void;
}

const TokenChip = memo(function TokenChip({
  token,
  isSelected,
  isHighlighted,
  isInDragRange,
  onPress,
  onLongPress,
}: TokenChipProps) {
  const handlePress = useCallback(() => {
    if (token.pos === 'symbol') return;
    onPress(token);
  }, [token, onPress]);

  const handleLongPress = useCallback(() => {
    if (token.pos === 'symbol') return;
    onLongPress(token);
  }, [token, onLongPress]);

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={300}
      android_ripple={{ color: '#e0e7ff', borderless: false }}
      style={[
        styles.tokenWrapper,
        isHighlighted && styles.tokenHighlighted,
        isInDragRange && styles.tokenInDrag,
        isSelected && styles.tokenSelected,
      ]}
    >
      <View style={styles.tokenColumn}>
        <Text style={styles.surface}>{token.surface}</Text>
        {!skipReading(token.pos) && token.reading.length > 0 && (
          <Text style={styles.reading}>{token.reading}</Text>
        )}
      </View>
    </Pressable>
  );
});

interface SentenceBlockProps {
  sentence: Sentence;
  showKorean: boolean;
  selectedTokenKey: string | null;
  highlightRanges: Array<{ start: number; end: number }>;
  dragRange: { start: number; end: number } | null;
  onTokenPress: (sentenceIdx: number, token: Token, tokenIdx: number) => void;
  onTokenLongPress: (sentenceIdx: number, token: Token, tokenIdx: number) => void;
  onTogglePerSentenceKo: () => void;
}

const SentenceBlock = memo(function SentenceBlock({
  sentence,
  showKorean,
  selectedTokenKey,
  highlightRanges,
  dragRange,
  onTokenPress,
  onTokenLongPress,
  onTogglePerSentenceKo,
}: SentenceBlockProps) {
  const speak = useCallback(() => {
    Speech.stop();
    Speech.speak(sentence.text_jp, { language: 'ja-JP', rate: 0.95 });
  }, [sentence.text_jp]);

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

  return (
    <View style={styles.sentenceBlock}>
      <View style={styles.sentenceHeader}>
        <Pressable onPress={speak} hitSlop={8} style={styles.ttsBtn}>
          <Text style={styles.ttsIcon}>🔊</Text>
        </Pressable>
        <Pressable onPress={onTogglePerSentenceKo} hitSlop={8} style={styles.koToggle}>
          <Text style={styles.koToggleText}>{showKorean ? '한국어 숨김' : '한국어 보기'}</Text>
        </Pressable>
      </View>

      <View style={styles.tokenRow}>
        {sentence.tokens.map((token, tIdx) => (
          <TokenChip
            key={`${sentence.idx}-${tIdx}`}
            token={token}
            isSelected={selectedTokenKey === `${sentence.idx}-${tIdx}`}
            isHighlighted={isHighlighted(tIdx)}
            isInDragRange={isInDrag(tIdx)}
            onPress={(t) => onTokenPress(sentence.idx, t, tIdx)}
            onLongPress={(t) => onTokenLongPress(sentence.idx, t, tIdx)}
          />
        ))}
      </View>

      {showKorean && sentence.text_ko.length > 0 && (
        <Text style={styles.sentenceKo}>{sentence.text_ko}</Text>
      )}
    </View>
  );
});

interface TokenizedArticleProps {
  sentences: Sentence[];
  highlights?: Array<{ sentenceIdx: number; startTokenIdx: number; endTokenIdx: number }>;
  selectedTokenKey?: string | null;
  dragSelection?: { sentenceIdx: number; start: number; end: number } | null;
  onTokenPress: (sentenceIdx: number, token: Token, tokenIdx: number) => void;
  onTokenLongPress: (sentenceIdx: number, token: Token, tokenIdx: number) => void;
}

function TokenizedArticleBase({
  sentences,
  highlights = [],
  selectedTokenKey = null,
  dragSelection = null,
  onTokenPress,
  onTokenLongPress,
}: TokenizedArticleProps) {
  const [koVisible, setKoVisible] = useState<Record<number, boolean>>({});

  const togglesPerSentence = useMemo(
    () =>
      sentences.reduce<Record<number, () => void>>((acc, s) => {
        acc[s.idx] = () => setKoVisible((prev) => ({ ...prev, [s.idx]: !prev[s.idx] }));
        return acc;
      }, {}),
    [sentences]
  );

  return (
    <View style={styles.container}>
      {sentences.map((sentence) => {
        const ranges = highlights
          .filter((h) => h.sentenceIdx === sentence.idx)
          .map((h) => ({ start: h.startTokenIdx, end: h.endTokenIdx }));
        const drag =
          dragSelection && dragSelection.sentenceIdx === sentence.idx
            ? { start: dragSelection.start, end: dragSelection.end }
            : null;
        return (
          <SentenceBlock
            key={sentence.idx}
            sentence={sentence}
            showKorean={!!koVisible[sentence.idx]}
            selectedTokenKey={selectedTokenKey}
            highlightRanges={ranges}
            dragRange={drag}
            onTokenPress={onTokenPress}
            onTokenLongPress={onTokenLongPress}
            onTogglePerSentenceKo={togglesPerSentence[sentence.idx]}
          />
        );
      })}
    </View>
  );
}

export const TokenizedArticle = memo(TokenizedArticleBase);

const styles = StyleSheet.create({
  container: { paddingTop: 8 },
  sentenceBlock: {
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sentenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ttsBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
  },
  ttsIcon: { fontSize: 16 },
  koToggle: { paddingHorizontal: 8, paddingVertical: 4 },
  koToggleText: { fontSize: 12, color: '#475569' },
  tokenRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  tokenWrapper: {
    paddingHorizontal: 2,
    paddingVertical: 2,
    marginRight: 2,
    marginBottom: 6,
    borderRadius: 4,
  },
  tokenSelected: { backgroundColor: '#dbeafe' },
  tokenHighlighted: { backgroundColor: '#fef08a' },
  tokenInDrag: { backgroundColor: '#fde68a' },
  tokenColumn: { alignItems: 'center' },
  surface: { fontSize: 22, lineHeight: 30, color: '#0f172a' },
  reading: { fontSize: 11, lineHeight: 14, color: '#64748b', marginTop: 1 },
  sentenceKo: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 22,
  },
});
