import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Flame, Trophy, Newspaper, BookMarked, BarChart3 } from 'lucide-react-native';

import { useStatsStore } from '../stores/statsStore';
import { useArticleStore } from '../stores/articleStore';
import { useHighlightStore } from '../stores/highlightStore';
import { Difficulty, CategoryName } from '../types/article';
import { useTheme, Theme } from '../utils/theme';
import { BarChart, BarDatum } from '../components/charts/BarChart';
import { Donut, DonutSegment } from '../components/charts/Donut';

const ALL_CATEGORIES: CategoryName[] = ['주요', '사회', '연애', '정치', '경제', '국제', '스포츠', '과학', '기상'];
const ALL_JLPT: Difficulty[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

const JLPT_DOT: Record<Difficulty, { light: string; dark: string }> = {
  N5: { light: '#16a34a', dark: '#86efac' },
  N4: { light: '#2563eb', dark: '#93c5fd' },
  N3: { light: '#ca8a04', dark: '#fde047' },
  N2: { light: '#ea580c', dark: '#fdba74' },
  N1: { light: '#dc2626', dark: '#fca5a5' },
};

function kstToday(): string {
  const d = new Date();
  const tzOffsetMin = -540;
  const localOffset = d.getTimezoneOffset();
  const shifted = new Date(d.getTime() + (localOffset - tzOffsetMin) * 60_000);
  return shifted.toISOString().slice(0, 10);
}

function buildDayKeys(count: number): string[] {
  const out: string[] = [];
  const now = new Date();
  const tzOffsetMin = -540;
  const localOffset = now.getTimezoneOffset();
  const shifted = new Date(now.getTime() + (localOffset - tzOffsetMin) * 60_000);
  shifted.setHours(0, 0, 0, 0);
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(shifted);
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function formatLabel(key: string, mode: 7 | 30): string {
  const d = new Date(key + 'T00:00:00');
  if (mode === 7) {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[d.getDay()];
  }
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function StatsScreen() {
  const theme = useTheme();
  const styles = useStyles(theme);
  const dailyXp = useStatsStore((s) => s.dailyXp);
  const totalXp = useStatsStore((s) => s.totalXp);
  const streak = useStatsStore((s) => s.streak);
  const lastActiveDate = useStatsStore((s) => s.lastActiveDate);
  const dailyGoal = useStatsStore((s) => s.dailyGoal);
  const articlesReadIds = useStatsStore((s) => s.articlesReadIds);
  const articles = useArticleStore((s) => s.articles);
  const highlights = useHighlightStore((s) => s.highlights);

  const [period, setPeriod] = useState<7 | 30>(7);

  const liveStreak = useMemo(() => {
    if (!lastActiveDate) return 0;
    const today = kstToday();
    const dt = (a: string, b: string) =>
      Math.round(
        (new Date(b + 'T00:00:00').getTime() -
          new Date(a + 'T00:00:00').getTime()) /
          86_400_000
      );
    const diff = dt(lastActiveDate, today);
    return diff === 0 || diff === 1 ? streak : 0;
  }, [streak, lastActiveDate]);

  const level = Math.floor(totalXp / 100) + 1;
  const xpInLevel = totalXp % 100;
  const today = kstToday();

  const barData: BarDatum[] = useMemo(() => {
    return buildDayKeys(period).map((key) => ({
      label: formatLabel(key, period),
      value: dailyXp[key] ?? 0,
      isToday: key === today,
    }));
  }, [period, dailyXp, today]);

  const totalReadCount = articlesReadIds.length;
  const totalVocabCount = highlights.length;

  const articleById = useMemo(() => {
    const map = new Map<string, (typeof articles)[number]>();
    for (const a of articles) map.set(a.id, a);
    return map;
  }, [articles]);

  const jlptSegments: DonutSegment[] = useMemo(() => {
    const counts: Record<Difficulty, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
    for (const h of highlights) {
      const a = articleById.get(h.articleId);
      const d = a?.difficulty;
      if (d) counts[d] += 1;
    }
    return ALL_JLPT.map((d) => ({
      label: d,
      value: counts[d],
      color: theme.isDark ? JLPT_DOT[d].dark : JLPT_DOT[d].light,
    })).filter((s) => s.value > 0);
  }, [highlights, articleById, theme.isDark]);

  const totalJlptCount = jlptSegments.reduce((s, x) => s + x.value, 0);

  const categoryProgress = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const id of articlesReadIds) {
      const a = articleById.get(id);
      const c = a?.category ?? '주요';
      counts[c] = (counts[c] ?? 0) + 1;
    }
    const max = Math.max(1, ...Object.values(counts));
    return ALL_CATEGORIES.map((c) => ({
      category: c,
      count: counts[c] ?? 0,
      ratio: (counts[c] ?? 0) / max,
    }));
  }, [articlesReadIds, articleById]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* 요약 카드 */}
        <LinearGradient
          colors={theme.colors.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroPill}>
              <BarChart3 size={12} color="#fff" strokeWidth={2.5} />
              <Text style={styles.heroPillText}>학습 통계</Text>
            </View>
            <View style={styles.heroLevelPill}>
              <Text style={styles.heroLevelText}>Lv.{level}</Text>
            </View>
          </View>
          <Text style={styles.heroTotal}>{totalXp.toLocaleString()}</Text>
          <Text style={styles.heroTotalLabel}>누적 XP</Text>
          <View style={styles.heroProgressTrack}>
            <View
              style={[styles.heroProgressFill, { width: `${xpInLevel}%` }]}
            />
          </View>
          <Text style={styles.heroProgressText}>
            다음 레벨까지 {100 - xpInLevel} XP
          </Text>
        </LinearGradient>

        {/* 통계 칩 4개 */}
        <View style={styles.statsRow}>
          <StatChip
            theme={theme}
            Icon={Flame}
            iconColor="#f97316"
            value={`${liveStreak}일`}
            label="연속 학습"
          />
          <StatChip
            theme={theme}
            Icon={Trophy}
            iconColor={theme.colors.warning}
            value={`${dailyGoal}`}
            label="일일 목표"
          />
          <StatChip
            theme={theme}
            Icon={Newspaper}
            iconColor={theme.colors.primary}
            value={`${totalReadCount}`}
            label="읽은 기사"
          />
          <StatChip
            theme={theme}
            Icon={BookMarked}
            iconColor={theme.colors.accent}
            value={`${totalVocabCount}`}
            label="단어"
          />
        </View>

        {/* XP 막대 그래프 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>일별 XP</Text>
            <View style={styles.periodSwitch}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setPeriod(7);
                }}
                style={[
                  styles.periodBtn,
                  period === 7 && styles.periodBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.periodBtnText,
                    period === 7 && styles.periodBtnTextActive,
                  ]}
                >
                  7일
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setPeriod(30);
                }}
                style={[
                  styles.periodBtn,
                  period === 30 && styles.periodBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.periodBtnText,
                    period === 30 && styles.periodBtnTextActive,
                  ]}
                >
                  30일
                </Text>
              </Pressable>
            </View>
          </View>
          <BarChart
            data={barData}
            height={160}
            goalLine={dailyGoal}
            compact={period === 30}
          />
          <Text style={styles.cardSub}>
            점선: 일일 목표 ({dailyGoal} XP)
          </Text>
        </View>

        {/* JLPT 도넛 */}
        {totalJlptCount > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>난이도별 단어</Text>
            <View style={{ height: 12 }} />
            <Donut
              segments={jlptSegments}
              size={130}
              thickness={14}
              centerLabel={`${totalJlptCount}`}
              centerSub="단어"
            />
          </View>
        )}

        {/* 카테고리 진척도 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>카테고리별 학습</Text>
          <View style={{ height: 8 }} />
          {categoryProgress.map((cp) => (
            <View key={cp.category} style={styles.catRow}>
              <Text style={styles.catLabel}>{cp.category}</Text>
              <View style={styles.catBarTrack}>
                <View
                  style={[
                    styles.catBarFill,
                    {
                      width: `${Math.max(cp.ratio * 100, cp.count > 0 ? 4 : 0)}%`,
                      backgroundColor:
                        cp.count > 0 ? theme.colors.primary : 'transparent',
                    },
                  ]}
                />
              </View>
              <Text style={styles.catCount}>{cp.count}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface StatChipProps {
  theme: Theme;
  Icon: typeof Flame;
  iconColor: string;
  value: string;
  label: string;
}

function StatChip({ theme, Icon, iconColor, value, label }: StatChipProps) {
  const styles = useStyles(theme);
  return (
    <View style={styles.statChip}>
      <View
        style={[styles.statChipIcon, { backgroundColor: iconColor + '22' }]}
      >
        <Icon size={16} color={iconColor} strokeWidth={2.4} />
      </View>
      <Text style={styles.statChipValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statChipLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const useStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    scroll: { padding: 16, paddingBottom: 120 },

    hero: {
      borderRadius: 24,
      paddingHorizontal: 22,
      paddingVertical: 22,
      ...theme.shadows.lg,
    },
    heroTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    heroPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: 'rgba(0,0,0,0.18)',
    },
    heroPillText: { color: '#fff', fontSize: 11, fontFamily: theme.fonts.bodyBold },
    heroLevelPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.22)',
    },
    heroLevelText: {
      color: '#fff',
      fontSize: 12,
      fontFamily: theme.fonts.numBlack,
    },
    heroTotal: {
      color: '#fff',
      fontSize: theme.fs(48),
      fontFamily: theme.fonts.numBlack,
      lineHeight: theme.fs(54),
      letterSpacing: -1.5,
    },
    heroTotalLabel: {
      color: 'rgba(255,255,255,0.92)',
      fontSize: theme.fs(14),
      fontFamily: theme.fonts.bodyBold,
      marginBottom: 14,
    },
    heroProgressTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(255,255,255,0.22)',
      overflow: 'hidden',
    },
    heroProgressFill: { height: '100%', backgroundColor: '#fff' },
    heroProgressText: {
      marginTop: 8,
      color: 'rgba(255,255,255,0.92)',
      fontSize: 11,
      fontFamily: theme.fonts.bodyBold,
    },

    statsRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    statChip: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: 'center',
      ...theme.shadows.sm,
    },
    statChipIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    statChipValue: {
      fontSize: theme.fs(15),
      fontFamily: theme.fonts.numBlack,
      color: theme.colors.textPrimary,
    },
    statChipLabel: {
      fontSize: 10,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textTertiary,
      marginTop: 2,
    },

    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 18,
      padding: 16,
      marginTop: 12,
      ...theme.shadows.sm,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    cardTitle: {
      fontSize: theme.fs(14),
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textPrimary,
    },
    cardSub: {
      fontSize: 10,
      fontFamily: theme.fonts.bodyMedium,
      color: theme.colors.textTertiary,
      marginTop: 8,
      textAlign: 'right',
    },
    periodSwitch: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: 999,
      padding: 3,
      gap: 2,
    },
    periodBtn: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    periodBtnActive: {
      backgroundColor: theme.colors.surface,
      ...theme.shadows.sm,
    },
    periodBtnText: {
      fontSize: 11,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textTertiary,
    },
    periodBtnTextActive: {
      color: theme.colors.textPrimary,
    },

    catRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 6,
    },
    catLabel: {
      width: 50,
      fontSize: theme.fs(12),
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textPrimary,
    },
    catBarTrack: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.surfaceMuted,
      overflow: 'hidden',
    },
    catBarFill: { height: '100%', borderRadius: 4 },
    catCount: {
      width: 28,
      textAlign: 'right',
      fontSize: 11,
      fontFamily: theme.fonts.numBold,
      color: theme.colors.textSecondary,
    },
  });
