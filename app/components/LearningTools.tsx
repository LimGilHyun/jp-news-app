import React, { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
// Reanimated 4 Expo Go 호환 안돼서 깜빡임 애니메이션 → 정적 강조로 대체
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookMarked,
  Puzzle,
  Check,
  X,
  ArrowUpRight,
} from 'lucide-react-native';

import { GrammarPoint, KeyVocab, QuizQuestion } from '../types/article';
import { useTheme, Theme } from '../utils/theme';

const JLPT_HUE: Record<string, { light: [string, string]; dark: [string, string] }> = {
  N5: { light: ['#bbf7d0', '#16a34a'], dark: ['#14532d', '#86efac'] },
  N4: { light: ['#bfdbfe', '#2563eb'], dark: ['#1e3a8a', '#93c5fd'] },
  N3: { light: ['#fde68a', '#ca8a04'], dark: ['#713f12', '#fde047'] },
  N2: { light: ['#fed7aa', '#ea580c'], dark: ['#7c2d12', '#fdba74'] },
  N1: { light: ['#fecaca', '#dc2626'], dark: ['#7f1d1d', '#fca5a5'] },
};

function jlptColors(jlpt: string | undefined, isDark: boolean) {
  if (!jlpt || !JLPT_HUE[jlpt]) return null;
  const set = isDark ? JLPT_HUE[jlpt].dark : JLPT_HUE[jlpt].light;
  return { bg: set[0], fg: set[1] };
}

interface SectionHeaderProps {
  Icon: typeof Sparkles;
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  styles: ReturnType<typeof useStyles>;
  theme: Theme;
}

const SectionHeader = memo(function SectionHeader({
  Icon, title, count, expanded, onToggle, styles, theme,
}: SectionHeaderProps) {
  return (
    <Pressable onPress={onToggle} style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.sectionIconWrap}>
          <Icon size={14} color={theme.colors.primary} strokeWidth={2.4} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{count}</Text>
        </View>
      </View>
      {expanded ? (
        <ChevronUp size={16} color={theme.colors.textTertiary} strokeWidth={2.4} />
      ) : (
        <ChevronDown size={16} color={theme.colors.textTertiary} strokeWidth={2.4} />
      )}
    </Pressable>
  );
});

interface GrammarSectionProps {
  items: GrammarPoint[];
  highlightIdx?: number | null;
  onClearHighlight?: () => void;
  forceExpanded?: boolean;
}

interface HighlightedGrammarItemProps {
  point: GrammarPoint;
  isHighlighted: boolean;
  styles: ReturnType<typeof useStyles>;
  theme: Theme;
}

const HighlightedGrammarItem = memo(function HighlightedGrammarItem({
  point,
  isHighlighted,
  styles,
  theme,
}: HighlightedGrammarItemProps) {
  const jlpt = jlptColors(point.jlpt, theme.isDark);

  return (
    <View style={styles.grammarItem}>
      {isHighlighted && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: -10,
            right: -10,
            top: -8,
            bottom: -8,
            backgroundColor: theme.colors.warningSoft,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: theme.colors.warning,
          }}
        />
      )}
      <View style={styles.grammarHeader}>
        <Text style={styles.grammarPattern} selectable>{point.pattern}</Text>
        {point.jlpt && jlpt && (
          <View style={[styles.jlptBadge, { backgroundColor: jlpt.bg }]}>
            <Text style={[styles.jlptBadgeText, { color: jlpt.fg }]}>
              {point.jlpt}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.grammarMeaning} selectable>{point.meaning_ko}</Text>
      {point.example_jp.length > 0 && (
        <View style={styles.exampleBox}>
          <Text style={styles.exampleJp} selectable>{point.example_jp}</Text>
          {point.example_ko.length > 0 && (
            <Text style={styles.exampleKo} selectable>{point.example_ko}</Text>
          )}
        </View>
      )}
    </View>
  );
});

export const GrammarSection = memo(function GrammarSection({
  items,
  highlightIdx,
  onClearHighlight,
  forceExpanded,
}: GrammarSectionProps) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const [expanded, setExpanded] = useState(true);
  const isExpanded = forceExpanded ?? expanded;

  useEffect(() => {
    if (highlightIdx != null && !expanded) {
      setExpanded(true);
    }
  }, [highlightIdx, expanded]);

  useEffect(() => {
    if (highlightIdx == null || !onClearHighlight) return;
    const t = setTimeout(() => onClearHighlight(), 4500);
    return () => clearTimeout(t);
  }, [highlightIdx, onClearHighlight]);

  if (items.length === 0) return null;

  return (
    <View style={styles.sectionCard}>
      <SectionHeader
        Icon={Sparkles}
        title="주요 문법"
        count={items.length}
        expanded={isExpanded}
        onToggle={() => setExpanded((v) => !v)}
        styles={styles}
        theme={theme}
      />
      {isExpanded && (
        <View style={styles.sectionBody}>
          {items.map((g, i) => (
            <HighlightedGrammarItem
              key={i}
              point={g}
              isHighlighted={highlightIdx === i}
              styles={styles}
              theme={theme}
            />
          ))}
        </View>
      )}
    </View>
  );
});

interface VocabSectionProps {
  items: KeyVocab[];
  forceExpanded?: boolean;
}

export const VocabSection = memo(function VocabSection({
  items,
  forceExpanded,
}: VocabSectionProps) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const [expanded, setExpanded] = useState(false);
  const isExpanded = forceExpanded ?? expanded;
  if (items.length === 0) return null;

  return (
    <View style={styles.sectionCard}>
      <SectionHeader
        Icon={BookMarked}
        title="핵심 단어"
        count={items.length}
        expanded={isExpanded}
        onToggle={() => setExpanded((v) => !v)}
        styles={styles}
        theme={theme}
      />
      {isExpanded && (
        <View style={styles.sectionBody}>
          {items.map((v, i) => {
            const jlpt = jlptColors(v.jlpt, theme.isDark);
            return (
              <View key={i} style={styles.vocabItem}>
                <View style={styles.vocabLeft}>
                  <Text style={styles.vocabWord} selectable>{v.word}</Text>
                  <Text style={styles.vocabReading} selectable>
                    {v.reading}{v.reading_ko ? ` · ${v.reading_ko}` : ''}
                  </Text>
                </View>
                <View style={styles.vocabRight}>
                  <Text style={styles.vocabMeaning} selectable>{v.meaning_ko}</Text>
                  {v.jlpt && jlpt && (
                    <View style={[styles.jlptBadge, { backgroundColor: jlpt.bg }]}>
                      <Text style={[styles.jlptBadgeText, { color: jlpt.fg }]}>
                        {v.jlpt}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
});

interface QuizSectionProps {
  items: QuizQuestion[];
  onSeeRelatedGrammar?: (grammarIdx: number) => void;
  forceExpanded?: boolean;
}

export const QuizSection = memo(function QuizSection({
  items,
  onSeeRelatedGrammar,
  forceExpanded,
}: QuizSectionProps) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const [expanded, setExpanded] = useState(false);
  const isExpanded = forceExpanded ?? expanded;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answered, setAnswered] = useState<boolean[]>(() => items.map(() => false));
  const [correct, setCorrect] = useState<boolean[]>(() => items.map(() => false));

  if (items.length === 0) return null;
  const q = items[currentIdx];

  const handlePick = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const ok = idx === q.answer_idx;
    setAnswered((arr) => arr.map((a, i) => (i === currentIdx ? true : a)));
    setCorrect((arr) => arr.map((c, i) => (i === currentIdx ? ok : c)));
  };

  const handleNext = () => {
    setPicked(null);
    setCurrentIdx((i) => Math.min(items.length - 1, i + 1));
  };

  const handlePrev = () => {
    setPicked(null);
    setCurrentIdx((i) => Math.max(0, i - 1));
  };

  const score = correct.filter(Boolean).length;
  const totalAnswered = answered.filter(Boolean).length;

  return (
    <View style={styles.sectionCard}>
      <SectionHeader
        Icon={Puzzle}
        title="문법 퀴즈"
        count={items.length}
        expanded={isExpanded}
        onToggle={() => setExpanded((v) => !v)}
        styles={styles}
        theme={theme}
      />
      {isExpanded && (
        <View style={styles.sectionBody}>
          <View style={styles.quizMeta}>
            <Text style={styles.quizMetaText}>
              {currentIdx + 1} / {items.length}
            </Text>
            {totalAnswered > 0 && (
              <Text style={styles.quizScore}>
                정답률 {score}/{totalAnswered}
              </Text>
            )}
          </View>

          <Text style={styles.quizQuestion} selectable>Q. {q.question_ko}</Text>

          <View style={styles.optionsList}>
            {q.options.map((opt, i) => {
              const isPicked = picked === i;
              const isCorrect = i === q.answer_idx;
              const showResult = picked !== null;
              const optStyle = showResult
                ? isCorrect
                  ? styles.optionCorrect
                  : isPicked
                  ? styles.optionWrong
                  : styles.optionMuted
                : styles.optionDefault;
              return (
                <Pressable
                  key={i}
                  onPress={() => handlePick(i)}
                  disabled={picked !== null}
                  style={[styles.optionBtn, optStyle]}
                >
                  <View style={styles.optionMarker}>
                    <Text style={styles.optionMarkerText}>{['A', 'B', 'C', 'D'][i]}</Text>
                  </View>
                  <Text style={styles.optionText} selectable>{opt}</Text>
                  {showResult && isCorrect && (
                    <Check size={16} color={theme.colors.success} strokeWidth={3} />
                  )}
                  {showResult && isPicked && !isCorrect && (
                    <X size={16} color={theme.colors.error} strokeWidth={3} />
                  )}
                </Pressable>
              );
            })}
          </View>

          {picked !== null && (
            <View
              style={[
                styles.explanation,
                picked === q.answer_idx ? styles.explanationOk : styles.explanationNg,
              ]}
            >
              <Text
                style={[
                  styles.explanationLabel,
                  picked === q.answer_idx
                    ? { color: theme.colors.success }
                    : { color: theme.colors.error },
                ]}
              >
                {picked === q.answer_idx ? '정답!' : '오답'}
              </Text>
              <Text style={styles.explanationText} selectable>{q.explanation_ko}</Text>
              {q.grammar_idx >= 0 && onSeeRelatedGrammar && (
                <Pressable
                  onPress={() => onSeeRelatedGrammar(q.grammar_idx)}
                  style={styles.seeGrammarBtn}
                >
                  <Sparkles size={13} color={theme.colors.primary} strokeWidth={2.4} />
                  <Text style={styles.seeGrammarText}>관련 문법 보기</Text>
                  <ArrowUpRight size={13} color={theme.colors.primary} strokeWidth={2.4} />
                </Pressable>
              )}
            </View>
          )}

          <View style={styles.quizNav}>
            <Pressable
              onPress={handlePrev}
              disabled={currentIdx === 0}
              style={[styles.navBtn, currentIdx === 0 && styles.navBtnDisabled]}
            >
              <Text style={styles.navBtnText}>← 이전</Text>
            </Pressable>
            <Pressable
              onPress={handleNext}
              disabled={currentIdx === items.length - 1}
              style={[
                styles.navBtn,
                styles.navBtnPrimary,
                currentIdx === items.length - 1 && styles.navBtnDisabled,
              ]}
            >
              <Text style={[styles.navBtnText, styles.navBtnTextPrimary]}>다음 →</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
});

const useStyles = (theme: Theme) =>
  StyleSheet.create({
    sectionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 18,
      marginBottom: 12,
      ...theme.shadows.sm,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    sectionHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    sectionIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: theme.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: { fontSize: theme.fs(15), fontWeight: '800', color: theme.colors.textPrimary },
    countBadge: {
      minWidth: 22,
      height: 22,
      paddingHorizontal: 6,
      borderRadius: 11,
      backgroundColor: theme.colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countBadgeText: { fontSize: 11, fontWeight: '800', color: theme.colors.textSecondary },
    sectionBody: {
      paddingHorizontal: 18,
      paddingBottom: 18,
      paddingTop: 4,
    },

    grammarItem: { marginBottom: 16 },
    grammarHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    grammarPattern: {
      fontSize: theme.fs(17),
      fontFamily: theme.fonts.jpBold,
      color: theme.colors.textPrimary,
    },
    grammarMeaning: {
      fontSize: theme.fs(13),
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    exampleBox: {
      backgroundColor: theme.colors.surfaceMuted,
      padding: 12,
      borderRadius: 10,
    },
    exampleJp: {
      fontSize: theme.fs(14),
      color: theme.colors.textPrimary,
      fontFamily: theme.fonts.jp,
      lineHeight: theme.fs(22),
      marginBottom: 4,
    },
    exampleKo: {
      fontSize: theme.fs(12),
      color: theme.colors.textSecondary,
      lineHeight: theme.fs(20),
    },

    vocabItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    vocabLeft: { flex: 1 },
    vocabWord: {
      fontSize: theme.fs(17),
      fontFamily: theme.fonts.jpBold,
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    vocabReading: {
      fontSize: theme.fs(11),
      color: theme.colors.textTertiary,
    },
    vocabRight: { alignItems: 'flex-end', gap: 4 },
    vocabMeaning: {
      fontSize: theme.fs(13),
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },

    jlptBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
    jlptBadgeText: { fontSize: 10, fontWeight: '800' },

    quizMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    quizMetaText: { fontSize: 12, color: theme.colors.textTertiary, fontWeight: '700' },
    quizScore: { fontSize: 12, color: theme.colors.primary, fontWeight: '800' },
    quizQuestion: {
      fontSize: theme.fs(15),
      fontWeight: '700',
      color: theme.colors.textPrimary,
      lineHeight: theme.fs(22),
      marginBottom: 16,
    },

    optionsList: { gap: 8 },
    optionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 12,
      borderWidth: 1,
    },
    optionDefault: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
    },
    optionCorrect: {
      backgroundColor: theme.colors.successSoft,
      borderColor: theme.colors.success,
    },
    optionWrong: {
      backgroundColor: theme.colors.errorSoft,
      borderColor: theme.colors.error,
    },
    optionMuted: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      opacity: 0.5,
    },
    optionMarker: {
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: theme.colors.surfaceMuted,
      alignItems: 'center', justifyContent: 'center',
    },
    optionMarkerText: { fontSize: 12, fontWeight: '800', color: theme.colors.textSecondary },
    optionText: {
      fontSize: theme.fs(14),
      color: theme.colors.textPrimary,
      flex: 1,
    },

    explanation: {
      marginTop: 14,
      padding: 14,
      borderRadius: 12,
      borderLeftWidth: 4,
    },
    explanationOk: {
      backgroundColor: theme.colors.successSoft,
      borderLeftColor: theme.colors.success,
    },
    explanationNg: {
      backgroundColor: theme.colors.errorSoft,
      borderLeftColor: theme.colors.error,
    },
    explanationLabel: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
    explanationText: {
      fontSize: theme.fs(13),
      color: theme.colors.textPrimary,
      lineHeight: theme.fs(20),
    },
    seeGrammarBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      marginTop: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    seeGrammarText: {
      fontSize: 12,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.primary,
    },

    quizNav: { flexDirection: 'row', gap: 8, marginTop: 16 },
    navBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceMuted,
    },
    navBtnPrimary: { backgroundColor: theme.colors.primary },
    navBtnDisabled: { opacity: 0.4 },
    navBtnText: {
      fontSize: theme.fs(13),
      fontWeight: '800',
      color: theme.colors.textSecondary,
    },
    navBtnTextPrimary: { color: '#ffffff' },
  });
