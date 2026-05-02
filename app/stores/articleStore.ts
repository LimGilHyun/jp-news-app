import { create } from 'zustand';

import { Article, Token } from '../types/article';
import { mockArticles } from '../data/mockArticles';
import {
  fetchUnreadArticles,
  markAsRead as markAsReadRemote,
  toggleFavorite as toggleFavoriteRemote,
} from '../services/articles';
import { isSupabaseConfigured } from '../services/supabase';

interface ArticleState {
  articles: Article[];
  loading: boolean;
  error: string | null;
  selectedToken: Token | null;
  useMockData: boolean;

  loadArticles: () => Promise<void>;
  selectToken: (token: Token | null) => void;
  markAsRead: (articleId: string) => Promise<void>;
  toggleFavorite: (articleId: string) => Promise<void>;
}

export const useArticleStore = create<ArticleState>((set, get) => ({
  articles: [],
  loading: false,
  error: null,
  selectedToken: null,
  useMockData: !isSupabaseConfigured,

  loadArticles: async () => {
    set({ loading: true, error: null });
    try {
      if (get().useMockData) {
        set({ articles: mockArticles, loading: false });
        return;
      }
      const articles = await fetchUnreadArticles();
      set({ articles, loading: false });
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
}));
