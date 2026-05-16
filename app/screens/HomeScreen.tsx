import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Star,
  BookMarked,
  Sparkles,
  Puzzle,
  Newspaper,
  Flame,
  Eye,
  EyeOff,
  Volume2,
  Check,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useArticleStore } from '../stores/articleStore';
import { useStatsStore } from '../stores/statsStore';
import { useUiStore } from '../stores/uiStore';
import { useSettingsStore } from '../stores/settingsStore';
import { Article, CategoryName, Difficulty } from '../types/article';
import { RootStackParamList } from '../App';
import { useTheme, Theme } from '../utils/theme';
import { ArticleCardSkeleton, HeroCardSkeleton } from '../components/SkeletonLoader';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const JLPT_HUE: Record<Difficulty, { light: [string, string]; dark: [string, string] }> = {
  N5: { light: ['#bbf7d0', '#16a34a'], dark: ['#14532d', '#86efac'] },
  N4: { light: ['#bfdbfe', '#2563eb'], dark: ['#1e3a8a', '#93c5fd'] },
  N3: { light: ['#fde68a', '#ca8a04'], dark: ['#713f12', '#fde047'] },
  N2: { light: ['#fed7aa', '#ea580c'], dark: ['#7c2d12', '#fdba74'] },
  N1: { light: ['#fecaca', '#dc2626'], dark: ['#7f1d1d', '#fca5a5'] },
};

function jlptColor(d: Difficulty, isDark: boolean) {
  const set = isDark ? JLPT_HUE[d].dark : JLPT_HUE[d].light;
  return { bg: set[0], fg: set[1] };
}

const WEEK_DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

interface DayOption {
  key: string;
  date: Date;
  weekdayKo: string;
  dayOfMonth: number;
  isToday: boolean;
}

function buildDayOptions(): DayOption[] {
  const out: DayOption[] = [];
  const now = new Date();
  const tzOffsetMin = -540;
  const localOffset = now.getTimezoneOffset();
  const kstShiftMs = (localOffset - tzOffsetMin) * 60_000;
  const todayKst = new Date(now.getTime() + kstShiftMs);
  todayKst.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const d = new Date(todayKst);
    d.setDate(d.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    out.push({
      key: `${yyyy}-${mm}-${dd}`,
      date: d,
      weekdayKo: WEEK_DAYS_KO[d.getDay()],
      dayOfMonth: d.getDate(),
      isToday: i === 0,
    });
  }
  return out;
}

function articleDateKey(iso: string): string {
  const d = new Date(iso);
  const tzOffsetMin = -540;
  const localOffset = d.getTimezoneOffset();
  const shifted = new Date(d.getTime() + (localOffset - tzOffsetMin) * 60_000);
  const yyyy = shifted.getFullYear();
  const mm = String(shifted.getMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

interface ArticleCardProps {
  article: Article;
  onPress: (article: Article) => void;
  onToggleFavorite: (articleId: string) => void;
  theme: Theme;
}

function ArticleCard({ article, onPress, onToggleFavorite, theme }: ArticleCardProps) {
  const styles = useCardStyles(theme);
  const jlpt = article.difficulty ? jlptColor(article.difficulty, theme.isDark) : null;
  const isRead = !!article.isRead;

  // 듣기 시간 추정: 본문 글자 수 × 0.12초
  const audioSeconds = Math.max(10, Math.round(article.bodyJp.length * 0.12));
  const audioMin = Math.floor(audioSeconds / 60);
  const audioSec = audioSeconds % 60;
  const audioLabel = audioMin > 0 ? `${audioMin}:${audioSec.toString().padStart(2, '0')}` : `0:${audioSec.toString().padStart(2, '0')}`;

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress(article);
      }}
      style={({ pressed }) => [styles.card, isRead && styles.cardRead, pressed && styles.cardPressed]}
    >
      {/* 이미지 */}
      <View style={[styles.cardImageWrap, isRead && { opacity: 0.55 }]}>
        {article.thumbnailUrl ? (
          <Image source={{ uri: article.thumbnailUrl }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Newspaper size={26} color={theme.colors.textTertiary} strokeWidth={1.5} />
          </View>
        )}
        {article.rankInCategory && article.rankInCategory <= 3 && (
          <View style={styles.rankFloating}>
            <Text style={styles.rankFloatingText}>{article.rankInCategory}위</Text>
          </View>
        )}
        {jlpt && article.difficulty && (
          <View style={[styles.jlptCorner, { backgroundColor: jlpt.bg }]}>
            <Text style={[styles.jlptCornerText, { color: jlpt.fg }]}>{article.difficulty}</Text>
          </View>
        )}
      </View>

      {/* 정보 영역 */}
      <View style={styles.cardBody}>
        {/* 상단: 출처 · 시간 + 우측 별 */}
        <View style={styles.cardTopRow}>
          <View style={styles.cardMetaInline}>
            <Text style={styles.cardSource} numberOfLines={1}>
              {article.source}
            </Text>
            <View style={styles.cardMetaDot} />
            <View style={styles.cardDuration}>
              <Volume2 size={9} color={theme.colors.textTertiary} strokeWidth={2.4} />
              <Text style={styles.cardDurationText}>{audioLabel}</Text>
            </View>
            {isRead && (
              <>
                <View style={styles.cardMetaDot} />
                <View style={styles.cardReadBadge}>
                  <Check size={9} color={theme.colors.success} strokeWidth={3} />
                  <Text style={styles.cardReadText}>읽음</Text>
                </View>
              </>
            )}
          </View>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onToggleFavorite(article.id);
            }}
            hitSlop={10}
            style={styles.favBtn}
          >
            <Star
              size={17}
              color={article.isFavorited ? theme.colors.warning : theme.colors.textTertiary}
              fill={article.isFavorited ? theme.colors.warning : 'transparent'}
              strokeWidth={2}
            />
          </Pressable>
        </View>

        {/* 제목 */}
        <Text
          style={[styles.cardTitleJp, isRead && { color: theme.colors.textSecondary }]}
          numberOfLines={2}
        >
          {article.titleJp}
        </Text>
        {article.titleKo.length > 0 && (
          <Text style={styles.cardTitleKo} numberOfLines={1}>
            {article.titleKo}
          </Text>
        )}

        {/* 학습 도구 미니 칩 (없는 건 안 보임) */}
        {(article.grammarPoints.length > 0 ||
          article.keyVocab.length > 0 ||
          article.quiz.length > 0) && (
          <View style={styles.cardFooter}>
            {article.grammarPoints.length > 0 && (
              <View style={styles.cardChipMini}>
                <Sparkles size={9} color={theme.colors.textTertiary} strokeWidth={2.4} />
                <Text style={styles.cardChipText}>{article.grammarPoints.length}</Text>
              </View>
            )}
            {article.keyVocab.length > 0 && (
              <View style={styles.cardChipMini}>
                <BookMarked size={9} color={theme.colors.textTertiary} strokeWidth={2.4} />
                <Text style={styles.cardChipText}>{article.keyVocab.length}</Text>
              </View>
            )}
            {article.quiz.length > 0 && (
              <View style={styles.cardChipMini}>
                <Puzzle size={9} color={theme.colors.textTertiary} strokeWidth={2.4} />
                <Text style={styles.cardChipText}>{article.quiz.length}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const ALL_CATEGORIES: CategoryName[] = ['주요', '사회', '연애', '정치', '경제', '국제', '스포츠', '과학', '기상'];
const ALL_JLPT: Difficulty[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
type ReadFilter = 'all' | 'unread' | 'read';

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const theme = useTheme();
  const styles = useStyles(theme);

  const articles = useArticleStore((s) => s.articles);
  const loading = useArticleStore((s) => s.loading);
  const error = useArticleStore((s) => s.error);
  const loadArticles = useArticleStore((s) => s.loadArticles);
  const toggleFavorite = useArticleStore((s) => s.toggleFavorite);

  const userName = useSettingsStore((s) => s.userName);
  const todayXp = useStatsStore((s) => s.dailyXp[kstToday()] ?? 0);
  const dailyGoal = useStatsStore((s) => s.dailyGoal);
  const totalXp = useStatsStore((s) => s.totalXp);
  const lastActiveDate = useStatsStore((s) => s.lastActiveDate);
  const rawStreak = useStatsStore((s) => s.streak);
  const streak = useMemo(() => {
    if (!lastActiveDate) return 0;
    const today = kstToday();
    const diff = dayDiff(lastActiveDate, today);
    if (diff === 0 || diff === 1) return rawStreak;
    return 0;
  }, [lastActiveDate, rawStreak]);

  const days = useMemo(() => buildDayOptions(), []);
  const [selectedKey, setSelectedKey] = useState(days[0].key);
  const [selectedCategory, setSelectedCategory] = useState<CategoryName | '전체'>('전체');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const dateFiltered = useMemo(
    () => articles.filter((a) => articleDateKey(a.publishedAt) === selectedKey),
    [articles, selectedKey]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of dateFiltered) {
      const c = a.category ?? '주요';
      counts[c] = (counts[c] ?? 0) + 1;
    }
    return counts;
  }, [dateFiltered]);

  // 자동 숨김 탭바: 아래로 스크롤 시 숨김, 위로 시 표시
  const setTabBarHidden = useUiStore((s) => s.setTabBarHidden);
  const lastScrollYRef = React.useRef(0);
  const handleScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      const y = e.nativeEvent.contentOffset.y;
      const dy = y - lastScrollYRef.current;
      if (Math.abs(dy) < 6) {
        lastScrollYRef.current = y;
        return;
      }
      if (dy > 0 && y > 60) setTabBarHidden(true);
      else if (dy < 0) setTabBarHidden(false);
      lastScrollYRef.current = y;
    },
    [setTabBarHidden]
  );

  // 화면 떠나면 탭바 다시 표시
  useEffect(() => {
    return () => setTabBarHidden(false);
  }, [setTabBarHidden]);

  const level = Math.floor(totalXp / 100) + 1;

  // 환영 메시지 (앱 마운트 시 1회 노출)
  const [welcomeMsg, setWelcomeMsg] = useState<string | null>(() => {
    const name = (userName ?? '').trim() || '오늘도';
    if (!lastActiveDate) {
      return `${name}님, 환영합니다! 첫 학습을 시작해보세요 ✨`;
    }
    const diff = dayDiff(lastActiveDate, kstToday());
    if (diff === 0 || diff === 1) {
      const s = streak >= 1 ? streak : 1;
      return `${name}님, ${s}일 연속 방문입니다! 🔥`;
    }
    return `${name}님, ${diff}일 만에 접속하셨습니다 👋`;
  });
  useEffect(() => {
    if (!welcomeMsg) return;
    const t = setTimeout(() => setWelcomeMsg(null), 4500);
    return () => clearTimeout(t);
  }, [welcomeMsg]);

  // 헤더 우측에 스트릭/레벨/XP 미니 표시
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerStatsRow}>
          <View style={styles.headerStatChip}>
            <Flame size={11} color="#f97316" strokeWidth={2.5} fill="#f97316" />
            <Text style={styles.headerStatText}>{streak}</Text>
          </View>
          <View style={styles.headerStatChip}>
            <Text style={styles.headerStatLabel}>Lv.</Text>
            <Text style={styles.headerStatText}>{level}</Text>
          </View>
          <View style={styles.headerStatChip}>
            <Text style={styles.headerStatText}>{todayXp}</Text>
            <Text style={styles.headerStatLabel}>XP</Text>
          </View>
        </View>
      ),
    });
  }, [navigation, streak, level, todayXp, styles, theme]);

  const filteredArticles = useMemo(() => {
    let list =
      selectedCategory === '전체'
        ? dateFiltered
        : dateFiltered.filter((a) => (a.category ?? '주요') === selectedCategory);

    if (readFilter === 'unread') list = list.filter((a) => !a.isRead);
    else if (readFilter === 'read') list = list.filter((a) => !!a.isRead);
    if (favoritesOnly) list = list.filter((a) => !!a.isFavorited);
    list = [...list].sort((a, b) => {
      const ra = a.rankInCategory ?? 999;
      const rb = b.rankInCategory ?? 999;
      if (ra !== rb) return ra - rb;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
    return list.slice(0, 10);
  }, [
    dateFiltered,
    selectedCategory,
    readFilter,
    favoritesOnly,
  ]);

  const siblingIds = useMemo(
    () => filteredArticles.map((a) => a.id),
    [filteredArticles]
  );

  const cycleReadFilter = () => {
    Haptics.selectionAsync().catch(() => {});
    setReadFilter((r) => (r === 'all' ? 'unread' : r === 'unread' ? 'read' : 'all'));
  };

  const dayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of articles) {
      const k = articleDateKey(a.publishedAt);
      counts[k] = (counts[k] ?? 0) + 1;
    }
    return counts;
  }, [articles]);

  const handlePress = (article: Article) => {
    navigation.navigate('ArticleDetail', { article, siblingIds });
  };


  if (loading && articles.length === 0) {
    return (
      <View style={styles.loadingWrap}>
        <HeroCardSkeleton />
        <View style={{ height: 16 }} />
        <ArticleCardSkeleton />
        <ArticleCardSkeleton />
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center} edges={['bottom']}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {welcomeMsg && (
        <View style={styles.welcomeBanner}>
          <Text style={styles.welcomeBannerText} numberOfLines={1}>
            {welcomeMsg}
          </Text>
        </View>
      )}
      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ArticleCard
            article={item}
            onPress={handlePress}
            onToggleFavorite={toggleFavorite}
            theme={theme}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        ListHeaderComponent={
          <View>
            {/* 날짜 선택 */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayStrip}
            >
              {days.map((d) => {
                const isSelected = d.key === selectedKey;
                return (
                  <Pressable
                    key={d.key}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setSelectedKey(d.key);
                    }}
                    style={[styles.dayChip, isSelected && styles.dayChipActive]}
                  >
                    <Text
                      style={[
                        styles.dayWeekday,
                        isSelected && styles.dayTextActive,
                      ]}
                    >
                      {d.isToday ? '오늘' : d.weekdayKo}
                    </Text>
                    <Text style={[styles.dayDate, isSelected && styles.dayTextActive]}>
                      {d.dayOfMonth}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* 카테고리 */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catStrip}
            >
              <Pressable
                onPress={() => setSelectedCategory('전체')}
                style={[styles.catChip, selectedCategory === '전체' && styles.catChipActive]}
              >
                <Text
                  style={[
                    styles.catChipText,
                    selectedCategory === '전체' && styles.catChipTextActive,
                  ]}
                >
                  전체 {dateFiltered.length}
                </Text>
              </Pressable>
              {ALL_CATEGORIES.map((c) => {
                const count = categoryCounts[c] ?? 0;
                const active = selectedCategory === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setSelectedCategory(c)}
                    style={[styles.catChip, active && styles.catChipActive]}
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        active && styles.catChipTextActive,
                        count === 0 && { color: theme.colors.textTertiary },
                      ]}
                    >
                      {c}{count > 0 ? ` ${count}` : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* 필터 */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterStrip}
            >
              <Pressable
                onPress={cycleReadFilter}
                style={[styles.filterChip, readFilter !== 'all' && styles.filterChipActive]}
              >
                {readFilter === 'unread' ? (
                  <EyeOff size={12} color={theme.colors.primary} strokeWidth={2.5} />
                ) : readFilter === 'read' ? (
                  <Eye size={12} color={theme.colors.primary} strokeWidth={2.5} />
                ) : (
                  <Eye size={12} color={theme.colors.textSecondary} strokeWidth={2.5} />
                )}
                <Text
                  style={[
                    styles.filterChipText,
                    readFilter !== 'all' && styles.filterChipTextActive,
                  ]}
                >
                  {readFilter === 'all' ? '읽음필터' : readFilter === 'unread' ? '안 읽음' : '읽음'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setFavoritesOnly((v) => !v);
                }}
                style={[styles.filterChip, favoritesOnly && styles.filterChipActive]}
              >
                <Star
                  size={12}
                  color={favoritesOnly ? theme.colors.primary : theme.colors.textSecondary}
                  fill={favoritesOnly ? theme.colors.primary : 'transparent'}
                  strokeWidth={2.5}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    favoritesOnly && styles.filterChipTextActive,
                  ]}
                >
                  즐겨찾기
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => loadArticles({ force: true })}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Newspaper size={40} color={theme.colors.textTertiary} strokeWidth={1.5} />
            <Text style={styles.emptyText}>이 날의 뉴스가 없습니다</Text>
            <Text style={styles.emptyHint}>다른 날짜를 선택해보세요</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function kstToday(): string {
  const d = new Date();
  const tzOffsetMin = -540;
  const localOffset = d.getTimezoneOffset();
  const shifted = new Date(d.getTime() + (localOffset - tzOffsetMin) * 60_000);
  const yyyy = shifted.getFullYear();
  const mm = String(shifted.getMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function dayDiff(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00').getTime();
  const db = new Date(b + 'T00:00:00').getTime();
  return Math.round((db - da) / 86_400_000);
}

// 탭바 + 광고 배너 (56) 공간 확보
const TAB_BOTTOM_OFFSET = (Platform.OS === 'ios' ? 100 : 80) + 56;

const useStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: theme.colors.bg },
    loadingWrap: { flex: 1, backgroundColor: theme.colors.bg, paddingTop: 16 },
    errorText: { color: theme.colors.error, fontSize: theme.fs(14), fontFamily: theme.fonts.body, textAlign: 'center' },

    welcomeBanner: {
      marginHorizontal: 12,
      marginTop: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    welcomeBannerText: {
      fontSize: theme.fs(13),
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.primary,
    },

    headerStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingRight: 12,
    },
    headerStatChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: theme.colors.surfaceMuted,
    },
    headerStatText: {
      fontSize: 11,
      fontFamily: theme.fonts.numBlack,
      color: theme.colors.textPrimary,
    },
    headerStatLabel: {
      fontSize: 9,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textTertiary,
    },

    heroWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
    heroCompact: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
      ...theme.shadows.md,
    },
    heroStatItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    heroStatValue: {
      fontSize: theme.fs(16),
      color: '#fff',
      fontFamily: theme.fonts.numBlack,
      letterSpacing: -0.3,
    },
    heroStatLabel: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.85)',
      fontFamily: theme.fonts.bodyBold,
    },
    heroDivider: {
      width: 1,
      height: 28,
      backgroundColor: 'rgba(255,255,255,0.25)',
    },
    heroXpRowCompact: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    heroXpGoalCompact: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.85)',
      fontFamily: theme.fonts.numBold,
    },
    heroProgressTrack: {
      marginTop: 4,
      width: '100%',
      height: 4,
      borderRadius: 2,
      backgroundColor: 'rgba(255,255,255,0.25)',
      overflow: 'hidden',
    },
    heroProgressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },

    dayStrip: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
      gap: 6,
    },
    dayChip: {
      minWidth: 40,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    dayWeekday: {
      fontSize: 9,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textSecondary,
      marginBottom: 1,
      includeFontPadding: false,
    },
    dayDate: {
      fontSize: theme.fs(13),
      fontFamily: theme.fonts.numBlack,
      color: theme.colors.textPrimary,
      includeFontPadding: false,
    },
    dayTextActive: { color: '#ffffff' },
    dayCount: {
      marginTop: 4,
      paddingHorizontal: 5,
      minWidth: 16,
      height: 14,
      borderRadius: 7,
      backgroundColor: theme.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayCountActive: { backgroundColor: 'rgba(255,255,255,0.28)' },
    dayCountText: { fontSize: 9, fontFamily: theme.fonts.numBlack, color: theme.colors.primary },
    dayCountTextActive: { color: '#ffffff' },

    catStrip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 6,
      alignItems: 'center',
    },
    catChip: {
      paddingHorizontal: 4,
      paddingVertical: 8,
      marginHorizontal: 4,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
      justifyContent: 'center',
    },
    catChipActive: {
      borderBottomColor: theme.colors.primary,
    },
    catChipText: {
      fontSize: 13,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textSecondary,
      includeFontPadding: false,
    },
    catChipTextActive: { color: theme.colors.primary },

    filterStrip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      paddingBottom: 14,
      gap: 6,
      alignItems: 'center',
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      minHeight: 30,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterChipActive: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
    },
    filterChipText: {
      fontSize: 11,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textSecondary,
      includeFontPadding: false,
    },
    filterChipTextActive: { color: theme.colors.primary },

    listContent: { paddingBottom: TAB_BOTTOM_OFFSET + 24 },

    emptyBox: { alignItems: 'center', paddingTop: 60, gap: 8 },
    emptyText: {
      fontSize: theme.fs(14),
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textPrimary,
      marginTop: 8,
    },
    emptyHint: {
      fontSize: theme.fs(12),
      fontFamily: theme.fonts.body,
      color: theme.colors.textTertiary,
    },
  });

const useCardStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginHorizontal: 12,
      marginBottom: 6,
      padding: 8,
      gap: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    cardRead: { backgroundColor: theme.colors.bg },
    cardPressed: { transform: [{ scale: 0.99 }], opacity: 0.94 },
    cardImageWrap: {
      position: 'relative',
      width: 76,
      height: 76,
      borderRadius: 10,
      overflow: 'hidden',
    },
    cardImage: { width: '100%', height: '100%' },
    cardImagePlaceholder: {
      backgroundColor: theme.colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rankFloating: {
      position: 'absolute',
      top: 4,
      left: 4,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 5,
      backgroundColor: 'rgba(0,0,0,0.7)',
    },
    rankFloatingText: {
      color: '#fff',
      fontSize: 9,
      fontFamily: theme.fonts.numBlack,
    },
    jlptCorner: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
    },
    jlptCornerText: {
      fontSize: 9,
      fontFamily: theme.fonts.numBlack,
    },
    cardBody: { flex: 1, justifyContent: 'space-between', paddingVertical: 1 },
    cardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 6,
    },
    cardMetaInline: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    cardMetaDot: {
      width: 2,
      height: 2,
      borderRadius: 1,
      backgroundColor: theme.colors.textTertiary,
      opacity: 0.6,
    },
    cardSource: {
      fontSize: 10,
      fontFamily: theme.fonts.bodyBlack,
      color: theme.colors.error,
      letterSpacing: 0.3,
    },
    cardDuration: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    cardDurationText: {
      fontSize: 10,
      fontFamily: theme.fonts.numBold,
      color: theme.colors.textTertiary,
    },
    cardReadBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    cardReadText: {
      fontSize: 9,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.success,
    },
    favBtn: { paddingHorizontal: 2, paddingVertical: 2 },
    cardTitleJp: {
      fontSize: theme.fs(13),
      fontFamily: theme.fonts.jpBold,
      color: theme.colors.textPrimary,
      lineHeight: theme.fs(19),
      includeFontPadding: false,
      marginTop: 4,
    },
    cardTitleKo: {
      fontSize: theme.fs(11),
      fontFamily: theme.fonts.body,
      color: theme.colors.textSecondary,
      lineHeight: theme.fs(14),
      marginTop: 2,
    },
    cardFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 5 },
    cardChipMini: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
      backgroundColor: theme.colors.surfaceMuted,
    },
    cardChipText: {
      fontSize: 10,
      fontFamily: theme.fonts.numBold,
      color: theme.colors.textSecondary,
    },
  });
