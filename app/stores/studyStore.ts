import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CardStatus = 'unknown' | 'fuzzy' | 'known';

export interface WordProgress {
  reviewCount: number;       // 본 횟수 (몇 번째 보는가)
  memorized: boolean;        // 외웠음 (단어장에서 「체크」)
  favorited: boolean;        // 즐겨찾기
  lastReviewedAt?: string;   // ISO — 마지막으로 본 시각
  // 카드 학습 SRS 상태
  status?: CardStatus;       // unknown / fuzzy / known (없으면 미학습)
  statusUpdatedAt?: string;  // ISO — status 변경 시각
}

interface StudyState {
  progress: Record<string, WordProgress>; // key: jp surface
  showPronAlways: boolean;                // 한글 발음(ko_pron) 항시 표시 토글
  showKanaAlways: boolean;                // 한글 표기(kana) 항시 표시 토글
  cardTtsEnabled: boolean;                // 카드 학습 TTS 자동 재생
  bumpReview: (jp: string) => void;
  toggleMemorized: (jp: string) => void;
  toggleFavorite: (jp: string) => void;
  setStatus: (jp: string, status: CardStatus) => void;
  resetSessionStatuses: (jpList: string[]) => void; // 다시 학습 시 초기화
  setShowPronAlways: (v: boolean) => void;
  setShowKanaAlways: (v: boolean) => void;
  setCardTtsEnabled: (v: boolean) => void;
  resetProgress: (jp: string) => void;
}

const empty: WordProgress = { reviewCount: 0, memorized: false, favorited: false };

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      progress: {},
      showPronAlways: false,
      showKanaAlways: false,
      cardTtsEnabled: true,

      bumpReview: (jp) => {
        const cur = get().progress[jp] ?? empty;
        set({
          progress: {
            ...get().progress,
            [jp]: {
              ...cur,
              reviewCount: cur.reviewCount + 1,
              lastReviewedAt: new Date().toISOString(),
            },
          },
        });
      },

      toggleMemorized: (jp) => {
        const cur = get().progress[jp] ?? empty;
        set({
          progress: {
            ...get().progress,
            [jp]: { ...cur, memorized: !cur.memorized },
          },
        });
      },

      toggleFavorite: (jp) => {
        const cur = get().progress[jp] ?? empty;
        set({
          progress: {
            ...get().progress,
            [jp]: { ...cur, favorited: !cur.favorited },
          },
        });
      },

      setStatus: (jp, status) => {
        const cur = get().progress[jp] ?? empty;
        set({
          progress: {
            ...get().progress,
            [jp]: {
              ...cur,
              status,
              statusUpdatedAt: new Date().toISOString(),
              reviewCount: cur.reviewCount + 1,
              lastReviewedAt: new Date().toISOString(),
            },
          },
        });
      },

      resetSessionStatuses: (jpList) => {
        const next = { ...get().progress };
        for (const jp of jpList) {
          if (next[jp]) {
            next[jp] = { ...next[jp], status: undefined, statusUpdatedAt: undefined };
          }
        }
        set({ progress: next });
      },

      setShowPronAlways: (v) => set({ showPronAlways: v }),
      setShowKanaAlways: (v) => set({ showKanaAlways: v }),
      setCardTtsEnabled: (v) => set({ cardTtsEnabled: v }),

      resetProgress: (jp) => {
        const next = { ...get().progress };
        delete next[jp];
        set({ progress: next });
      },
    }),
    {
      name: 'jp-news-app:study',
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      migrate: (persisted: any, version) => {
        let next = persisted ?? {};
        if (version < 2) {
          const prev = !!next.showReadingAlways;
          next = { ...next, showPronAlways: prev, showKanaAlways: prev };
        }
        if (version < 3) {
          next = { ...next, cardTtsEnabled: next.cardTtsEnabled ?? true };
        }
        return next;
      },
    }
  )
);

export function getWordProgress(progress: Record<string, WordProgress>, jp: string): WordProgress {
  return progress[jp] ?? empty;
}
