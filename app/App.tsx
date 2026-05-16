import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// @gorhom/bottom-sheet 제거 — 실사용처 없는 죽은 의존성 (TurboModule 초기화 부담)
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import * as SplashScreen from 'expo-splash-screen';
import * as Haptics from 'expo-haptics';
import {
  useFonts,
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
  NotoSansKR_700Bold,
  NotoSansKR_900Black,
} from '@expo-google-fonts/noto-sans-kr';
import {
  NotoSansJP_500Medium,
  NotoSansJP_700Bold,
} from '@expo-google-fonts/noto-sans-jp';
import {
  Inter_500Medium,
  Inter_700Bold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import {
  Newspaper,
  BookOpenCheck,
  Settings as SettingsIcon,
  BarChart3,
  GraduationCap,
} from 'lucide-react-native';

import type { Difficulty } from './types/article';

import WelcomeScreen from './screens/WelcomeScreen';
import HomeScreen from './screens/HomeScreen';
import ArticleDetailScreen from './screens/ArticleDetailScreen';
import VocabularyScreen from './screens/VocabularyScreen';
import SettingsScreen from './screens/SettingsScreen';
import StatsScreen from './screens/StatsScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import StudyLevelsScreen from './screens/StudyLevelsScreen';
import StudyWordListScreen from './screens/StudyWordListScreen';
import StudyCardScreen from './screens/StudyCardScreen';
import StudyGrammarListScreen from './screens/StudyGrammarListScreen';
import StudySentenceListScreen from './screens/StudySentenceListScreen';
import CardPreviewScreen from './screens/CardPreviewScreen';
import type { GrammarKind } from './data/jpGrammarTypes';
import type { SentenceKind } from './data/jpSentenceTypes';
import { Article } from './types/article';
import { useTheme, Theme } from './utils/theme';
import { useUiStore } from './stores/uiStore';
import { AdBanner, AD_BANNER_HEIGHT } from './components/AdBanner';
import { InterstitialAdModal } from './components/InterstitialAdModal';

// Splash screen은 useEffect 안에서 처리 (모듈 로드 시점에 부르면 TurboModule 미준비로 크래시)

export type TabParamList = {
  HomeTab: undefined;
  StudyTab: undefined;
  VocabTab: undefined;
  StatsTab: undefined;
  SettingsTab: undefined;
};

export type StudyStackParamList = {
  StudyLevels: undefined;
  StudyWordList: { level: Difficulty };
  StudyCard: { level: Difficulty };
  StudyGrammarList: { kind: GrammarKind };
  StudySentenceList: { kind: SentenceKind };
  CardPreview: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  MainTabs: undefined;
  ArticleDetail: { article: Article; siblingIds?: string[] };
};

const Tabs = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const StudyStack = createNativeStackNavigator<StudyStackParamList>();

const TAB_META: Record<keyof TabParamList, { Icon: typeof Newspaper; label: string }> = {
  HomeTab: { Icon: Newspaper, label: '뉴스' },
  StudyTab: { Icon: GraduationCap, label: '학습' },
  VocabTab: { Icon: BookOpenCheck, label: '단어장' },
  StatsTab: { Icon: BarChart3, label: '통계' },
  SettingsTab: { Icon: SettingsIcon, label: '설정' },
};

function StudyStackNavigator() {
  const theme = useTheme();
  return (
    <StudyStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bgElevated },
        headerTitleStyle: {
          fontFamily: theme.fonts.bodyBlack,
          fontSize: theme.fs(17),
          color: theme.colors.textPrimary,
        },
        headerTintColor: theme.colors.textPrimary,
        headerShadowVisible: false,
      }}
    >
      <StudyStack.Screen
        name="StudyLevels"
        component={StudyLevelsScreen}
        options={{ headerShown: false }}
      />
      <StudyStack.Screen
        name="StudyWordList"
        component={StudyWordListScreen}
        options={{ title: '리스트 학습', headerBackTitle: '' }}
      />
      <StudyStack.Screen
        name="StudyCard"
        component={StudyCardScreen}
        options={{ title: '카드 학습', headerBackTitle: '' }}
      />
      <StudyStack.Screen
        name="StudyGrammarList"
        component={StudyGrammarListScreen}
        options={{ title: '문법', headerBackTitle: '' }}
      />
      <StudyStack.Screen
        name="StudySentenceList"
        component={StudySentenceListScreen}
        options={{ title: '문장', headerBackTitle: '' }}
      />
      <StudyStack.Screen
        name="CardPreview"
        component={CardPreviewScreen}
        options={{ title: '카드 미리보기', headerBackTitle: '' }}
      />
    </StudyStack.Navigator>
  );
}

function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const tabBarHeight = Platform.OS === 'ios' ? 84 : 64;
  const paddingBottom = Platform.OS === 'ios' ? 24 : 8;
  const blurTint = theme.isDark ? 'dark' : 'light';
  const tabBarHidden = useUiStore((s) => s.tabBarHidden);
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: tabBarHidden ? tabBarHeight + 12 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [tabBarHidden, translateY, tabBarHeight]);

  return (
    <Animated.View
      style={[
        tabStyles.wrap,
        {
          height: tabBarHeight,
          bottom: AD_BANNER_HEIGHT,
          borderTopColor: theme.colors.border,
          transform: [{ translateY }],
        },
      ]}
    >
      <BlurView
        intensity={Platform.OS === 'ios' ? 80 : 60}
        tint={blurTint}
        style={StyleSheet.absoluteFillObject}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: theme.isDark
              ? 'rgba(9, 9, 11, 0.96)'
              : 'rgba(255, 255, 255, 0.97)',
          },
        ]}
      />
      <View style={[tabStyles.row, { paddingBottom }]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const meta = TAB_META[route.name as keyof TabParamList];
          const color = focused ? theme.colors.primary : theme.colors.textTertiary;
          const Icon = meta.Icon;

          const onPress = () => {
            Haptics.selectionAsync().catch(() => {});
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={tabStyles.btn}
              accessibilityRole="tab"
              accessibilityState={focused ? { selected: true } : {}}
            >
              <View
                style={[
                  tabStyles.iconWrap,
                  focused && { backgroundColor: theme.colors.primarySoft },
                ]}
              >
                <Icon color={color} size={20} strokeWidth={focused ? 2.4 : 2} />
              </View>
              <Text
                numberOfLines={1}
                style={{
                  color,
                  fontFamily: focused ? theme.fonts.bodyBold : theme.fonts.bodyMedium,
                  fontSize: 11,
                  lineHeight: 14,
                  includeFontPadding: false,
                  textAlign: 'center',
                }}
              >
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

function MainTabs() {
  const theme = useTheme();
  const adHidden = useUiStore((s) => s.adHidden);
  return (
    <View style={{ flex: 1 }}>
      <Tabs.Navigator
        tabBar={(props) => <GlassTabBar {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.bgElevated },
          headerTitleStyle: {
            fontFamily: theme.fonts.bodyBlack,
            fontSize: theme.fs(17),
            color: theme.colors.textPrimary,
          },
          headerTintColor: theme.colors.textPrimary,
          headerShadowVisible: false,
        }}
      >
        <Tabs.Screen name="HomeTab" component={HomeScreen} options={{ title: '오늘의 뉴스' }} />
        <Tabs.Screen name="StudyTab" component={StudyStackNavigator} options={{ title: '학습' }} />
        <Tabs.Screen name="VocabTab" component={VocabularyScreen} options={{ title: '단어장' }} />
        <Tabs.Screen name="StatsTab" component={StatsScreen} options={{ title: '학습 통계' }} />
        <Tabs.Screen name="SettingsTab" component={SettingsScreen} options={{ title: '설정' }} />
      </Tabs.Navigator>
      {/* 광고 배너 — 카드 학습 등 일부 화면에서는 useUiStore.setAdHidden(true)로 숨김 */}
      {!adHidden && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <AdBanner />
        </View>
      )}
    </View>
  );
}

function AppNavigator() {
  const theme = useTheme();
  const navTheme = buildNavTheme(theme);

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.bgElevated },
          headerTintColor: theme.colors.textPrimary,
          headerTitleStyle: {
            fontFamily: theme.fonts.bodyBlack,
            fontSize: theme.fs(17),
          },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.bg },
        }}
      >
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ArticleDetail"
          component={ArticleDetailScreen}
          options={{ title: '기사 학습', headerBackTitle: '' }}
        />
      </Stack.Navigator>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

function buildNavTheme(theme: Theme) {
  const base = theme.isDark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      background: theme.colors.bg,
      card: theme.colors.bgElevated,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
      primary: theme.colors.primary,
    },
  };
}

// 앱이 background로 갔을 때 시각을 기록 → 일정 시간 이상 비활성화 후 active로 복귀하면
// 인터스티셜 광고 모달을 띄운다. (사용자가 앱을 닫고 다시 열 때 광고 노출 패턴)
const RESUME_AD_THRESHOLD_SEC = 15;

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    NotoSansKR_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_700Bold,
    NotoSansKR_900Black,
    NotoSansJP_500Medium,
    NotoSansJP_700Bold,
    Inter_500Medium,
    Inter_700Bold,
    Inter_900Black,
  });
  const [fontTimedOut, setFontTimedOut] = useState(false);
  const [interstitialVisible, setInterstitialVisible] = useState(false);
  const lastBackgroundedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setFontTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, []);

  // AppState 리스너 — 닫고 다시 열 때 인터스티셜 표시
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        lastBackgroundedAtRef.current = Date.now();
        // 닫는 순간에도 모달을 미리 띄워두면, 다시 active 복귀했을 때 그대로 보임
        setInterstitialVisible(true);
      } else if (state === 'active' && lastBackgroundedAtRef.current) {
        const elapsedSec = (Date.now() - lastBackgroundedAtRef.current) / 1000;
        if (elapsedSec >= RESUME_AD_THRESHOLD_SEC) {
          setInterstitialVisible(true);
        } else {
          // 짧게(15초 미만) 다녀온 경우엔 광고 닫음
          setInterstitialVisible(false);
        }
        lastBackgroundedAtRef.current = null;
      }
    });
    return () => sub.remove();
  }, []);

  const ready = fontsLoaded || fontError || fontTimedOut;

  const onLayoutRootView = useCallback(async () => {
    if (ready) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <SafeAreaProvider>
          <AppNavigator />
          <InterstitialAdModal
            visible={interstitialVisible}
            onClose={() => setInterstitialVisible(false)}
          />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

type EBState = { error: Error | null };
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, EBState> {
  state: EBState = { error: null };
  static getDerivedStateFromError(error: Error): EBState {
    return { error };
  }
  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error('AppError:', error?.message, info?.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#0b1220' }}>
          <Text selectable style={{ color: '#fca5a5', fontSize: 18, fontWeight: '900', marginBottom: 12 }}>
            App Error
          </Text>
          <Text selectable style={{ color: '#fff', fontSize: 14, marginBottom: 20 }}>
            {this.state.error?.message ?? String(this.state.error)}
          </Text>
          <Text selectable style={{ color: '#94a3b8', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
            {this.state.error?.stack ?? ''}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const tabStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: { flex: 1, flexDirection: 'row', paddingTop: 8 },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 4,
    gap: 3,
  },
  iconWrap: {
    width: 40,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
