import React from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import {
  Sun,
  Moon,
  Smartphone,
  Type,
  Mail,
  ExternalLink,
  Bell,
  BellOff,
  Lightbulb,
  Hand,
  Highlighter,
  Puzzle,
  BookOpenCheck,
} from 'lucide-react-native';

import { useSettingsStore } from '../stores/settingsStore';
import {
  useTheme,
  Theme,
  FontScale,
  ThemeMode,
  FONT_SCALE_LABELS,
  FONT_SCALE_VALUES,
  FONT_SCALE_ORDER,
} from '../utils/theme';
import {
  scheduleDailyReminder,
  cancelDailyReminder,
  requestNotificationPermission,
} from '../utils/notifications';

const DEVELOPER_EMAIL = 'itmu92@gmail.com';

interface Notice {
  date: string;
  title: string;
  body: string;
}

const NOTICES: Notice[] = [
  {
    date: '2026-05-09',
    title: '글자 크기 8단계로 확장',
    body:
      '기존 4단계에서 8단계(초소·특소·작게·보통·크게·특대·초대·최대)로 세분화되어 화면 크기와 시력에 맞춰 더 정밀하게 조정할 수 있습니다.',
  },
  {
    date: '2026-05-05',
    title: '디자인 전면 개편 + 폰트 크기/다크모드',
    body:
      '2026년 트렌드에 맞춘 그라디언트 히어로 카드, 벡터 아이콘, 하단 탭바로 전면 개편되었습니다. 설정에서 폰트 크기, 다크/라이트 모드를 선택할 수 있고 본문 텍스트는 길게 눌러 드래그·복사할 수 있습니다.',
  },
  {
    date: '2026-05-05',
    title: '카테고리 분리 + 학습도구 + 단어 팝업 출시',
    body:
      'NHK 7개 카테고리(종합·사회·연애·정치·경제·국제·스포츠)에서 매일 자동 수집됩니다. 단어 탭 시 누른 위치 옆에 뜻·발음·듣기 팝업이 뜨고, 본문 위쪽에 문법·핵심단어·퀴즈 학습도구가 자동 정리됩니다.',
  },
  {
    date: '2026-05-04',
    title: '한자 잔류 0% 보장',
    body:
      'LLM 번역 후 자동 검증 + 후처리로 한국어 영역에 한자/가나가 단 한 글자도 남지 않도록 강제 정리합니다.',
  },
  {
    date: '2026-05-03',
    title: '앱 출시 (v0.1.0)',
    body:
      '매일 아침 6시 KST에 NHK 뉴스를 자동 수집해 일본어를 한국어와 함께 학습할 수 있습니다.',
  },
];

const VERSION = Constants.expoConfig?.version ?? '0.1.0';
const BUILD = Constants.expoConfig?.android?.versionCode ?? 1;

const FONT_OPTIONS: FontScale[] = FONT_SCALE_ORDER;
const THEME_OPTIONS: { key: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { key: 'light', label: '라이트', Icon: Sun },
  { key: 'dark', label: '다크', Icon: Moon },
  { key: 'system', label: '시스템', Icon: Smartphone },
];

const NOTIFICATION_TIMES = [
  { value: '06:30', label: '아침' },
  { value: '12:00', label: '점심' },
  { value: '21:00', label: '저녁' },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const styles = useStyles(theme);

  const fontScale = useSettingsStore((s) => s.fontScale);
  const setFontScale = useSettingsStore((s) => s.setFontScale);
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const notificationEnabled = useSettingsStore((s) => s.notificationEnabled);
  const setNotificationEnabled = useSettingsStore((s) => s.setNotificationEnabled);
  const notificationTime = useSettingsStore((s) => s.notificationTime);
  const setNotificationTime = useSettingsStore((s) => s.setNotificationTime);

  const handleToggleNotifications = async (next: boolean) => {
    if (next) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          '알림 권한이 필요해요',
          '시스템 설정에서 알림을 켜주세요.'
        );
        return;
      }
      const [hh, mm] = notificationTime.split(':').map(Number);
      await scheduleDailyReminder(hh, mm);
    } else {
      await cancelDailyReminder();
    }
    setNotificationEnabled(next);
  };

  const handleChangeTime = async (t: string) => {
    setNotificationTime(t);
    if (notificationEnabled) {
      const [hh, mm] = t.split(':').map(Number);
      await scheduleDailyReminder(hh, mm);
    }
  };

  const sendEmail = () => {
    const subject = encodeURIComponent('[일본 뉴스 학습앱] 문의 / 요청');
    const body = encodeURIComponent(
      `\n\n---\n앱 버전: ${VERSION} (build ${BUILD})\n작성한 내용을 위에 적어주세요.`
    );
    const url = `mailto:${DEVELOPER_EMAIL}?subject=${subject}&body=${body}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        '메일 앱을 열 수 없습니다',
        `직접 ${DEVELOPER_EMAIL} 으로 보내주세요.`
      );
    });
  };

  const openSourceRepo = () => {
    Linking.openURL('https://github.com/LimGilHyun/jp-news-app').catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 화면 모드 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>화면 모드</Text>
          <View style={styles.card}>
            <View style={styles.segment}>
              {THEME_OPTIONS.map(({ key, label, Icon }) => {
                const active = themeMode === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setThemeMode(key);
                    }}
                    style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                  >
                    <Icon
                      size={16}
                      color={active ? theme.colors.bg : theme.colors.textSecondary}
                      strokeWidth={2.4}
                    />
                    <Text
                      style={[
                        styles.segmentBtnText,
                        active && styles.segmentBtnTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* 알림 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>학습 알림</Text>
          <View style={styles.card}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                handleToggleNotifications(!notificationEnabled);
              }}
              style={styles.notifyToggleRow}
            >
              <View style={styles.notifyIconWrap}>
                {notificationEnabled ? (
                  <Bell size={16} color={theme.colors.primary} strokeWidth={2.4} />
                ) : (
                  <BellOff size={16} color={theme.colors.textTertiary} strokeWidth={2.4} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifyTitle}>데일리 리마인더</Text>
                <Text style={styles.notifySub}>
                  {notificationEnabled
                    ? `매일 ${notificationTime} 에 학습 알림`
                    : '꾸준한 학습을 위한 알림'}
                </Text>
              </View>
              <View
                style={[
                  styles.toggleTrack,
                  notificationEnabled && { backgroundColor: theme.colors.primary },
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    notificationEnabled && styles.toggleThumbOn,
                  ]}
                />
              </View>
            </Pressable>
            {notificationEnabled && (
              <View style={styles.timeChipsRow}>
                {NOTIFICATION_TIMES.map((t) => {
                  const active = notificationTime === t.value;
                  return (
                    <Pressable
                      key={t.value}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        handleChangeTime(t.value);
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
                      <Text
                        style={[
                          styles.timeChipTime,
                          active && styles.timeChipTextActive,
                        ]}
                      >
                        {t.value}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* 폰트 크기 */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.sectionLabel}>글자 크기</Text>
            <Text style={styles.labelHint}>
              본문 · 카드 · 단어장 모든 텍스트에 적용
            </Text>
          </View>
          <View style={styles.card}>
            <View style={styles.fontPreview}>
              <Type size={16} color={theme.colors.textTertiary} strokeWidth={2.2} />
              <Text style={styles.fontPreviewText} numberOfLines={1}>
                東京で桜が満開になりました
              </Text>
            </View>
            <View style={styles.fontSegment}>
              {FONT_OPTIONS.map((opt) => {
                const active = fontScale === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setFontScale(opt);
                    }}
                    style={[styles.fontBtn, active && styles.fontBtnActive]}
                  >
                    <Text
                      style={[
                        styles.fontBtnSize,
                        active && styles.fontBtnTextActive,
                        { fontSize: 11 + FONT_SCALE_VALUES[opt] * 4 },
                      ]}
                    >
                      가
                    </Text>
                    <Text
                      style={[
                        styles.fontBtnLabel,
                        active && styles.fontBtnTextActive,
                      ]}
                    >
                      {FONT_SCALE_LABELS[opt]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* 사용 팁 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>사용 팁</Text>
          <View style={styles.card}>
            <View style={styles.tipRow}>
              <View style={[styles.tipIconWrap, { backgroundColor: theme.colors.primarySoft }]}>
                <Hand size={16} color={theme.colors.primary} strokeWidth={2.4} />
              </View>
              <Text style={styles.tipText}>
                기사 본문의 단어를 탭하면 뜻·발음·듣기 팝업이 뜹니다.
              </Text>
            </View>
            <View style={styles.tipRow}>
              <View style={[styles.tipIconWrap, { backgroundColor: theme.colors.warningSoft }]}>
                <Highlighter size={16} color={theme.colors.warning} strokeWidth={2.4} />
              </View>
              <Text style={styles.tipText}>
                단어를 길게 누르면 형광펜 모드로 전환되어 단어장에 추가할 수 있습니다.
              </Text>
            </View>
            <View style={styles.tipRow}>
              <View style={[styles.tipIconWrap, { backgroundColor: theme.colors.successSoft }]}>
                <Puzzle size={16} color={theme.colors.success} strokeWidth={2.4} />
              </View>
              <Text style={styles.tipText}>
                기사 위 학습도구에서 문법·핵심단어·퀴즈를 확인할 수 있습니다.
              </Text>
            </View>
            <View style={styles.tipRow}>
              <View style={[styles.tipIconWrap, { backgroundColor: theme.colors.accentSoft }]}>
                <BookOpenCheck size={16} color={theme.colors.accent} strokeWidth={2.4} />
              </View>
              <Text style={styles.tipText}>
                저장한 단어는 SRS 단어장에서 망각 곡선 기반으로 복습하세요.
              </Text>
            </View>
            <View style={styles.tipRow}>
              <View style={[styles.tipIconWrap, { backgroundColor: theme.colors.surfaceMuted }]}>
                <Type size={16} color={theme.colors.textSecondary} strokeWidth={2.4} />
              </View>
              <Text style={styles.tipText}>
                원문 보기 모드에서는 본문을 길게 눌러 드래그·복사할 수 있습니다.
              </Text>
            </View>
          </View>
        </View>

        {/* 공지사항 */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Bell size={14} color={theme.colors.textSecondary} strokeWidth={2.4} />
            <Text style={styles.sectionLabel}>공지사항</Text>
          </View>
          <View style={styles.card}>
            {NOTICES.map((n, i) => (
              <View
                key={i}
                style={[styles.noticeItem, i < NOTICES.length - 1 && styles.noticeBorder]}
              >
                <View style={styles.noticeHeader}>
                  <Text style={styles.noticeTitle}>{n.title}</Text>
                  <Text style={styles.noticeDate}>{n.date}</Text>
                </View>
                <Text style={styles.noticeBody}>{n.body}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 시스템 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>시스템 정보</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>앱 버전</Text>
              <Text style={styles.rowValue}>{VERSION}</Text>
            </View>
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel}>빌드</Text>
              <Text style={styles.rowValue}>{BUILD}</Text>
            </View>
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel}>Expo SDK</Text>
              <Text style={styles.rowValue}>{Constants.expoConfig?.sdkVersion ?? '52'}</Text>
            </View>
            <Pressable onPress={openSourceRepo} style={[styles.row, styles.rowBorder]}>
              <View style={styles.rowIconLabel}>
                <ExternalLink size={14} color={theme.colors.textPrimary} strokeWidth={2.2} />
                <Text style={styles.rowLabel}>GitHub</Text>
              </View>
              <Text style={[styles.rowValue, styles.rowLink]}>LimGilHyun/jp-news-app ›</Text>
            </Pressable>
          </View>
        </View>

        {/* 개발자에게 요청 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>개발자에게 요청하기</Text>
          <View style={styles.card}>
            <View style={styles.helpBlock}>
              <View style={styles.helpIconWrap}>
                <Lightbulb size={20} color={theme.colors.primary} strokeWidth={2.2} />
              </View>
              <Text style={styles.helpText}>
                버그 제보, 기능 요청, 번역 개선 제안 등을 환영합니다. 아래 버튼을 누르면 메일 앱이 열립니다.
              </Text>
            </View>
            <Pressable onPress={sendEmail} style={styles.primaryBtn}>
              <Mail size={15} color="#fff" strokeWidth={2.4} />
              <Text style={styles.primaryBtnText}>메일로 보내기</Text>
            </Pressable>
            <Text style={styles.devEmail}>{DEVELOPER_EMAIL}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          © 2026 일본 뉴스 학습 · 데이터 출처: NHK ニュース
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    scroll: { padding: 16, paddingBottom: 120 },

    section: { marginBottom: 22 },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    labelHint: {
      fontSize: 11,
      color: theme.colors.textTertiary,
      marginLeft: 'auto',
      fontWeight: '500',
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.colors.textSecondary,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      paddingHorizontal: 4,
      marginBottom: 8,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 18,
      overflow: 'hidden',
      ...theme.shadows.sm,
    },

    notifyToggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    notifyIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    notifyTitle: {
      fontSize: theme.fs(14),
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textPrimary,
    },
    notifySub: {
      fontSize: 11,
      fontFamily: theme.fonts.bodyMedium,
      color: theme.colors.textTertiary,
      marginTop: 2,
    },
    toggleTrack: {
      width: 44,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.colors.surfaceMuted,
      padding: 3,
    },
    toggleThumb: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#fff',
    },
    toggleThumbOn: {
      transform: [{ translateX: 18 }],
    },
    timeChipsRow: {
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 12,
      paddingBottom: 12,
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    timeChip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceMuted,
    },
    timeChipActive: {
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    timeChipText: {
      fontSize: 11,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textSecondary,
    },
    timeChipTime: {
      fontSize: 12,
      fontFamily: theme.fonts.numBold,
      color: theme.colors.textTertiary,
      marginTop: 2,
    },
    timeChipTextActive: { color: theme.colors.primary },

    segment: {
      flexDirection: 'row',
      padding: 6,
      gap: 4,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 11,
      borderRadius: 12,
    },
    segmentBtnActive: {
      backgroundColor: theme.colors.textPrimary,
    },
    segmentBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    segmentBtnTextActive: { color: theme.colors.bg },

    fontPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    fontPreviewText: {
      fontSize: theme.fs(15),
      color: theme.colors.textPrimary,
      fontWeight: '600',
      flex: 1,
    },
    fontSegment: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 6,
    },
    fontBtn: {
      width: '25%',
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 10,
      gap: 2,
    },
    fontBtnActive: {
      backgroundColor: theme.colors.primarySoft,
    },
    fontBtnSize: {
      fontWeight: '800',
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    fontBtnLabel: {
      fontSize: 10,
      color: theme.colors.textTertiary,
      fontWeight: '700',
    },
    fontBtnTextActive: { color: theme.colors.primary },

    tipRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    tipIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tipText: {
      fontSize: theme.fs(13),
      color: theme.colors.textPrimary,
      lineHeight: theme.fs(20),
      flex: 1,
      paddingTop: 6,
    },

    noticeItem: { padding: 16 },
    noticeBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    noticeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
      gap: 8,
    },
    noticeTitle: {
      fontSize: theme.fs(13),
      fontWeight: '800',
      color: theme.colors.textPrimary,
      flex: 1,
    },
    noticeDate: { fontSize: 10, color: theme.colors.textTertiary, fontWeight: '700' },
    noticeBody: {
      fontSize: theme.fs(12),
      lineHeight: theme.fs(20),
      color: theme.colors.textSecondary,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    rowIconLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rowBorder: { borderTopWidth: 1, borderTopColor: theme.colors.border },
    rowLabel: { fontSize: theme.fs(13), color: theme.colors.textPrimary, fontWeight: '600' },
    rowValue: { fontSize: theme.fs(12), color: theme.colors.textSecondary, fontWeight: '600' },
    rowLink: { color: theme.colors.primary, fontWeight: '700' },

    helpBlock: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 14,
    },
    helpIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    helpText: {
      fontSize: theme.fs(12),
      lineHeight: theme.fs(19),
      color: theme.colors.textSecondary,
      flex: 1,
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 8,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: theme.colors.primary,
    },
    primaryBtnText: { color: '#ffffff', fontSize: theme.fs(13), fontWeight: '800' },
    devEmail: {
      paddingHorizontal: 16,
      paddingBottom: 14,
      fontSize: 11,
      color: theme.colors.textTertiary,
      textAlign: 'center',
    },

    footer: {
      fontSize: 11,
      color: theme.colors.textTertiary,
      textAlign: 'center',
      marginTop: 12,
    },
  });
