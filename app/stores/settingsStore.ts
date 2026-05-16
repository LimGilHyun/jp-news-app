import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { FontScale, ThemeMode } from '../utils/themeTypes';

export type ViewMode = 'tokenized' | 'original' | 'summary';

export type JlptLevel = 'unknown' | 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

interface SettingsState {
  showKoTranslation: boolean;
  showKoReading: boolean;
  viewMode: ViewMode;
  fontScale: FontScale;
  themeMode: ThemeMode;
  onboarded: boolean;
  userName: string;
  userJlpt: JlptLevel;
  notificationEnabled: boolean;
  notificationTime: string; // 'HH:mm' KST
  furiganaEnabled: boolean;
  setShowKoTranslation: (v: boolean) => void;
  toggleKoTranslation: () => void;
  setShowKoReading: (v: boolean) => void;
  toggleKoReading: () => void;
  setViewMode: (v: ViewMode) => void;
  toggleViewMode: () => void;
  setFontScale: (s: FontScale) => void;
  setThemeMode: (m: ThemeMode) => void;
  setOnboarded: (v: boolean) => void;
  setUserName: (n: string) => void;
  setUserJlpt: (j: JlptLevel) => void;
  setNotificationEnabled: (v: boolean) => void;
  setNotificationTime: (t: string) => void;
  setFuriganaEnabled: (v: boolean) => void;
  toggleFurigana: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      showKoTranslation: false,
      showKoReading: false,
      viewMode: 'tokenized',
      fontScale: 'medium',
      themeMode: 'system',
      onboarded: false,
      userName: '',
      userJlpt: 'unknown',
      notificationEnabled: false,
      notificationTime: '06:30',
      furiganaEnabled: false,
      setShowKoTranslation: (v) => set({ showKoTranslation: v }),
      toggleKoTranslation: () => set({ showKoTranslation: !get().showKoTranslation }),
      setShowKoReading: (v) => set({ showKoReading: v }),
      toggleKoReading: () => set({ showKoReading: !get().showKoReading }),
      setViewMode: (v) => set({ viewMode: v }),
      toggleViewMode: () => {
        const cycle: Record<ViewMode, ViewMode> = {
          tokenized: 'original',
          original: 'summary',
          summary: 'tokenized',
        };
        set({ viewMode: cycle[get().viewMode] });
      },
      setFontScale: (s) => set({ fontScale: s }),
      setThemeMode: (m) => set({ themeMode: m }),
      setOnboarded: (v) => set({ onboarded: v }),
      setUserName: (n) => set({ userName: n }),
      setUserJlpt: (j) => set({ userJlpt: j }),
      setNotificationEnabled: (v) => set({ notificationEnabled: v }),
      setNotificationTime: (t) => set({ notificationTime: t }),
      setFuriganaEnabled: (v) => set({ furiganaEnabled: v }),
      toggleFurigana: () => set({ furiganaEnabled: !get().furiganaEnabled }),
    }),
    {
      name: 'jp-news-app:settings',
      storage: createJSONStorage(() => AsyncStorage),
      version: 5,
      migrate: (persisted: unknown, version: number) => {
        const s = (persisted ?? {}) as Record<string, unknown>;
        if (version < 5) {
          // koMode: 'off' | 'translation' | 'reading' → 두 개의 독립 boolean
          const old = s.koMode as string | undefined;
          s.showKoTranslation = old === 'translation';
          s.showKoReading = old === 'reading';
          delete s.koMode;
        }
        return s;
      },
    }
  )
);
