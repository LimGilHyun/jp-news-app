import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Article, Token } from '../types/article';
import { mockArticles } from '../data/mockArticles';
import {
  fetchUnreadArticles,
  markAsRead as markAsReadRemote,
  toggleFavorite as toggleFavoriteRemote,
} from '../services/articles';
import { isSupabaseConfigured } from '../services/supabase';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24시간

interface ArticleState {
  articles: Article[];
  lastFetchedAt: number | null;
  loading: boolean;
  error: string | null;
  selectedToken: Token | null;
  useMockData: boolean;

  loadArticles: (opts?: { force?: boolean }) => Promise<void>;
  selectToken: (token: Token | null) => void;
  markAsRead: (articleId: string) => Promise<void>;
  toggleFavorite: (articleId: string) => Promise<void>;
}

export const useArticleStore = create<ArticleState>()(
  persist(
    (set, get) => ({
      articles: [],
      lastFetchedAt: null,
      loading: false,
      error: null,
      selectedToken: null,
      useMockData: !isSupabaseConfigured,

      loadArticles: async (opts) => {
        const force = opts?.force ?? false;
        const last = get().lastFetchedAt ?? 0;
        const fresh = Date.now() - last < CACHE_TTL_MS;

        if (!force && fresh && get().articles.length > 0) {
          // 24시간 이내 캐시가 있으면 네트워크 호출 생략
          return;
        }

        set({ loading: true, error: null });
        try {
          if (get().useMockData) {
            set({ articles: mockArticles, loading: false, lastFetchedAt: Date.now() });
            return;
          }
          const articles = await fetchUnreadArticles();
          set({ articles, loading: false, lastFetchedAt: Date.now() });
        } catch (err) {
          const message = err instanceof Error ? err.message : '기사 로딩 실패';
          set({ error: message, loading: false });
        }
      },

      selectToken: (token) => set({ selectedToken: token }),

      markAsRead: async (articleId) => {
        set((state) => ({
          articles: state.articles.map((a) =>
            a.id === articleId ? { ...a, isRead: true } : a
          ),
        }));
        if (!get().useMockData) {
          try {
            await markAsReadRemote(articleId);
          } catch (err) {
            console.warn('읽음 처리 동기화 실패:', err);
          }
        }
      },

      toggleFavorite: async (articleId) => {
        const target = get().articles.find((a) => a.id === articleId);
        const next = !(target?.isFavorited ?? false);
        set((state) => ({
          articles: state.articles.map((a) =>
            a.id === articleId ? { ...a, isFavorited: next } : a
          ),
        }));
        if (!get().useMockData) {
          try {
            await toggleFavoriteRemote(articleId, next);
          } catch (err) {
            console.warn('즐겨찾기 동기화 실패:', err);
          }
        }
      },
    }),
    {
      name: 'jp-news-app:articles',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        articles: state.articles,
        lastFetchedAt: state.lastFetchedAt,
      }),
    }
  )
);
