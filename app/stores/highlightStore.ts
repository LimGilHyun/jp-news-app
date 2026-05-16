import { create } from 'zustand';

import { Highlight, Quality } from '../types/article';
import {
  CreateHighlightInput,
  createHighlight as createRemote,
  deleteHighlight as deleteRemote,
  fetchHighlights as fetchRemote,
  reviewHighlight as reviewRemote,
} from '../services/highlights';
import { isSupabaseConfigured } from '../services/supabase';
import { applySrs } from '../utils/srs';
import { useStatsStore } from './statsStore';

interface HighlightState {
  highlights: Highlight[];
  loading: boolean;
  error: string | null;

  loadHighlights: () => Promise<void>;
  addHighlight: (input: CreateHighlightInput) => Promise<Highlight>;
  removeHighlight: (id: string) => Promise<void>;
  reviewHighlight: (id: string, quality: Quality) => Promise<void>;
}

export const useHighlightStore = create<HighlightState>((set, get) => ({
  highlights: [],
  loading: false,
  error: null,

  loadHighlights: async () => {
    if (!isSupabaseConfigured) return;
    set({ loading: true, error: null });
    try {
      const highlights = await fetchRemote();
      set({ highlights, loading: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : '단어장 로딩 실패';
      set({ error: message, loading: false });
    }
  },

  addHighlight: async (input) => {
    const buildLocal = (): Highlight => ({
      id: 'local-' + Date.now(),
      articleId: input.articleId,
      sentenceIdx: input.sentenceIdx,
      startTokenIdx: input.startTokenIdx,
      endTokenIdx: input.endTokenIdx,
      selectedText: input.selectedText,
      reading: input.reading,
      meaning: input.meaning,
      color: input.color ?? 'yellow',
      note: input.note,
      createdAt: new Date().toISOString(),
      easeFactor: 2.5,
      intervalDays: 0,
      repetition: 0,
      nextReviewAt: new Date().toISOString(),
    });

    if (!isSupabaseConfigured) {
      const local = buildLocal();
      set((s) => ({ highlights: [local, ...s.highlights] }));
      return local;
    }

    // Supabase 설정돼 있으면 우선 remote 시도, 실패 시 local 로 폴백
    try {
      const created = await createRemote(input);
      set((s) => ({ highlights: [created, ...s.highlights] }));
      return created;
    } catch (e) {
      console.warn('Supabase 단어장 저장 실패 → 로컬 저장으로 폴백:', e);
      const local = buildLocal();
      set((s) => ({ highlights: [local, ...s.highlights] }));
      return local;
    }
  },

  removeHighlight: async (id) => {
    set((s) => ({ highlights: s.highlights.filter((h) => h.id !== id) }));
    if (isSupabaseConfigured && !id.startsWith('local-')) {
      try {
        await deleteRemote(id);
      } catch (e) {
        console.warn('형광펜 삭제 동기화 실패:', e);
      }
    }
  },

  reviewHighlight: async (id, quality) => {
    const target = get().highlights.find((h) => h.id === id);
    if (!target) return;
    useStatsStore.getState().grantVocabReview();
    if (isSupabaseConfigured && !id.startsWith('local-')) {
      try {
        const updated = await reviewRemote(target, quality);
        set((s) => ({
          highlights: s.highlights.map((h) => (h.id === id ? updated : h)),
        }));
        return;
      } catch (e) {
        console.warn('SRS 동기화 실패, 로컬만 갱신:', e);
      }
    }
    const next = applySrs(target, quality);
    set((s) => ({
      highlights: s.highlights.map((h) => (h.id === id ? { ...h, ...next } : h)),
    }));
  },
}));
