import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ArticleCard } from '../components/ArticleCard';
import { useArticleStore } from '../stores/articleStore';
import { Article } from '../types/article';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { articles, loading, error, loadArticles, toggleFavorite } =
    useArticleStore();

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handlePress = (article: Article) => {
    navigation.navigate('ArticleDetail', { article });
  };

  if (loading && articles.length === 0) {
    return (
      <SafeAreaView style={styles.center} edges={['bottom']}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.hint}>오늘의 뉴스를 불러오는 중입니다...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center} edges={['bottom']}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  const unreadCount = articles.filter((a) => !a.isRead).length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          오늘 읽지 않은 기사 {unreadCount}건 / 전체 {articles.length}건
        </Text>
      </View>
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ArticleCard
            article={item}
            onPress={handlePress}
            onToggleFavorite={toggleFavorite}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => loadArticles({ force: true })} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.hint}>표시할 기사가 없습니다.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  summary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#dbeafe',
  },
  summaryText: { fontSize: 13, color: '#1e40af', fontWeight: '500' },
  listContent: { paddingVertical: 6 },
  hint: { color: '#64748b', fontSize: 14, marginTop: 12 },
  errorText: { color: '#dc2626', fontSize: 14, textAlign: 'center' },
});
