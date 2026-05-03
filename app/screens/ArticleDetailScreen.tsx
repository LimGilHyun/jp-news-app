import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Speech from 'expo-speech';

import { TokenizedArticle } from '../components/TokenizedArticle';
import { TranslationBottomSheet } from '../components/TranslationBottomSheet';
import { useArticleStore } from '../stores/articleStore';
import { useHighlightStore } from '../stores/highlightStore';
import { Token } from '../types/article';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleDetail'>;

type Mode = 'tap' | 'highlight';

export default function ArticleDetailScreen({ route }: Props) {
  const { article } = route.params;
  const sheetRef = useRef<BottomSheetModal>(null);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [mode, setMode] = useState<Mode>('tap');
  const [dragSel, setDragSel] = useState<{
    sentenceIdx: number;
    start: number;
    end: number;
  } | null>(null);

  const markAsRead = useArticleStore((s) => s.markAsRead);
  const highlights = useHighlightStore((s) =>
    s.highlights.filter((h) => h.articleId === article.id)
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

  const handleTokenPress = (sentenceIdx: number, token: Token, tIdx: number) => {
    if (mode === 'highlight') {
      // 형광펜 모드: 첫 탭=시작, 다른 탭=종료 (같은 문장 안에서만)
      if (!dragSel || dragSel.sentenceIdx !== sentenceIdx) {
        setDragSel({ sentenceIdx, start: tIdx, end: tIdx });
      } else {
        setDragSel({ sentenceIdx, start: dragSel.start, end: tIdx });
      }
      return;
    }
    setSelectedToken(token);
    setSelectedKey(`${sentenceIdx}-${tIdx}`);
    sheetRef.current?.present();
  };

  const handleTokenLongPress = (sentenceIdx: number, _token: Token, tIdx: number) => {
    // 길게 누르면 자동으로 형광펜 모드 + 시작점 지정
    setMode('highlight');
    setDragSel({ sentenceIdx, start: tIdx, end: tIdx });
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
      setDragSel(null);
      setMode('tap');
      Alert.alert('단어장에 추가됨', `'${text}' 가 SRS 단어장에 저장되었습니다.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('저장 실패', msg);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.toolbar}>
        <Pressable
          onPress={() => {
            setMode((m) => (m === 'tap' ? 'highlight' : 'tap'));
            setDragSel(null);
          }}
          style={[styles.toolBtn, mode === 'highlight' && styles.toolBtnActive]}
        >
          <Text style={[styles.toolBtnText, mode === 'highlight' && styles.toolBtnTextActive]}>
            🖍 형광펜 {mode === 'highlight' ? 'ON' : 'OFF'}
          </Text>
        </Pressable>
        {mode === 'highlight' && dragSel && (
          <Pressable onPress={saveHighlight} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>저장</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.source}>{article.source}</Text>
        <Text style={styles.titleJp}>{article.titleJp}</Text>
        <Text style={styles.titleKo}>{article.titleKo}</Text>

        <View style={styles.divider} />

        <TokenizedArticle
          sentences={article.sentences}
          highlights={highlights.map((h) => ({
            sentenceIdx: h.sentenceIdx,
            startTokenIdx: h.startTokenIdx,
            endTokenIdx: h.endTokenIdx,
          }))}
          selectedTokenKey={selectedKey}
          dragSelection={dragSel}
          onTokenPress={handleTokenPress}
          onTokenLongPress={handleTokenLongPress}
        />

        <Pressable onPress={() => setShowTranslation((v) => !v)} style={styles.translationToggle}>
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
          출처: {article.source} · {new Date(article.publishedAt).toLocaleDateString('ko-KR')}
        </Text>
      </ScrollView>

      <TranslationBottomSheet ref={sheetRef} token={selectedToken} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  toolBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
  },
  toolBtnActive: { backgroundColor: '#fef08a' },
  toolBtnText: { color: '#475569', fontSize: 13, fontWeight: '600' },
  toolBtnTextActive: { color: '#854d0e' },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2563eb',
  },
  saveBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },
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
  translationToggleText: { color: '#1d4ed8', fontSize: 14, fontWeight: '600' },
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
