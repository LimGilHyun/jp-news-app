import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { TokenizedArticle } from '../components/TokenizedArticle';
import { TranslationBottomSheet } from '../components/TranslationBottomSheet';
import { useArticleStore } from '../stores/articleStore';
import { Token } from '../types/article';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleDetail'>;

export default function ArticleDetailScreen({ route }: Props) {
  const { article } = route.params;
  const sheetRef = useRef<BottomSheetModal>(null);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);

  const markAsRead = useArticleStore((s) => s.markAsRead);

  useEffect(() => {
    if (!article.isRead) {
      markAsRead(article.id);
    }
  }, [article.id, article.isRead, markAsRead]);

  const handleTokenPress = (token: Token, idx: number) => {
    setSelectedToken(token);
    setSelectedIdx(idx);
    sheetRef.current?.present();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.source}>{article.source}</Text>
        <Text style={styles.titleJp}>{article.titleJp}</Text>
        <Text style={styles.titleKo}>{article.titleKo}</Text>

        <View style={styles.divider} />

        <TokenizedArticle
          tokens={article.tokens}
          selectedTokenIdx={selectedIdx}
          highlightRanges={[]}
          onTokenPress={handleTokenPress}
        />

        <Pressable
          onPress={() => setShowTranslation((v) => !v)}
          style={styles.translationToggle}
        >
          <Text style={styles.translationToggleText}>
            {showTranslation ? '전체 번역 숨기기' : '전체 번역 보기'}
          </Text>
        </Pressable>

        {showTranslation && (
          <View style={styles.translationBox}>
            <Text style={styles.translationText}>{article.bodyKo}</Text>
          </View>
        )}

        <Text style={styles.footnote}>
          출처: {article.source} ·{' '}
          {new Date(article.publishedAt).toLocaleDateString('ko-KR')}
        </Text>
      </ScrollView>

      <TranslationBottomSheet ref={sheetRef} token={selectedToken} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { padding: 20, paddingBottom: 80 },
  source: { fontSize: 12, color: '#475569', marginBottom: 6, fontWeight: '600' },
  titleJp: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  titleKo: { fontSize: 14, color: '#475569', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
  translationToggle: {
    marginTop: 24,
    backgroundColor: '#eff6ff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  translationToggleText: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: '600',
  },
  translationBox: {
    marginTop: 12,
    padding: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  translationText: { fontSize: 15, color: '#0f172a', lineHeight: 24 },
  footnote: { marginTop: 32, fontSize: 11, color: '#94a3b8', textAlign: 'center' },
});
