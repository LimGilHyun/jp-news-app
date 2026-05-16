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
import { useStatsStore } from './statsStore';

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
          const fetched = await fetchUnreadArticles();
          // 로컬 read/favorite 상태 보존 — 서버 데이터에 덮어쓰기 시 사용자 진척 유지
          const oldById = new Map(get().articles.map((a) => [a.id, a]));
          const merged: Article[] = fetched.map((a) => {
            const old = oldById.get(a.id);
            if (!old) return a;
            return {
              ...a,
              isRead: a.isRead || old.isRead,
              isFavorited: a.isFavorited || old.isFavorited,
            };
          });
          set({ articles: merged, loading: false, lastFetchedAt: Date.now() });
        } catch (err) {
          const message = err instanceof Error ? err.message : '기사 로딩 실패';
          set({ error: message, loading: false });
        }
      },

      selectToken: (token) => set({ selectedToken: token }),

      markAsRead: async (articleId) => {
        const wasRead = get().articles.find((a) => a.id === articleId)?.isRead;
        set((state) => ({
          articles: state.articles.map((a) =>
            a.id === articleId ? { ...a, isRead: true } : a
          ),
        }));
        if (!wasRead) {
          useStatsStore.getState().grantArticleRead(articleId);
        }
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
