import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronRight, Bell, Target, Sparkles } from 'lucide-react-native';

import { RootStackParamList } from '../App';
import { useSettingsStore, JlptLevel } from '../stores/settingsStore';
import { useStatsStore } from '../stores/statsStore';
import { useTheme, Theme } from '../utils/theme';
import { scheduleDailyReminder, requestNotificationPermission } from '../utils/notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const JLPT_LEVELS: { key: JlptLevel; label: string; sub: string }[] = [
  { key: 'unknown', label: '잘 모름', sub: '처음 시작' },
  { key: 'N5', label: 'N5', sub: '입문' },
  { key: 'N4', label: 'N4', sub: '초급' },
  { key: 'N3', label: 'N3', sub: '중급' },
  { key: 'N2', label: 'N2', sub: '중상급' },
  { key: 'N1', label: 'N1', sub: '상급' },
];

const GOAL_OPTIONS = [
  { value: 15, label: '라이트', desc: '하루 2-3개 기사', emoji: '🌱' },
  { value: 25, label: '표준', desc: '하루 4-5개 기사', emoji: '🌿' },
  { value: 40, label: '챌린지', desc: '매일 꾸준히', emoji: '🌳' },
];

const NOTIFICATION_TIMES = [
  { value: '06:30', label: '아침 06:30' },
  { value: '12:00', label: '점심 12:00' },
  { value: '21:00', label: '저녁 21:00' },
];

export default function OnboardingScreen({ navigation }: Props) {
  const theme = useTheme();
  const styles = useStyles(theme);

  const setOnboarded = useSettingsStore((s) => s.setOnboarded);
  const setUserName = useSettingsStore((s) => s.setUserName);
  const setUserJlpt = useSettingsStore((s) => s.setUserJlpt);
  const setNotificationEnabled = useSettingsStore((s) => s.setNotificationEnabled);
  const setNotificationTime = useSettingsStore((s) => s.setNotificationTime);
  const setDailyGoal = useStatsStore((s) => s.setDailyGoal);

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [name, setName] = useState('');
  const [jlpt, setJlpt] = useState<JlptLevel>('unknown');
  const [goal, setGoal] = useState(25);
  const [notifyOn, setNotifyOn] = useState(true);
  const [notifyTime, setNotifyTime] = useState('06:30');

  const finish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setUserName(name.trim());
    setUserJlpt(jlpt);
    setDailyGoal(goal);
    setNotificationEnabled(notifyOn);
    setNotificationTime(notifyTime);
    setOnboarded(true);

    if (notifyOn) {
      const granted = await requestNotificationPermission();
      if (granted) {
        const [hh, mm] = notifyTime.split(':').map(Number);
        await scheduleDailyReminder(hh, mm);
      } else {
        setNotificationEnabled(false);
      }
    }
    navigation.replace('MainTabs');
  };

  const goNext = () => {
    Haptics.selectionAsync().catch(() => {});
    if (step < 2) setStep((s) => (s + 1) as 0 | 1 | 2);
    else finish();
  };

  const skip = () => {
    Haptics.selectionAsync().catch(() => {});
    setOnboarded(true);
    navigation.replace('MainTabs');
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={theme.colors.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.topBar}>
            <View style={styles.dotRow}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[styles.dot, i === step && styles.dotActive]}
                />
              ))}
            </View>
            <Pressable onPress={skip} hitSlop={8}>
              <Text style={styles.skipText}>건너뛰기</Text>
            </Pressable>
          </View>

          <View style={styles.content}>
            {step === 0 && (
              <View>
                <Text style={styles.heading}>환영해요 👋</Text>
                <Text style={styles.subheading}>
                  매일의 NHK 뉴스로 일본어를 학습할 거예요. 먼저 본인 정보부터.
                </Text>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>이름 (선택)</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="예: 길현"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    style={styles.input}
                    maxLength={20}
                    returnKeyType="done"
                  />
                </View>

                <Text style={[styles.fieldLabel, { marginTop: 22 }]}>
                  현재 일본어 수준
                </Text>
                <View style={styles.levelGrid}>
                  {JLPT_LEVELS.map((lv) => {
                    const active = jlpt === lv.key;
                    return (
                      <Pressable
                        key={lv.key}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setJlpt(lv.key);
                        }}
                        style={[styles.levelChip, active && styles.levelChipActive]}
                      >
                        <Text
                          style={[styles.levelLabel, active && styles.levelLabelActive]}
                        >
                          {lv.label}
                        </Text>
                        <Text
                          style={[styles.levelSub, active && styles.levelSubActive]}
                        >
                          {lv.sub}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {step === 1 && (
              <View>
                <View style={styles.iconHeader}>
                  <Target size={32} color="#fff" strokeWidth={2.4} />
                </View>
                <Text style={styles.heading}>일일 목표 XP</Text>
                <Text style={styles.subheading}>
                  매일 얼마나 학습할까요? 언제든 설정에서 바꿀 수 있어요.
                </Text>

                <View style={styles.goalList}>
                  {GOAL_OPTIONS.map((opt) => {
                    const active = goal === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setGoal(opt.value);
                        }}
                        style={[styles.goalCard, active && styles.goalCardActive]}
                      >
                        <Text style={styles.goalEmoji}>{opt.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.goalLabel}>{opt.label}</Text>
                          <Text style={styles.goalDesc}>{opt.desc}</Text>
                        </View>
                        <View style={styles.goalValueWrap}>
                          <Text style={styles.goalValue}>{opt.value}</Text>
                          <Text style={styles.goalValueUnit}>XP</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {step === 2 && (
              <View>
                <View style={styles.iconHeader}>
                  <Bell size={32} color="#fff" strokeWidth={2.4} />
                </View>
                <Text style={styles.heading}>알림 설정</Text>
                <Text style={styles.subheading}>
                  매일 같은 시간에 학습 리마인더를 받아 꾸준히 이어가세요.
                </Text>

                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setNotifyOn((v) => !v);
                  }}
                  style={[
                    styles.toggleRow,
                    notifyOn && styles.toggleRowActive,
                  ]}
                >
                  <Text style={styles.toggleLabel}>학습 리마인더</Text>
                  <View style={[styles.toggleTrack, notifyOn && styles.toggleTrackOn]}>
                    <View
                      style={[
                        styles.toggleThumb,
                        notifyOn && styles.toggleThumbOn,
                      ]}
                    />
                  </View>
                </Pressable>

                {notifyOn && (
                  <View style={styles.timeRow}>
                    {NOTIFICATION_TIMES.map((t) => {
                      const active = notifyTime === t.value;
                      return (
                        <Pressable
                          key={t.value}
                          onPress={() => {
                            Haptics.selectionAsync().catch(() => {});
                            setNotifyTime(t.value);
                          }}
                          style={[styles.timeChip, active && styles.timeChipActive]}
                        >
                          <Text
                            style={[
                              styles.timeChipText,
                              active && styles.timeChipTextActive,
                            ]}
                          >
                            {t.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                <View style={styles.summary}>
                  <Sparkles size={18} color="#fff" strokeWidth={2.4} />
                  <Text style={styles.summaryText}>
                    설정 완료 후 바로 첫 기사 추천을 받을 수 있어요.
                  </Text>
                </View>
              </View>
            )}
          </View>

          <Pressable onPress={goNext} style={styles.cta}>
            <Text style={styles.ctaText}>
              {step < 2 ? '다음' : '시작하기'}
            </Text>
            <ChevronRight size={20} color={theme.colors.primary} strokeWidth={2.5} />
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const useStyles = (theme: Theme) =>
  StyleSheet.create({
    safe: { flex: 1, paddingHorizontal: 24 },

    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
      paddingBottom: 24,
    },
    dotRow: { flexDirection: 'row', gap: 6 },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255,255,255,0.35)',
    },
    dotActive: { backgroundColor: '#fff', width: 22 },
    skipText: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: 13,
      fontFamily: theme.fonts.bodyBold,
    },

    content: { flex: 1, justifyContent: 'flex-start' },
    iconHeader: {
      width: 60,
      height: 60,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },
    heading: {
      fontSize: theme.fs(28),
      fontFamily: theme.fonts.bodyBlack,
      color: '#fff',
      letterSpacing: -0.5,
      marginBottom: 8,
    },
    subheading: {
      fontSize: theme.fs(14),
      fontFamily: theme.fonts.bodyMedium,
      color: 'rgba(255,255,255,0.85)',
      lineHeight: theme.fs(22),
      marginBottom: 28,
    },

    field: { marginBottom: 4 },
    fieldLabel: {
      fontSize: 12,
      fontFamily: theme.fonts.bodyBold,
      color: 'rgba(255,255,255,0.85)',
      marginBottom: 8,
      letterSpacing: 0.4,
    },
    input: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.18)',
      color: '#fff',
      fontSize: theme.fs(15),
      fontFamily: theme.fonts.body,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.22)',
    },

    levelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    levelChip: {
      flexBasis: '31%',
      paddingVertical: 14,
      paddingHorizontal: 6,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
    },
    levelChipActive: {
      backgroundColor: '#fff',
      borderColor: '#fff',
    },
    levelLabel: {
      fontSize: theme.fs(15),
      fontFamily: theme.fonts.numBlack,
      color: '#fff',
    },
    levelLabelActive: { color: theme.colors.primary },
    levelSub: {
      fontSize: 10,
      fontFamily: theme.fonts.bodyMedium,
      color: 'rgba(255,255,255,0.75)',
      marginTop: 2,
    },
    levelSubActive: { color: theme.colors.textSecondary },

    goalList: { gap: 10 },
    goalCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.18)',
    },
    goalCardActive: {
      backgroundColor: '#fff',
      borderColor: '#fff',
    },
    goalEmoji: { fontSize: 28 },
    goalLabel: {
      fontSize: theme.fs(16),
      fontFamily: theme.fonts.bodyBlack,
      color: '#fff',
    },
    goalDesc: {
      fontSize: 11,
      fontFamily: theme.fonts.bodyMedium,
      color: 'rgba(255,255,255,0.75)',
      marginTop: 2,
    },
    goalValueWrap: { alignItems: 'flex-end' },
    goalValue: {
      fontSize: theme.fs(20),
      fontFamily: theme.fonts.numBlack,
      color: '#fff',
    },
    goalValueUnit: {
      fontSize: 10,
      fontFamily: theme.fonts.bodyBold,
      color: 'rgba(255,255,255,0.75)',
    },

    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.14)',
      marginBottom: 12,
    },
    toggleRowActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
    toggleLabel: {
      fontSize: theme.fs(15),
      fontFamily: theme.fonts.bodyBold,
      color: '#fff',
    },
    toggleTrack: {
      width: 46,
      height: 26,
      borderRadius: 13,
      backgroundColor: 'rgba(255,255,255,0.25)',
      padding: 3,
    },
    toggleTrackOn: { backgroundColor: '#fff' },
    toggleThumb: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#fff',
    },
    toggleThumbOn: {
      backgroundColor: theme.colors.primary,
      transform: [{ translateX: 20 }],
    },
    timeRow: { flexDirection: 'row', gap: 8 },
    timeChip: {
      flex: 1,
      paddingVertical: 11,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
    },
    timeChipActive: { backgroundColor: '#fff' },
    timeChipText: {
      fontSize: 12,
      fontFamily: theme.fonts.bodyBold,
      color: '#fff',
    },
    timeChipTextActive: { color: theme.colors.primary },

    summary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 20,
      padding: 14,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.14)',
    },
    summaryText: {
      flex: 1,
      fontSize: theme.fs(12),
      fontFamily: theme.fonts.bodyMedium,
      color: 'rgba(255,255,255,0.92)',
      lineHeight: theme.fs(18),
    },

    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 16,
      borderRadius: 999,
      backgroundColor: '#fff',
      marginBottom: 8,
    },
    ctaText: {
      fontSize: theme.fs(16),
      fontFamily: theme.fonts.bodyBlack,
      color: theme.colors.primary,
    },
  });
