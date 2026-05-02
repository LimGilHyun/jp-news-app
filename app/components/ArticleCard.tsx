import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Article } from '../types/article';

interface Props {
  article: Article;
  onPress: (article: Article) => void;
  onToggleFavorite: (articleId: string) => void;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${mm}/${dd} ${hh}:${min}`;
  } catch {
    return iso;
  }
}

function ArticleCardBase({ article, onPress, onToggleFavorite }: Props) {
  return (
    <Pressable
      onPress={() => onPress(article)}
      android_ripple={{ color: '#f1f5f9' }}
      style={[styles.card, article.isRead && styles.cardRead]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.source}>{article.source}</Text>
        {article.difficulty && (
          <Text style={styles.difficulty}>{article.difficulty}</Text>
        )}
        {!article.isRead && <View style={styles.unreadDot} />}
      </View>

      <Text style={[styles.titleJp, article.isRead && styles.titleRead]} numberOfLines={2}>
        {article.titleJp}
      </Text>
      <Text style={styles.titleKo} numberOfLines={1}>
        {article.titleKo}
      </Text>

      <View style={styles.footerRow}>
        <Text style={styles.date}>{formatDate(article.publishedAt)}</Text>
        <Pressable
          onPress={() => onToggleFavorite(article.id)}
          hitSlop={12}
          style={styles.favoriteBtn}
        >
          <Text style={styles.favoriteIcon}>
            {article.isFavorited ? '★' : '☆'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export const ArticleCard = memo(ArticleCardBase);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardRead: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  source: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  difficulty: {
    fontSize: 11,
    color: '#1d4ed8',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginLeft: 'auto',
  },
  titleJp: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  titleRead: {
    color: '#64748b',
    fontWeight: '500',
  },
  titleKo: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  date: {
    fontSize: 11,
    color: '#94a3b8',
  },
  favoriteBtn: {
    paddingHorizontal: 4,
  },
  favoriteIcon: {
    fontSize: 22,
    color: '#f59e0b',
  },
});
