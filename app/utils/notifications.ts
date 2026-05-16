import Constants from 'expo-constants';
import { Platform } from 'react-native';

const REMINDER_IDENTIFIER = 'jp-news-app:daily-reminder';

// Expo Go 감지 — Expo Go SDK 53+ 부터 push notifications 미지원
const isExpoGo = Constants.appOwnership === 'expo';

// expo-notifications 를 lazy require 로 로드 — 모듈 최상단 import 시 TurboModule 초기화 충돌 회피
function getNotifications() {
  return require('expo-notifications') as typeof import('expo-notifications');
}

let handlerSet = false;
function ensureHandler() {
  if (handlerSet) return;
  handlerSet = true;
  if (isExpoGo) return; // Expo Go 에서는 핸들러 설정 시 경고 발생
  try {
    const Notifications = getNotifications();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.warn('알림 handler 설정 실패:', e);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (isExpoGo) {
    // Expo Go 에서는 알림 미지원. dev build 필요
    return false;
  }
  ensureHandler();
  try {
    const Notifications = getNotifications();
    const settings = (await Notifications.getPermissionsAsync()) as unknown as {
      status?: string;
      granted?: boolean;
      ios?: { status?: number };
    };
    if (settings.granted || settings.status === 'granted') return true;
    if (
      settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    ) {
      return true;
    }
    const result = (await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: false,
      },
    })) as unknown as { status?: string; granted?: boolean };
    return !!(result.granted || result.status === 'granted');
  } catch (e) {
    console.warn('알림 권한 요청 실패:', e);
    return false;
  }
}

export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  if (isExpoGo) return; // Expo Go 미지원
  ensureHandler();
  try {
    await cancelDailyReminder();
    const Notifications = getNotifications();
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily-reminder', {
        name: '학습 리마인더',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 200],
      });
    }
    // DAILY trigger — Android/iOS 둘 다 지원 (CALENDAR는 iOS만)
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_IDENTIFIER,
      content: {
        title: '오늘의 NHK 뉴스가 도착했어요 📰',
        body: '5분만 투자해서 일본어 한 걸음 더!',
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        ...(Platform.OS === 'android' ? { channelId: 'daily-reminder' } : {}),
      } as any,
    });
  } catch (e) {
    console.warn('일일 리마인더 등록 실패:', e);
  }
}

export async function cancelDailyReminder(): Promise<void> {
  if (isExpoGo) return;
  try {
    const Notifications = getNotifications();
    await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER);
  } catch {
    // already cancelled or never scheduled
  }
}

export async function cancelAllScheduled(): Promise<void> {
  if (isExpoGo) return;
  try {
    const Notifications = getNotifications();
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('알림 전체 취소 실패:', e);
  }
}

export const NOTIFICATIONS_AVAILABLE = !isExpoGo;
