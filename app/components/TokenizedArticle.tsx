import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Token } from '../types/article';

interface TokenViewProps {
  token: Token;
  isSelected: boolean;
  isHighlighted: boolean;
  onPress: (token: Token) => void;
}

const skipPosForReading = (pos: Token['pos']) => pos === 'symbol' || pos === 'particle';

const TokenView = memo(function TokenView({
  token,
  isSelected,
  isHighlighted,
  onPress,
}: TokenViewProps) {
  const handlePress = useCallback(() => {
    if (token.pos === 'symbol') return;
    onPress(token);
  }, [token, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      android_ripple={{ color: '#e0e7ff', borderless: false }}
      style={[
        styles.tokenWrapper,
        isHighlighted && styles.tokenHighlighted,
        isSelected && styles.tokenSelected,
      ]}
    >
      <View style={styles.tokenColumn}>
        <Text style={styles.surface}>{token.surface}</Text>
        {!skipPosForReading(token.pos) && token.reading.length > 0 && (
          <Text style={styles.reading}>{token.reading}</Text>
        )}
      </View>
    </Pressable>
  );
});

interface TokenizedArticleProps {
  tokens: Token[];
  selectedTokenIdx?: number | null;
  highlightRanges?: Array<{ start: number; end: number }>;
  onTokenPress: (token: Token, index: number) => void;
}

function TokenizedArticleBase({
  tokens,
  selectedTokenIdx = null,
  highlightRanges = [],
  onTokenPress,
}: TokenizedArticleProps) {
  const isHighlighted = useCallback(
    (idx: number) =>
      highlightRanges.some((r) => idx >= r.start && idx <= r.end),
    [highlightRanges]
  );

  const handlePress = useCallback(
    (token: Token) => {
      const idx = tokens.findIndex(
        (t) => t.startIdx === token.startIdx && t.surface === token.surface
      );
      onTokenPress(token, idx);
    },
    [tokens, onTokenPress]
  );

  return (
    <View style={styles.container}>
      {tokens.map((token, idx) => (
        <TokenView
          key={`${token.startIdx}-${idx}`}
          token={token}
          isSelected={selectedTokenIdx === idx}
          isHighlighted={isHighlighted(idx)}
          onPress={handlePress}
        />
      ))}
    </View>
  );
}

export const TokenizedArticle = memo(TokenizedArticleBase);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    paddingVertical: 8,
  },
  tokenWrapper: {
    paddingHorizontal: 2,
    paddingVertical: 2,
    marginRight: 2,
    marginBottom: 6,
    borderRadius: 4,
  },
  tokenSelected: {
    backgroundColor: '#dbeafe',
  },
  tokenHighlighted: {
    backgroundColor: '#fef08a',
  },
  tokenColumn: {
    alignItems: 'center',
  },
  surface: {
    fontSize: 22,
    lineHeight: 30,
    color: '#0f172a',
  },
  reading: {
    fontSize: 11,
    lineHeight: 14,
    color: '#64748b',
    marginTop: 1,
  },
});
