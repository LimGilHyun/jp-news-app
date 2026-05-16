import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Sparkles, Volume2 } from 'lucide-react-native';

import { useTheme, Theme } from '../utils/theme';

interface PreviewCard {
  jp: string;
  kana: string;
  romaji: string;
  meaning: string;
  pos: string;
  gradient: readonly [string, string, string];
  accent: string;
  imagePromptHint: string;
}

// N5 핵심 단어 10개 — 지브리 톤 카드 데모
const PREVIEW_CARDS: PreviewCard[] = [
  {
    jp: '水', kana: 'みず', romaji: 'mizu', meaning: '물', pos: '명사',
    gradient: ['#cffafe', '#67e8f9', '#0891b2'] as const, accent: '#0e7490',
    imagePromptHint: '맑은 시냇물 + 물방울',
  },
  {
    jp: '山', kana: 'やま', romaji: 'yama', meaning: '산', pos: '명사',
    gradient: ['#dcfce7', '#86efac', '#15803d'] as const, accent: '#166534',
    imagePromptHint: '새벽 안개 산봉우리',
  },
  {
    jp: '猫', kana: 'ねこ', romaji: 'neko', meaning: '고양이', pos: '명사',
    gradient: ['#ffedd5', '#fdba74', '#c2410c'] as const, accent: '#9a3412',
    imagePromptHint: '햇볕에 잠든 고양이',
  },
  {
    jp: '桜', kana: 'さくら', romaji: 'sakura', meaning: '벚꽃', pos: '명사',
    gradient: ['#fce7f3', '#f9a8d4', '#db2777'] as const, accent: '#9d174d',
    imagePromptHint: '만개한 벚꽃 가지',
  },
  {
    jp: '駅', kana: 'えき', romaji: 'eki', meaning: '역', pos: '명사',
    gradient: ['#ede9fe', '#c4b5fd', '#7c3aed'] as const, accent: '#5b21b6',
    imagePromptHint: '시골 목조 기차역',
  },
  {
    jp: '雨', kana: 'あめ', romaji: 'ame', meaning: '비', pos: '명사',
    gradient: ['#e0f2fe', '#7dd3fc', '#0284c7'] as const, accent: '#075985',
    imagePromptHint: '잎새에 떨어지는 빗방울',
  },
  {
    jp: '学校', kana: 'がっこう', romaji: 'gakkou', meaning: '학교', pos: '명사',
    gradient: ['#fef3c7', '#fcd34d', '#d97706'] as const, accent: '#92400e',
    imagePromptHint: '벚꽃 핀 목조 학교',
  },
  {
    jp: '家', kana: 'いえ', romaji: 'ie', meaning: '집', pos: '명사',
    gradient: ['#fee2e2', '#fca5a5', '#dc2626'] as const, accent: '#991b1b',
    imagePromptHint: '빨간 지붕 시골집',
  },
  {
    jp: '本', kana: 'ほん', romaji: 'hon', meaning: '책', pos: '명사',
    gradient: ['#ecfccb', '#bef264', '#65a30d'] as const, accent: '#3f6212',
    imagePromptHint: '햇살 든 책상 위 펼친 책',
  },
  {
    jp: '朝', kana: 'あさ', romaji: 'asa', meaning: '아침', pos: '명사',
    gradient: ['#ffedd5', '#fdba74', '#ea580c'] as const, accent: '#9a3412',
    imagePromptHint: '논밭 위 일출',
  },
];

export default function CardPreviewScreen() {
  const theme = useTheme();
  const styles = useStyles(theme);

  const speak = (jp: string) => {
    Speech.stop();
    Speech.speak(jp, { language: 'ja-JP', rate: 0.85 });
    Haptics.selectionAsync().catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <Sparkles size={12} color={theme.colors.primary} strokeWidth={2.5} />
            <Text style={styles.headerBadgeText}>지브리 톤 카드 데모</Text>
          </View>
          <Text style={styles.headerTitle}>수집 카드 미리보기</Text>
          <Text style={styles.headerSub}>
            N5 핵심 10단어 · SRS에서 3회 연속 정답 시 카드 획득
          </Text>
        </View>

        {PREVIEW_CARDS.map((card, idx) => (
          <CollectibleCard
            key={card.jp}
            card={card}
            index={idx}
            onSpeak={() => speak(card.jp)}
            theme={theme}
            styles={styles}
          />
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            카드 일러스트 자리는 AI 생성 이미지로 채워질 예정입니다.
          </Text>
          <Text style={styles.footerHint}>
            현재는 단어별 컬러 톤과 레이아웃 미리보기 — 실제 그림은 지브리 스타일 수채화 톤으로 생성됩니다.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface CardProps {
  card: PreviewCard;
  index: number;
  onSpeak: () => void;
  theme: Theme;
  styles: ReturnType<typeof useStyles>;
}

function CollectibleCard({ card, index, onSpeak, theme, styles }: CardProps) {
  return (
    <View style={styles.cardWrap}>
      <View style={styles.cardOuter}>
        {/* 카드 헤더: 레어도 + 번호 */}
        <View style={[styles.cardHeader, { backgroundColor: card.accent }]}>
          <Text style={styles.cardLevel}>N5</Text>
          <View style={styles.rarityPill}>
            <Sparkles size={9} color="#fff" strokeWidth={3} />
            <Text style={styles.rarityText}>COMMON</Text>
          </View>
          <Text style={styles.cardNumber}>{String(index + 1).padStart(3, '0')}/010</Text>
        </View>

        {/* 일러스트 자리 — 그라디언트 + 큰 한자 (placeholder) */}
        <View style={styles.illustrationFrame}>
          <LinearGradient
            colors={card.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.illustration}
          >
            {/* 홀로그래픽 sheen */}
            <LinearGradient
              colors={[
                'rgba(255,255,255,0.45)',
                'rgba(255,255,255,0)',
                'rgba(255,255,255,0.18)',
              ]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.illustrationKanji} numberOfLines={1}>
              {card.jp}
            </Text>
            <Text style={styles.illustrationHint}>{card.imagePromptHint}</Text>
          </LinearGradient>
        </View>

        {/* 단어 정보 */}
        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardJp, { color: card.accent }]}>{card.jp}</Text>
            <Pressable onPress={onSpeak} hitSlop={8} style={styles.speakBtn}>
              <Volume2 size={14} color={card.accent} strokeWidth={2.5} />
            </Pressable>
          </View>
          <Text style={styles.cardKana}>
            {card.kana} · <Text style={styles.cardRomaji}>{card.romaji}</Text>
          </Text>

          <View style={styles.divider} />

          <View style={styles.cardMetaRow}>
            <View style={[styles.posBadge, { backgroundColor: card.accent + '22' }]}>
              <Text style={[styles.posBadgeText, { color: card.accent }]}>
                {card.pos}
              </Text>
            </View>
            <Text style={styles.cardMeaning}>{card.meaning}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const useStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    scroll: { padding: 16, paddingBottom: 140 },

    header: {
      alignItems: 'center',
      marginBottom: 20,
      gap: 8,
    },
    headerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: theme.colors.primarySoft,
    },
    headerBadgeText: {
      fontSize: 11,
      color: theme.colors.primary,
      fontFamily: theme.fonts.bodyBold,
    },
    headerTitle: {
      fontSize: theme.fs(22),
      fontFamily: theme.fonts.bodyBlack,
      color: theme.colors.textPrimary,
      letterSpacing: -0.5,
    },
    headerSub: {
      fontSize: theme.fs(12),
      color: theme.colors.textTertiary,
      fontFamily: theme.fonts.bodyMedium,
      textAlign: 'center',
    },

    cardWrap: {
      alignItems: 'center',
      marginBottom: 18,
    },
    cardOuter: {
      width: '100%',
      maxWidth: 360,
      borderRadius: 22,
      backgroundColor: theme.colors.bgElevated,
      borderWidth: 2,
      borderColor: theme.colors.borderStrong,
      overflow: 'hidden',
      ...theme.shadows.lg,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    cardLevel: {
      fontSize: 12,
      fontFamily: theme.fonts.numBlack,
      color: '#fff',
      letterSpacing: 1,
    },
    rarityPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.22)',
    },
    rarityText: {
      fontSize: 9,
      fontFamily: theme.fonts.bodyBlack,
      color: '#fff',
      letterSpacing: 1.4,
    },
    cardNumber: {
      fontSize: 10,
      fontFamily: theme.fonts.numBold,
      color: 'rgba(255,255,255,0.85)',
      letterSpacing: 0.5,
    },

    illustrationFrame: {
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 8,
    },
    illustration: {
      aspectRatio: 1,
      borderRadius: 16,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    illustrationKanji: {
      fontSize: 132,
      fontFamily: theme.fonts.jpBold,
      color: 'rgba(255,255,255,0.92)',
      includeFontPadding: false,
      textShadowColor: 'rgba(0,0,0,0.18)',
      textShadowOffset: { width: 0, height: 3 },
      textShadowRadius: 8,
    },
    illustrationHint: {
      position: 'absolute',
      bottom: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: 'rgba(0,0,0,0.28)',
      fontSize: 10,
      fontFamily: theme.fonts.bodyMedium,
      color: '#fff',
    },

    cardBody: {
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 16,
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardJp: {
      fontSize: theme.fs(28),
      fontFamily: theme.fonts.jpBold,
      letterSpacing: -1,
    },
    speakBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardKana: {
      fontSize: theme.fs(13),
      fontFamily: theme.fonts.jp,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    cardRomaji: {
      fontFamily: theme.fonts.numBold,
      color: theme.colors.textTertiary,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 10,
    },
    cardMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    posBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    posBadgeText: {
      fontSize: 10,
      fontFamily: theme.fonts.bodyBlack,
      letterSpacing: 0.4,
    },
    cardMeaning: {
      fontSize: theme.fs(15),
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textPrimary,
    },

    footer: {
      marginTop: 12,
      paddingHorizontal: 16,
      paddingVertical: 18,
      borderRadius: 14,
      backgroundColor: theme.colors.surfaceMuted,
      gap: 6,
    },
    footerText: {
      fontSize: theme.fs(12),
      color: theme.colors.textSecondary,
      fontFamily: theme.fonts.bodyBold,
      textAlign: 'center',
    },
    footerHint: {
      fontSize: 11,
      color: theme.colors.textTertiary,
      fontFamily: theme.fonts.bodyMedium,
      textAlign: 'center',
      lineHeight: 16,
    },
  });
