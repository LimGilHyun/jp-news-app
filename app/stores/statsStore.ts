import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const XP_PER_ARTICLE = 5;
const XP_PER_VOCAB_REVIEW = 2;
const XP_PER_QUIZ_CORRECT = 3;
const XP_LEVEL_STEP = 100;

export const DEFAULT_DAILY_GOAL = 25;

function kstDateKey(d: Date = new Date()): string {
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

interface StatsState {
  totalXp: number;
  dailyXp: Record<string, number>;
  streak: number;
  lastActiveDate: string | null;
  dailyGoal: number;
  articlesReadIds: string[];

  grantArticleRead: (articleId: string) => void;
  grantVocabReview: () => void;
  grantQuizCorrect: () => void;
  setDailyGoal: (n: number) => void;

  getTodayXp: () => number;
  getCurrentStreak: () => number;
  getLevel: () => { level: number; xpInLevel: number; xpToNext: number };
}

function pruneDailyXp(map: Record<string, number>): Record<string, number> {
  const today = kstDateKey();
  const cutoff = new Date(today + 'T00:00:00');
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffKey = kstDateKey(cutoff);
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(map)) {
    if (k >= cutoffKey) out[k] = v;
  }
  return out;
}

function nextStreak(prev: number, lastActive: string | null, today: string): number {
  if (!lastActive) return 1;
  if (lastActive === today) return prev || 1;
  const diff = dayDiff(lastActive, today);
  if (diff === 1) return prev + 1;
  if (diff > 1) return 1;
  return prev || 1;
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      totalXp: 0,
      dailyXp: {},
      streak: 0,
      lastActiveDate: null,
      dailyGoal: DEFAULT_DAILY_GOAL,
      articlesReadIds: [],

      grantArticleRead: (articleId) => {
        const state = get();
        if (state.articlesReadIds.includes(articleId)) return;
        const today = kstDateKey();
        const next = pruneDailyXp({ ...state.dailyXp });
        next[today] = (next[today] ?? 0) + XP_PER_ARTICLE;
        set({
          totalXp: state.totalXp + XP_PER_ARTICLE,
          dailyXp: next,
          streak: nextStreak(state.streak, state.lastActiveDate, today),
          lastActiveDate: today,
          articlesReadIds: [...state.articlesReadIds, articleId],
        });
      },

      grantVocabReview: () => {
        const state = get();
        const today = kstDateKey();
        const next = pruneDailyXp({ ...state.dailyXp });
        next[today] = (next[today] ?? 0) + XP_PER_VOCAB_REVIEW;
        set({
          totalXp: state.totalXp + XP_PER_VOCAB_REVIEW,
          dailyXp: next,
          streak: nextStreak(state.streak, state.lastActiveDate, today),
          lastActiveDate: today,
        });
      },

      grantQuizCorrect: () => {
        const state = get();
        const today = kstDateKey();
        const next = pruneDailyXp({ ...state.dailyXp });
        next[today] = (next[today] ?? 0) + XP_PER_QUIZ_CORRECT;
        set({
          totalXp: state.totalXp + XP_PER_QUIZ_CORRECT,
          dailyXp: next,
          streak: nextStreak(state.streak, state.lastActiveDate, today),
          lastActiveDate: today,
        });
      },

      setDailyGoal: (n) => set({ dailyGoal: Math.max(5, Math.min(200, n)) }),

      getTodayXp: () => get().dailyXp[kstDateKey()] ?? 0,

      getCurrentStreak: () => {
        const state = get();
        if (!state.lastActiveDate) return 0;
        const diff = dayDiff(state.lastActiveDate, kstDateKey());
        if (diff === 0 || diff === 1) return state.streak;
        return 0;
      },

      getLevel: () => {
        const total = get().totalXp;
        const level = Math.floor(total / XP_LEVEL_STEP) + 1;
        const xpInLevel = total % XP_LEVEL_STEP;
        return { level, xpInLevel, xpToNext: XP_LEVEL_STEP };
      },
    }),
    {
      name: 'jp-news-app:stats',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    }
  )
);
